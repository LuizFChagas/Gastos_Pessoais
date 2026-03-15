from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from sqlalchemy.orm import Session

from src.database.database import SessionLocal
from src.database.models import Usuario

from src.auth.security import criar_token


router = APIRouter()


class CadastroRequest(BaseModel):
    email: str
    senha: str


class LoginRequest(BaseModel):
    email: str
    senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest):

    db: Session = SessionLocal()

    usuario_existente = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    if usuario_existente:

        raise HTTPException(
            status_code=400,
            detail="Usuário já existe"
        )

    novo_usuario = Usuario(
        email=dados.email,
        senha=dados.senha
    )

    db.add(novo_usuario)
    db.commit()

    db.close()

    return {"message": "Usuário criado com sucesso"}


@router.post("/login")
def login(dados: LoginRequest):

    db: Session = SessionLocal()

    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    if not usuario or usuario.senha != dados.senha:

        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    token = criar_token(usuario.id)

    db.close()

    return {
        "access_token": token,
        "token_type": "bearer"
    }