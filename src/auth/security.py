from datetime import datetime, timedelta
from jose import jwt, JWTError

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import os
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não definida no .env")


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