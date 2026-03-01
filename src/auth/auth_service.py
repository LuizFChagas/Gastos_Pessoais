import json
import hashlib
from pathlib import Path

CAMINHO_USUARIOS = Path("src/auth/usuarios.json")


def hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode()).hexdigest()


def carregar_usuarios() -> dict:
    if not CAMINHO_USUARIOS.exists():
        return {}
    with open(CAMINHO_USUARIOS, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_usuarios(usuarios: dict):
    CAMINHO_USUARIOS.parent.mkdir(parents=True, exist_ok=True)
    with open(CAMINHO_USUARIOS, "w", encoding="utf-8") as f:
        json.dump(usuarios, f, indent=2, ensure_ascii=False)



def cadastrar_usuario(usuario: str, senha: str) -> bool:
    usuarios = carregar_usuarios()

    if usuario in usuarios:
        return False  

    usuarios[usuario] = {
        "senha_hash": hash_senha(senha),
        "ativo": True
    }

    salvar_usuarios(usuarios)
    return True


def autenticar(usuario: str, senha: str) -> bool:
    usuarios = carregar_usuarios()

    if usuario not in usuarios:
        return False

    if not usuarios[usuario]["ativo"]:
        return False

    return usuarios[usuario]["senha_hash"] == hash_senha(senha)


def desativar_usuario(usuario: str) -> bool:
    usuarios = carregar_usuarios()

    if usuario not in usuarios:
        return False

    usuarios[usuario]["ativo"] = False
    salvar_usuarios(usuarios)
    return True