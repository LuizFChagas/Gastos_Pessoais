from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import os

from src.database.models import Sugestao, Usuario
from src.auth.security import pegar_usuario_logado, get_db_autenticado
from src.services.email_service import enviar_sugestao_admin

router = APIRouter()


class SugestaoIn(BaseModel):
    texto: str


@router.post("")
def criar_sugestao(
    body: SugestaoIn,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado),
):
    if not body.texto.strip():
        raise HTTPException(status_code=400, detail="Sugestão não pode ser vazia")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    sug = Sugestao(
        usuario_id=usuario_id,
        texto=body.texto.strip(),
        criado_em=datetime.utcnow(),
    )
    db.add(sug)
    db.commit()

    admin_email = os.getenv("ADMIN_EMAIL") or os.getenv("SMTP_USER")
    if admin_email and usuario:
        try:
            enviar_sugestao_admin(
                admin_email=admin_email,
                texto=body.texto.strip(),
                nome_usuario=usuario.nome or usuario.email,
                email_usuario=usuario.email,
            )
        except Exception:
            pass

    return {"ok": True}
