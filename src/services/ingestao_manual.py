from sqlalchemy.orm import Session
from datetime import datetime

from src.database.database import SessionLocal
from src.database.models import Gasto


def parse_data(data_str: str) -> datetime:
    try:
        return datetime.fromisoformat(data_str)
    except:
        try:
            return datetime.strptime(data_str, "%d/%m/%Y")
        except:
            return datetime.now()


def adicionar_gasto_manual(
    descricao: str,
    valor: float,
    categoria: str,
    usuario_id: int,
    banco: str,
    tipo: str,  # 👈 NOVO
    data_hora: str | None = None
):

    db: Session = SessionLocal()

    descricao = (descricao or "").strip()
    if not descricao:
        descricao = "Sem descrição"

    if data_hora:
        data = parse_data(data_hora)
    else:
        data = datetime.now()

    gasto = Gasto(
        descricao=descricao,
        valor=valor,
        categoria=categoria,
        banco=banco,
        tipo=tipo,  # 👈 IMPORTANTE
        data_hora=data,
        usuario_id=usuario_id
    )

    db.add(gasto)
    db.commit()
    db.close()