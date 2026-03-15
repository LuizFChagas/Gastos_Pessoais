from sqlalchemy.orm import Session
from datetime import datetime

from src.database.database import SessionLocal
from src.database.models import Gasto


def adicionar_gasto_manual(
    descricao: str,
    valor: float,
    categoria: str,
    usuario_id: int,
    data_hora: str | None = None
):

    db: Session = SessionLocal()

    if data_hora:
        data = datetime.fromisoformat(data_hora)
    else:
        data = datetime.now()

    gasto = Gasto(
        descricao=descricao,
        valor=valor,
        categoria=categoria,
        data_hora=data,
        usuario_id=usuario_id
    )

    db.add(gasto)
    db.commit()
    db.close()