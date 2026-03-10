from src.database.database import SessionLocal
from src.database.models import Usuario


def cadastrar_usuario(usuario: str, senha: str):

    db = SessionLocal()

    novo_usuario = Usuario(
        usuario=usuario,
        senha=senha
    )

    db.add(novo_usuario)
    db.commit()

    db.close()


def autenticar_usuario(usuario: str, senha: str):

    db = SessionLocal()

    user = db.query(Usuario).filter(
        Usuario.usuario == usuario
    ).first()

    db.close()

    if not user:
        return None

    if user.senha != senha:
        return None

    return user