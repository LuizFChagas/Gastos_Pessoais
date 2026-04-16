from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import logging

from src.database.deps import get_db
from src.database.models import Usuario, Gasto

from src.auth.security import criar_token, pegar_usuario_logado
from src.auth.hash import gerar_hash, verificar_senha


logger = logging.getLogger(__name__)

router = APIRouter()


class CadastroRequest(BaseModel):
    email: str
    senha: str = Field(min_length=6)
    nome: str
    data_nascimento: str  # "YYYY-MM-DD"


class LoginRequest(BaseModel):
    email: str
    senha: str
    remember_me: bool = False


@router.post("/cadastro")
def cadastro(dados: CadastroRequest, db: Session = Depends(get_db)):

    email = dados.email.lower()

    # Validação de idade mínima (18 anos)
    try:
        nascimento = date.fromisoformat(dados.data_nascimento)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data de nascimento inválida")

    hoje = date.today()
    idade = hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
    if idade < 18:
        raise HTTPException(status_code=400, detail="Você precisa ter pelo menos 18 anos para se cadastrar")

    usuario_existente = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Usuário já existe"
        )

    novo_usuario = Usuario(
        email=email,
        senha=gerar_hash(dados.senha),
        nome=dados.nome.strip(),
        data_nascimento=dados.data_nascimento
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    logger.info(f"Novo usuário cadastrado: {email}")

    return {
        "message": "Usuário criado com sucesso",
        "email": novo_usuario.email
    }


@router.post("/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):

    email = dados.email.lower()

    usuario = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if not usuario or not verificar_senha(dados.senha, usuario.senha):
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    token = criar_token(usuario.id, remember_me=dados.remember_me)

    logger.info(f"Usuário logado: {email}")

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def me(usuario_id: int = Depends(pegar_usuario_logado), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    total_transacoes = db.query(func.count(Gasto.id)).filter(Gasto.usuario_id == usuario_id).scalar() or 0
    total_entradas   = db.query(func.coalesce(func.sum(Gasto.valor), 0)).filter(
        Gasto.usuario_id == usuario_id, Gasto.tipo == "entrada"
    ).scalar() or 0
    total_saidas     = db.query(func.coalesce(func.sum(Gasto.valor), 0)).filter(
        Gasto.usuario_id == usuario_id, Gasto.tipo == "saida", Gasto.valor > 0
    ).scalar() or 0

    primeira_transacao = db.query(func.min(Gasto.data_hora)).filter(
        Gasto.usuario_id == usuario_id
    ).scalar()

    return {
        "id":               usuario.id,
        "nome":             usuario.nome,
        "email":            usuario.email,
        "data_nascimento":  usuario.data_nascimento,
        "criado_em":        primeira_transacao.isoformat() if primeira_transacao else None,
        "total_transacoes": total_transacoes,
        "total_entradas":   float(total_entradas),
        "total_saidas":     float(total_saidas),
    }