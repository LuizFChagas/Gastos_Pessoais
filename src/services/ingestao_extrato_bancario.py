from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import pandas as pd
import logging

from src.database.database import SessionLocal
from src.database.models import Gasto
from src.services.categorizador import categorizar

logger = logging.getLogger(__name__)


def importar_extrato(caminho_extrato, usuario_id):

    try:
        df = pd.read_csv(caminho_extrato, sep=";")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Erro ao ler o CSV"
        )

    colunas_necessarias = {
        "Data de Compra",
        "Descrição",
        "Valor (em R$)"
    }

    if not colunas_necessarias.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail="CSV inválido. Formato não reconhecido"
        )

    db: Session = SessionLocal()

    # ✅ LOOP TEM QUE ESTAR AQUI DENTRO
    for _, linha in df.iterrows():
        try:
            descricao = str(linha["Descrição"]).strip()
            valor = float(linha["Valor (em R$)"])

            data_hora = datetime.strptime(
                linha["Data de Compra"], "%d/%m/%Y"
            )

            categoria = categorizar(descricao)

            tipo = "entrada" if valor > 0 else "saida"  # 👈 NOVO

        except Exception:
            continue

        existe = db.query(Gasto).filter(
            Gasto.usuario_id == usuario_id,
            Gasto.descricao == descricao,
            Gasto.valor == valor,
            Gasto.data_hora == data_hora
        ).first()

        if existe:
            continue

        gasto = Gasto(
            descricao=descricao,
            valor=valor,
            categoria=categoria,
            tipo=tipo,  # 👈 IMPORTANTE
            data_hora=data_hora,
            usuario_id=usuario_id
        )

        db.add(gasto)

    db.commit()
    db.close()

    logger.info(f"Importação finalizada para usuário {usuario_id}")