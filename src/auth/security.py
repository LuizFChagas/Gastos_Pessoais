from datetime import datetime, timedelta
from jose import jwt, JWTError

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.core.config import SECRET_KEY
from src.database.deps import get_db


ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30

COOKIE_NAME = "access_token"

# auto_error=False: o Authorization header vira só um fallback opcional —
# a fonte principal do token agora é o cookie httpOnly (ver pegar_usuario_logado)
security = HTTPBearer(auto_error=False)


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


def definir_cookie_auth(response: Response, token: str, remember_me: bool = False):
    """Guarda o JWT num cookie httpOnly — nunca fica acessível via JS/localStorage."""
    cookie_kwargs = dict(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    if remember_me:
        cookie_kwargs["max_age"] = ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER * 24 * 60 * 60
    # sem "manter conectado": cookie de sessão (sem max_age) — some quando o navegador fecha
    response.set_cookie(**cookie_kwargs)


def limpar_cookie_auth(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="none", secure=True)


def pegar_usuario_logado(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):

    token = request.cookies.get(COOKIE_NAME)
    if not token and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado"
        )

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        usuario_id = int(payload.get("sub"))

        return usuario_id

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


def get_db_autenticado(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db),
) -> Session:
    """Sessão de banco com o contexto do usuário logado já setado pra RLS
    (SET LOCAL via set_config — o comando SET puro não aceita bind parameter).
    Usar no lugar de get_db em toda rota que também dependa de
    pegar_usuario_logado; o FastAPI cacheia a resolução por request, então
    o JWT não é decodificado duas vezes."""
    db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(usuario_id)})
    return db


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