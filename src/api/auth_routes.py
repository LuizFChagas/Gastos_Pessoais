from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import logging

from src.database.deps import get_db
from src.database.models import Usuario

from src.auth.security import criar_token
from src.auth.hash import gerar_hash, verificar_senha


logger = logging.getLogger(__name__)

router = APIRouter()


class CadastroRequest(BaseModel):
    email: str
    senha: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: str
    senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest, db: Session = Depends(get_db)):

    email = dados.email.lower()

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
        senha=gerar_hash(dados.senha)
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

    token = criar_token(usuario.id)

    logger.info(f"Usuário logado: {email}")

    return {
        "access_token": token,
        "token_type": "bearer"
    }