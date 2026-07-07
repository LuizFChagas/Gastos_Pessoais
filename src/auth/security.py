from datetime import datetime, timedelta
from jose import jwt, JWTError

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from src.core.config import SECRET_KEY
from src.database.deps import get_db


ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30


security = HTTPBearer()


def criar_token(usuario_id: int, remember_me: bool = False):

    if remember_me:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER)
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(usuario_id),
        "exp": expire
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token


def pegar_usuario_logado(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        usuario_id = int(payload.get("sub"))

        return usuario_id

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


def exigir_premium(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    from src.database.models import Usuario

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario or usuario.plano != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recurso disponível apenas para o plano Premium"
        )

    return usuario_id