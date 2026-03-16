from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.database.deps import get_db
from src.database.models import Usuario

from src.auth.security import criar_token
from src.auth.hash import gerar_hash, verificar_senha


router = APIRouter()


class CadastroRequest(BaseModel):

    email: str

    senha: str = Field(min_length=6)


class LoginRequest(BaseModel):

    email: str

    senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest, db: Session = Depends(get_db)):

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
        senha=gerar_hash(dados.senha)
    )

    db.add(novo_usuario)

    db.commit()

    return {"message": "Usuário criado com sucesso"}


@router.post("/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):

    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    if not usuario or not verificar_senha(dados.senha, usuario.senha):

        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    token = criar_token(usuario.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }