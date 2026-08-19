from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
import logging
import re
import os
import secrets
import time
import urllib.request
import urllib.parse
import json
from collections import defaultdict

from src.database.deps import get_db
from src.database.models import Usuario, Gasto, Extrato

from src.auth.security import criar_token, pegar_usuario_logado, definir_cookie_auth, limpar_cookie_auth, get_db_autenticado
from src.auth.hash import gerar_hash, verificar_senha
from src.services.email_service import enviar_otp, enviar_verificacao, enviar_reset_senha


logger = logging.getLogger(__name__)

router = APIRouter()

# ── Rate limiting ─────────────────────────────────────────────
_tentativas: dict[str, list[float]] = defaultdict(list)

def _checar_rate_limit(ip: str) -> bool:
    agora = time.time()
    janela = 15 * 60
    validas = [t for t in _tentativas[ip] if agora - t < janela]
    _tentativas[ip] = validas
    if len(validas) >= 10:
        return False
    _tentativas[ip].append(agora)
    return True


# ── Schemas ──────────────────────────────────────────────────

_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CadastroRequest(BaseModel):
    email: str
    senha: str = Field(min_length=8, max_length=72)
    nome: str
    data_nascimento: str  # "YYYY-MM-DD"

    @field_validator("email")
    @classmethod
    def _validar_email(cls, v: str) -> str:
        if not _EMAIL_REGEX.match(v.strip()):
            raise ValueError("Email inválido")
        return v


class LoginRequest(BaseModel):
    email: str
    senha: str
    remember_me: bool = False
    captcha_token: str = ""


class VerificarOTPRequest(BaseModel):
    email: str
    codigo: str
    remember_me: bool = False


class Toggle2FARequest(BaseModel):
    ativar: bool
    senha_atual: str


class EsqueciSenhaRequest(BaseModel):
    email: str


class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8, max_length=72)


# ── Helpers ──────────────────────────────────────────────────

def _verificar_captcha(token: str) -> bool:
    secret = os.getenv("RECAPTCHA_SECRET_KEY", "")
    if not secret:
        logger.warning("RECAPTCHA_SECRET_KEY não definida — verificação de captcha desabilitada")
        return True
    if not token:
        return False
    try:
        data = urllib.parse.urlencode({"secret": secret, "response": token}).encode()
        req = urllib.request.Request("https://www.google.com/recaptcha/api/siteverify", data=data)
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read())
        return result.get("success", False)
    except Exception:
        return False


def _gerar_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def _senha_forte(senha: str) -> bool:
    return (
        len(senha) >= 8 and
        bool(re.search(r'[A-Z]', senha)) and
        bool(re.search(r'[0-9]', senha)) and
        bool(re.search(r'[^A-Za-z0-9]', senha))
    )


# ── Rotas ────────────────────────────────────────────────────

@router.post("/cadastro")
def cadastro(dados: CadastroRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    if not _checar_rate_limit(f"cadastro:{ip}"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")

    email = dados.email.lower()

    try:
        nascimento = date.fromisoformat(dados.data_nascimento)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data de nascimento inválida")

    hoje = date.today()
    idade = hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
    if idade < 18:
        raise HTTPException(status_code=400, detail="Você precisa ter pelo menos 18 anos para se cadastrar")

    if not _senha_forte(dados.senha):
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um símbolo"
        )

    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")

    token = secrets.token_urlsafe(32)
    novo_usuario = Usuario(
        email=email,
        senha=gerar_hash(dados.senha),
        nome=dados.nome.strip(),
        data_nascimento=dados.data_nascimento,
        email_verificado=False,
        verificacao_token=token,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    try:
        enviar_verificacao(email, token, dados.nome.strip())
    except Exception as e:
        logger.error(f"Erro ao enviar email de verificação: {e}")

    logger.info(f"Novo usuário cadastrado: {email}")
    return {"message": "Conta criada. Verifique seu email para ativar a conta."}


@router.get("/verificar-email")
def verificar_email(token: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.verificacao_token == token).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado")
    usuario.email_verificado = True
    usuario.verificacao_token = None
    db.commit()
    return {"message": "Email verificado com sucesso"}


@router.post("/login")
def login(dados: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"

    if not _checar_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")

    if not _verificar_captcha(dados.captcha_token):
        raise HTTPException(status_code=400, detail="Verificação CAPTCHA falhou")

    email = dados.email.lower()
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario or not verificar_senha(dados.senha, usuario.senha):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    # email_verificado NULL = usuário antigo, tratar como verificado
    if usuario.email_verificado is False:
        raise HTTPException(status_code=403, detail="Verifique seu email antes de fazer login")

    if usuario.two_fa_enabled:
        codigo = _gerar_otp()
        usuario.otp_code   = codigo
        usuario.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        try:
            enviar_otp(usuario.email, codigo, usuario.nome or "")
        except Exception as e:
            logger.error(f"Erro ao enviar OTP: {e}")
            raise HTTPException(status_code=500, detail="Erro ao enviar código por email")
        logger.info(f"OTP enviado para: {email}")
        return {"requires_2fa": True, "email": email}

    token = criar_token(usuario.id, remember_me=dados.remember_me)
    definir_cookie_auth(response, token, dados.remember_me)
    logger.info(f"Usuário logado: {email}")
    return {"message": "Login realizado com sucesso"}


@router.post("/verify-otp")
def verify_otp(dados: VerificarOTPRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    if not _checar_rate_limit(f"otp:{ip}"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")

    email = dados.email.lower()
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario or not usuario.otp_code:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado")

    if datetime.utcnow() > usuario.otp_expiry:
        usuario.otp_code = None
        usuario.otp_expiry = None
        db.commit()
        raise HTTPException(status_code=400, detail="Código expirado. Faça login novamente.")

    if dados.codigo != usuario.otp_code:
        raise HTTPException(status_code=400, detail="Código incorreto")

    usuario.otp_code   = None
    usuario.otp_expiry = None
    db.commit()

    token = criar_token(usuario.id, remember_me=dados.remember_me)
    definir_cookie_auth(response, token, dados.remember_me)
    logger.info(f"2FA verificado com sucesso: {email}")
    return {"message": "Login realizado com sucesso"}


@router.post("/logout")
def logout(response: Response):
    limpar_cookie_auth(response)
    return {"message": "Logout realizado com sucesso"}


@router.post("/toggle-2fa")
def toggle_2fa(
    dados: Toggle2FARequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not verificar_senha(dados.senha_atual, usuario.senha):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    usuario.two_fa_enabled = dados.ativar
    db.commit()
    return {"two_fa_enabled": usuario.two_fa_enabled}


@router.post("/esqueci-senha")
def esqueci_senha(dados: EsqueciSenhaRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    if not _checar_rate_limit(f"esqueci-senha:{ip}"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")

    email = dados.email.lower()
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario:
        token = secrets.token_urlsafe(32)
        usuario.reset_token = token
        usuario.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        try:
            enviar_reset_senha(email, token, usuario.nome or "")
        except Exception as e:
            logger.error(f"Erro ao enviar email de reset: {e}")
    return {"message": "Se o email estiver cadastrado, você receberá um link de recuperação"}


@router.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.reset_token == dados.token).first()
    if not usuario or not usuario.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado")

    if datetime.utcnow() > usuario.reset_token_expiry:
        usuario.reset_token = None
        usuario.reset_token_expiry = None
        db.commit()
        raise HTTPException(status_code=400, detail="Link expirado. Solicite um novo.")

    if not _senha_forte(dados.nova_senha):
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter pelo menos 8 caracteres, uma maiúscula, um número e um símbolo"
        )

    usuario.senha = gerar_hash(dados.nova_senha)
    usuario.reset_token = None
    usuario.reset_token_expiry = None
    db.commit()
    logger.info(f"Senha redefinida para: {usuario.email}")
    return {"message": "Senha redefinida com sucesso"}


@router.get("/me")
def me(usuario_id: int = Depends(pegar_usuario_logado), db: Session = Depends(get_db_autenticado)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    total_transacoes = db.query(func.count(Gasto.id)).filter(Gasto.usuario_id == usuario_id).scalar() or 0

    # valor é criptografado (não soma/compara no SQL) — soma em Python depois de decifrado
    gastos_tipo_valor = db.query(Gasto.tipo, Gasto.valor).filter(Gasto.usuario_id == usuario_id).all()
    total_entradas = sum(float(v) for t, v in gastos_tipo_valor if t == "entrada")
    total_saidas   = sum(float(v) for t, v in gastos_tipo_valor if t == "saida" and v > 0)

    criado_em = usuario.criado_em
    if not criado_em:
        primeiro_extrato = db.query(func.min(Extrato.data_importacao)).filter(
            Extrato.usuario_id == usuario_id
        ).scalar()
        criado_em = primeiro_extrato

    return {
        "id":               usuario.id,
        "nome":             usuario.nome,
        "email":            usuario.email,
        "data_nascimento":  usuario.data_nascimento,
        "criado_em":        criado_em.isoformat() if criado_em else None,
        "two_fa_enabled":   bool(usuario.two_fa_enabled),
        "plano":            usuario.plano or "free",
        "total_transacoes": total_transacoes,
        "total_entradas":   float(total_entradas),
        "total_saidas":     float(total_saidas),
    }
