from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from collections import Counter
import calendar
import unicodedata
import pandas as pd
import logging

from src.database.database import SessionLocal
from src.database.models import Gasto
from src.services.categorizador import categorizar

logger = logging.getLogger(__name__)


KEYWORDS_ESTORNO = ["estorno", "reembolso", "devolução", "devolucao", "chargeback", "cancelamento"]

KEYWORDS_PAGAMENTO_FATURA = ["pagamento recebido", "pagamento de fatura", "pagamento fatura"]

KEYWORDS_IGNORAR_CONTA = [
    "valor adicionado na conta por cartão",
    "valor adicionado para pix no crédito",
    "valor adicionado para pix no credito",
]

def _is_estorno(descricao: str) -> bool:
    return any(k in descricao.lower() for k in KEYWORDS_ESTORNO)

def _is_pagamento_fatura(descricao: str) -> bool:
    return any(k in descricao.lower() for k in KEYWORDS_PAGAMENTO_FATURA)

def _is_ignorar_conta(descricao: str) -> bool:
    return any(k in descricao.lower() for k in KEYWORDS_IGNORAR_CONTA)

def _normalizar(texto: str) -> str:
    """Remove acentos e converte para minúsculo — usado para comparar nomes de colunas."""
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii").lower().strip()


def _detectar_formato(df):
    """Detecta o formato do CSV."""
    colunas_raw = list(df.columns.str.strip())
    colunas_norm = {_normalizar(c): c for c in colunas_raw}
    colunas_set = set(colunas_raw)

    # Nubank fatura: date, title, amount
    if {"date", "title", "amount"}.issubset(colunas_set):
        return "nubank_fatura"

    # Nubank conta corrente: Data, Valor, Identificador, Descrição (encoding pode variar)
    if {"data", "valor", "identificador"}.issubset(colunas_norm.keys()):
        return "nubank_conta"

    # Formato legado: Data de Compra, Descrição, Valor (em R$)
    if {"Data de Compra", "Descrição", "Valor (em R$)"}.issubset(colunas_set):
        return "legado"

    return None


def _processar_linha_nubank_fatura(linha):
    descricao = str(linha["title"]).strip()
    valor = float(linha["amount"])
    data_hora = datetime.strptime(str(linha["date"]).strip(), "%Y-%m-%d")
    return descricao, valor, data_hora


def _processar_linha_nubank_conta(linha, colunas_map):
    """Processa linha do extrato de conta corrente Nubank."""
    col_data = colunas_map.get("data", "Data")
    col_valor = colunas_map.get("valor", "Valor")
    col_desc = colunas_map.get("descricao", "Descrição")

    valor = float(str(linha[col_valor]).replace(",", "."))
    data_hora = datetime.strptime(str(linha[col_data]).strip(), "%d/%m/%Y")
    desc_raw = str(linha[col_desc]).strip()

    # Limpa a descrição extraindo a parte mais relevante
    descricao = _limpar_descricao_conta(desc_raw)

    return descricao, valor, data_hora


def _limpar_descricao_conta(desc: str) -> str:
    """Extrai a parte útil da descrição do extrato de conta."""
    partes = desc.split(" - ")
    tipo = partes[0].strip()

    if "Compra no débito" in tipo or "Compra no debito" in tipo:
        # "Compra no débito - NOME LOJA" → "NOME LOJA"
        return " - ".join(partes[1:]).strip() if len(partes) > 1 else tipo

    if "Pix" in tipo or "Transferência" in tipo or "Transferencia" in tipo:
        # "Transferência recebida pelo Pix - NOME - CPF - BANCO..." → "Pix - NOME"
        nome = partes[1].strip() if len(partes) > 1 else tipo
        prefixo = "Pix Recebido" if any(p in tipo.lower() for p in ["recebida", "recebido"]) else "Pix Enviado"
        return f"{prefixo} - {nome}"

    return tipo


def _processar_linha_legado(linha):
    descricao = str(linha["Descrição"]).strip()
    valor = float(linha["Valor (em R$)"])
    data_hora = datetime.strptime(str(linha["Data de Compra"]).strip(), "%d/%m/%Y")
    return descricao, valor, data_hora


def _detectar_mes_dominante(transacoes):
    """Retorna (ano, mes) se um único mês tem mais de 50% das transações."""
    if not transacoes:
        return None

    contagem = Counter((t[2].year, t[2].month) for t in transacoes)
    (ano, mes), count = contagem.most_common(1)[0]

    if count / len(transacoes) > 0.5:
        return (ano, mes)

    return None


def _ajustar_data(data_hora, ano_alvo, mes_alvo):
    """Mantém o dia mas substitui ano/mês pelo mês dominante."""
    ultimo_dia = calendar.monthrange(ano_alvo, mes_alvo)[1]
    dia = min(data_hora.day, ultimo_dia)
    return data_hora.replace(year=ano_alvo, month=mes_alvo, day=dia)


def importar_extrato(caminho_extrato, usuario_id, extrato_id=None, banco=None):

    formato = None
    df = None

    for encoding in ["utf-8", "latin1", "utf-8-sig"]:
        for sep in [",", ";"]:
            try:
                df_tentativa = pd.read_csv(caminho_extrato, sep=sep, encoding=encoding)
                fmt = _detectar_formato(df_tentativa)
                if fmt:
                    df = df_tentativa
                    formato = fmt
                    break
            except Exception:
                continue
        if formato:
            break

    if df is None or not formato:
        raise HTTPException(status_code=400, detail="CSV inválido. Formato não reconhecido")

    # Mapa de colunas normalizadas → nome real (para nubank_conta com encoding variável)
    colunas_map = {_normalizar(c): c for c in df.columns.str.strip()}

    # Pré-passada: coleta valores adicionados por cartão no extrato da conta
    # Esses valores indicam Pix enviados financiados pelo crédito — o custo real
    # está na fatura, então ignoramos o "Pix Enviado" de mesmo valor no extrato.
    valores_pix_credito: set[float] = set()
    if formato == "nubank_conta":
        col_desc = colunas_map.get("descricao", "Descrição")
        col_valor = colunas_map.get("valor", "Valor")
        for _, linha in df.iterrows():
            try:
                desc_raw = str(linha[col_desc]).strip().lower()
                if any(k in desc_raw for k in KEYWORDS_IGNORAR_CONTA):
                    v = abs(float(str(linha[col_valor]).replace(",", ".")))
                    valores_pix_credito.add(round(v, 2))
            except Exception:
                continue

    # Primeira passada: coleta todas as transações válidas
    transacoes = []
    for _, linha in df.iterrows():
        try:
            if formato == "nubank_fatura":
                descricao, valor, data_hora = _processar_linha_nubank_fatura(linha)
            elif formato == "nubank_conta":
                descricao, valor, data_hora = _processar_linha_nubank_conta(linha, colunas_map)
            else:
                descricao, valor, data_hora = _processar_linha_legado(linha)

            # Ignorar pagamento de fatura
            if _is_pagamento_fatura(descricao):
                continue

            # Ignorar entradas intermediárias (Pix no crédito)
            if formato == "nubank_conta" and _is_ignorar_conta(descricao):
                continue

            # Ignorar Pix Enviado que é repasse de crédito (valor idêntico ao adicionado)
            # O custo real (com taxa) já está na fatura do cartão
            if formato == "nubank_conta" and descricao.startswith("Pix Enviado"):
                if round(abs(valor), 2) in valores_pix_credito:
                    logger.info(f"Pix Enviado ignorado (repasse de crédito, R$ {valor}): {descricao}")
                    continue

            # Lógica de tipo por formato:
            # - Fatura: positivo = saída, negativo = entrada/estorno
            # - Conta:  positivo = entrada, negativo = saída/estorno
            if formato == "nubank_fatura":
                if valor < 0 and _is_estorno(descricao):
                    tipo = "saida"
                    valor_abs = -abs(valor)
                else:
                    tipo = "saida" if valor > 0 else "entrada"
                    valor_abs = abs(valor)
            else:  # nubank_conta e legado
                if valor < 0 and _is_estorno(descricao):
                    tipo = "saida"
                    valor_abs = -abs(valor)
                else:
                    tipo = "entrada" if valor > 0 else "saida"
                    valor_abs = abs(valor)

            categoria = categorizar(descricao)
            transacoes.append((descricao, valor_abs, data_hora, tipo, categoria))

        except Exception:
            continue

    # Detecta mês dominante e ajusta datas fora do padrão
    mes_dominante = _detectar_mes_dominante(transacoes)

    if mes_dominante:
        ano_alvo, mes_alvo = mes_dominante
        transacoes_ajustadas = []
        for descricao, valor_abs, data_hora, tipo, categoria in transacoes:
            data_original = None
            if (data_hora.year, data_hora.month) != (ano_alvo, mes_alvo):
                logger.info(
                    f"Data {data_hora.date()} fora do mês dominante "
                    f"{mes_alvo:02d}/{ano_alvo} — ajustando: {descricao}"
                )
                data_original = data_hora
                data_hora = _ajustar_data(data_hora, ano_alvo, mes_alvo)
            transacoes_ajustadas.append((descricao, valor_abs, data_hora, tipo, categoria, data_original))
    else:
        transacoes_ajustadas = [
            (d, v, dh, t, c, None) for d, v, dh, t, c in transacoes
        ]

    # Segunda passada: persiste no banco
    db: Session = SessionLocal()

    for descricao, valor_abs, data_hora, tipo, categoria, data_original in transacoes_ajustadas:
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
            data_original=data_original,
            banco=banco,
            usuario_id=usuario_id,
            extrato_id=extrato_id
        )
        db.add(gasto)

    db.commit()
    db.close()

    logger.info(
        f"Importação finalizada para usuário {usuario_id} "
        f"(formato: {formato}, mês dominante: {mes_dominante})"
    )
