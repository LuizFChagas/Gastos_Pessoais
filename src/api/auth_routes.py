from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.auth.auth_service import cadastrar_usuario, autenticar_usuario


router = APIRouter()


class CadastroRequest(BaseModel):
    usuario: str
    senha: str


class LoginRequest(BaseModel):
    usuario: str
    senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest):

    cadastrar_usuario(
        usuario=dados.usuario,
        senha=dados.senha
    )

    return {"message": "Usuário cadastrado com sucesso"}


@router.post("/login")
def login(dados: LoginRequest):

    user = autenticar_usuario(
        usuario=dados.usuario,
        senha=dados.senha
    )

    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {"message": "Login realizado com sucesso"}