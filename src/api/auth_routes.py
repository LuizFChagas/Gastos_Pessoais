from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.auth.auth_service import autenticar, cadastrar_usuario

router = APIRouter()


class CadastroRequest(BaseModel):
    usuario: str
    senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest):
    sucesso = cadastrar_usuario(dados.usuario, dados.senha)
    if not sucesso:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    return {"message": "Usuário cadastrado com sucesso"}


@router.post("/login")
def login(dados: CadastroRequest):
    if not autenticar(dados.usuario, dados.senha):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"message": "Login realizado com sucesso"}