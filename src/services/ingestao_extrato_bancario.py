import pandas as pd
from sqlalchemy.orm import Session
from src.database.database import SessionLocal
from src.database.models import Gasto


def importar_extrato(caminho_extrato, usuario_id):

    df = pd.read_csv(caminho_extrato)

    # validação das colunas obrigatórias
    colunas_esperadas = {"descricao", "valor", "categoria"}

    if not colunas_esperadas.issubset(df.columns):
        raise ValueError(
            "CSV inválido. O arquivo deve conter as colunas: descricao, valor, categoria"
        )

    db: Session = SessionLocal()

    try:

        for _, linha in df.iterrows():

            gasto = Gasto(
                descricao=linha["descricao"],
                valor=float(linha["valor"]),
                categoria=linha["categoria"],
                data_hora=linha.get("data_hora"),
                usuario_id=usuario_id
            )

            db.add(gasto)

        db.commit()

    finally:

        db.close()