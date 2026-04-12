from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import pandas as pd
import logging

from src.database.database import SessionLocal
from src.database.models import Gasto
from src.services.categorizador import categorizar

logger = logging.getLogger(__name__)


def _detectar_formato(df):
    """Detecta o formato do CSV e retorna o nome das colunas padronizadas."""
    colunas = set(df.columns.str.strip())

    # Formato Nubank: date, title, amount
    if {"date", "title", "amount"}.issubset(colunas):
        return "nubank"

    # Formato legado: Data de Compra, Descrição, Valor (em R$)
    if {"Data de Compra", "Descrição", "Valor (em R$)"}.issubset(colunas):
        return "legado"

    return None


def _processar_linha_nubank(linha):
    descricao = str(linha["title"]).strip()
    valor = float(linha["amount"])
    data_hora = datetime.strptime(str(linha["date"]).strip(), "%Y-%m-%d")
    return descricao, valor, data_hora


def _processar_linha_legado(linha):
    descricao = str(linha["Descrição"]).strip()
    valor = float(linha["Valor (em R$)"])
    data_hora = datetime.strptime(str(linha["Data de Compra"]).strip(), "%d/%m/%Y")
    return descricao, valor, data_hora


def importar_extrato(caminho_extrato, usuario_id, extrato_id=None, banco=None):

    # Tenta detectar separador automaticamente
    for sep in [",", ";"]:
        try:
            df = pd.read_csv(caminho_extrato, sep=sep)
            formato = _detectar_formato(df)
            if formato:
                break
        except Exception:
            continue
    else:
        raise HTTPException(status_code=400, detail="Erro ao ler o CSV")

    if not formato:
        raise HTTPException(status_code=400, detail="CSV inválido. Formato não reconhecido")

    db: Session = SessionLocal()

    for _, linha in df.iterrows():
        try:
            if formato == "nubank":
                descricao, valor, data_hora = _processar_linha_nubank(linha)
            else:
                descricao, valor, data_hora = _processar_linha_legado(linha)

            # No Nubank: positivo = gasto (saida), negativo = pagamento (entrada)
            tipo = "saida" if valor > 0 else "entrada"
            valor_abs = abs(valor)

            categoria = categorizar(descricao)

        except Exception:
            continue

        existe = db.query(Gasto).filter(
            Gasto.usuario_id == usuario_id,
            Gasto.descricao == descricao,
            Gasto.valor == valor_abs,
            Gasto.data_hora == data_hora
        ).first()

        if existe:
            continue

        gasto = Gasto(
            descricao=descricao,
            valor=valor_abs,
            categoria=categoria,
            tipo=tipo,
            data_hora=data_hora,
            banco=banco,
            usuario_id=usuario_id,
            extrato_id=extrato_id
        )

        db.add(gasto)

    db.commit()
    db.close()

    logger.info(f"Importação finalizada para usuário {usuario_id} (formato: {formato})")
