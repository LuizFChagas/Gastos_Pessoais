from datetime import datetime
from typing import Optional

from src.database.database import SessionLocal
from src.database.models import Gasto, Usuario


def adicionar_gasto_manual(
    descricao: str,
    valor: float,
    categoria: str,
    data_hora: Optional[datetime] = None
):

    db = SessionLocal()

    usuario = db.query(Usuario).first()

    if not usuario:
        raise Exception("Nenhum usuário encontrado")

    if data_hora is None:
        data_hora = datetime.utcnow()

    gasto = Gasto(
        descricao=descricao,
        valor=valor,
        categoria=categoria,
        data_hora=data_hora,
        usuario_id=usuario.id
    )

    db.add(gasto)

    db.commit()

    db.close()