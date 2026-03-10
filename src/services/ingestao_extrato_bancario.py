import pandas as pd
from datetime import datetime

from src.database.database import SessionLocal
from src.database.models import Gasto, Usuario


def importar_extrato(caminho_extrato):

    df = pd.read_csv(caminho_extrato)

    db = SessionLocal()

    usuario = db.query(Usuario).first()

    if not usuario:
        raise Exception("Nenhum usuário encontrado")

    for _, row in df.iterrows():

        data = row.get("data_hora")

        if pd.isna(data):
            data = datetime.utcnow()
        else:
            data = pd.to_datetime(data)

        gasto = Gasto(
            descricao=row["descricao"],
            valor=row["valor"],
            categoria=row["categoria"],
            data_hora=data,
            usuario_id=usuario.id
        )

        db.add(gasto)

    db.commit()

    db.close()