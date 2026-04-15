from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
from collections import Counter
import calendar
import unicodedata
import re
import pandas as pd
import logging

from src.database.database import SessionLocal
from src.database.models import Gasto
from src.services.categorizador import categorizar

logger = logging.getLogger(__name__)


KEYWORDS_ESTORNO = ["estorno", "reembolso", "devolução", "devolucao", "chargeback", "cancelamento"]

KEYWORDS_PAGAMENTO_FATURA = [
    "pagamento recebido",
    "pagamento de fatura",
    "pagamento fatura",
    "pgto fat cartao",      # C6 Bank
    "pgto fatura",          # Bradesco
    "pag fatura",           # Bradesco variação
]

KEYWORDS_SKIP_BRADESCO = [
    "filtro de result", "os dados acima", "ultimos lancamentos",
    "nao ha lancamentos", "cod. lanc.", "total",
]

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


def _detectar_skiprows(caminho: str, encoding: str, sep: str) -> int:
    """Detecta a linha do cabeçalho real em CSVs com metadados iniciais (C6, Bradesco)."""
    try:
        with open(caminho, encoding=encoding, errors="replace") as f:
            for i, linha in enumerate(f):
                partes = linha.strip().split(sep)
                if len(partes) >= 4:
                    linha_norm = _normalizar(linha)
                    # C6 conta
                    if "entrada" in linha_norm and "saida" in linha_norm:
                        return i
                    # Bradesco conta
                    if "credito" in linha_norm and "debito" in linha_norm and "historico" in linha_norm:
                        return i
    except Exception:
        pass
    return 0


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

    # C6 conta corrente: Entrada(R$) e Saída(R$) separadas
    if "entrada(r$)" in colunas_norm and "saida(r$)" in colunas_norm:
        return "c6_conta"

    # Bradesco conta: Histórico + Crédito (R$) + Débito (R$)
    if "historico" in colunas_norm and "credito (r$)" in colunas_norm and "debito (r$)" in colunas_norm:
        return "bradesco_conta"

    # C6 fatura: tem coluna Parcela + colunas exclusivas do C6
    if "parcela" in colunas_norm and (
        "nome no cartao" in colunas_norm or "final do cartao" in colunas_norm
    ):
        return "c6_fatura"

    # Formato legado: Data de Compra, Descrição, Valor (em R$)
    if {"Data de Compra", "Descrição", "Valor (em R$)"}.issubset(colunas_set):
        return "legado"

    return None


def _extrair_parcela(titulo: str):
    """Extrai parcela embutida no título. Ex: 'Netflix 2/12' → ('Netflix', '2/12')"""
    # Padrão "X/Y" no final do título
    match = re.search(r'\s+(\d+/\d+)$', titulo)
    if match:
        return titulo[:match.start()].strip(), match.group(1)
    # Padrão "Parcela X/Y" ou "Parcela X de Y"
    match = re.search(r'\s*-?\s*[Pp]arcela\s+(\d+)(?:/| de )(\d+)', titulo)
    if match:
        parcela = f"{match.group(1)}/{match.group(2)}"
        return titulo[:match.start()].strip(), parcela
    return titulo, None


def _processar_linha_nubank_fatura(linha):
    titulo = str(linha["title"]).strip()
    valor = float(linha["amount"])
    data_hora = datetime.strptime(str(linha["date"]).strip(), "%Y-%m-%d")
    descricao, parcela = _extrair_parcela(titulo)
    return descricao, valor, data_hora, parcela


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


def _processar_linha_c6_conta(linha, colunas_map):
    """Processa linha do extrato de conta corrente C6 Bank."""
    col_data   = colunas_map.get("data lancamento", "Data Lançamento")
    col_titulo = colunas_map.get("titulo", "Título")
    col_desc   = colunas_map.get("descricao", "Descrição")
    col_entrada = colunas_map.get("entrada(r$)", "Entrada(R$)")
    col_saida   = colunas_map.get("saida(r$)", "Saída(R$)")

    data_hora = datetime.strptime(str(linha[col_data]).strip(), "%d/%m/%Y")
    titulo = str(linha[col_titulo]).strip()
    desc   = str(linha[col_desc]).strip()

    entrada = float(str(linha[col_entrada]).replace(",", "."))
    saida   = float(str(linha[col_saida]).replace(",", "."))

    # Débito no cartão: usa descrição (nome do estabelecimento)
    # Pix e demais: usa título (tem o nome da pessoa/operação)
    if "DEBITO" in titulo.upper():
        descricao = desc
    else:
        descricao = titulo

    # Positivo = entrada, negativo = saída (mesmo padrão do nubank_conta)
    valor = entrada if entrada > 0 else -saida

    return descricao, valor, data_hora


def _processar_linha_bradesco_conta(linha, colunas_map):
    """Processa linha do extrato de conta corrente Bradesco."""
    col_data    = colunas_map.get("data", "Data")
    col_hist    = colunas_map.get("historico", "Histórico")
    col_credito = colunas_map.get("credito (r$)", "Crédito (R$)")
    col_debito  = colunas_map.get("debito (r$)", "Débito (R$)")

    data_str = str(linha[col_data]).strip()
    if not data_str or data_str.lower() == "nan":
        raise ValueError("linha sem data")

    descricao = str(linha[col_hist]).strip()
    if any(k in _normalizar(descricao) for k in KEYWORDS_SKIP_BRADESCO):
        raise ValueError("linha de metadado")

    def _parse_valor(v):
        s = str(v).strip().replace(".", "").replace(",", ".")
        return float(s) if s and s.lower() != "nan" else 0.0

    credito = _parse_valor(linha[col_credito])
    debito  = _parse_valor(linha[col_debito])

    if credito == 0.0 and debito == 0.0:
        raise ValueError("linha sem movimento")

    data_hora = datetime.strptime(data_str, "%d/%m/%Y")
    valor = credito if credito > 0 else -debito

    return descricao, valor, data_hora


def _processar_linha_c6_fatura(linha, colunas_map):
    """Processa linha da fatura C6 Bank (cartão de crédito)."""
    col_data  = colunas_map.get("data de compra", "Data de Compra")
    col_desc  = colunas_map.get("descricao", "Descrição")
    col_valor = colunas_map.get("valor (em r$)", "Valor (em R$)")
    col_parc  = colunas_map.get("parcela", "Parcela")

    descricao = str(linha[col_desc]).strip()
    valor     = float(str(linha[col_valor]).replace(",", "."))
    data_hora = datetime.strptime(str(linha[col_data]).strip(), "%d/%m/%Y")

    parcela_raw = str(linha[col_parc]).strip()
    parcela = None if parcela_raw.lower() in ("única", "unica", "nan", "") else parcela_raw

    return descricao, valor, data_hora, parcela


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


def _detectar_transferencias_internas(usuario_id: int, extrato_id: int):
    """Detecta e marca pares entrada↔saída entre extratos diferentes como transferência interna."""
    if not extrato_id:
        return

    db = SessionLocal()
    try:
        novas = db.query(Gasto).filter(Gasto.extrato_id == extrato_id).all()

        for nova in novas:
            if nova.transferencia_interna:
                continue

            tipo_oposto = "saida" if nova.tipo == "entrada" else "entrada"
            data_min = nova.data_hora - timedelta(days=1)
            data_max = nova.data_hora + timedelta(days=1)

            par = db.query(Gasto).filter(
                Gasto.usuario_id == usuario_id,
                Gasto.tipo == tipo_oposto,
                Gasto.valor.between(nova.valor - 0.01, nova.valor + 0.01),
                Gasto.data_hora >= data_min,
                Gasto.data_hora <= data_max,
                Gasto.extrato_id != extrato_id,
                Gasto.transferencia_interna.isnot(True),
                Gasto.id != nova.id
            ).first()

            if par:
                nova.transferencia_interna = True
                par.transferencia_interna = True
                logger.info(
                    f"Transferência interna: R${nova.valor:.2f} "
                    f"({nova.banco} ↔ {par.banco}) em {nova.data_hora.date()}"
                )

        db.commit()
    finally:
        db.close()


def _buscar_historico_categorias(usuario_id: int) -> dict:
    """Retorna mapa {descricao_normalizada: categoria} com base no histórico do usuário.
    Em caso de descrições com categorias diferentes, usa a mais recente."""
    db = SessionLocal()
    try:
        resultados = db.query(Gasto.descricao, Gasto.categoria, Gasto.data_hora).filter(
            Gasto.usuario_id == usuario_id
        ).order_by(Gasto.data_hora.asc()).all()

        historico = {}
        for r in resultados:
            if r.descricao and r.categoria:
                historico[_normalizar(r.descricao)] = r.categoria
        return historico
    finally:
        db.close()


def importar_extrato(caminho_extrato, usuario_id, extrato_id=None, banco=None):

    formato = None
    df = None

    for encoding in ["utf-8-sig", "utf-8", "latin1"]:
        for sep in [",", ";"]:
            skip_candidates = {0}
            extra = _detectar_skiprows(caminho_extrato, encoding, sep)
            if extra > 0:
                skip_candidates.add(extra)

            for skiprows in sorted(skip_candidates):
                try:
                    df_tentativa = pd.read_csv(
                        caminho_extrato, sep=sep, encoding=encoding,
                        skiprows=skiprows if skiprows > 0 else None
                    )
                    fmt = _detectar_formato(df_tentativa)
                    if fmt:
                        df = df_tentativa
                        formato = fmt
                        break
                except Exception:
                    continue
            if formato:
                break
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

    # Carrega histórico de categorias do usuário para herdar correções em meses futuros
    historico_categorias = _buscar_historico_categorias(usuario_id)

    # Primeira passada: coleta todas as transações válidas
    transacoes = []
    for _, linha in df.iterrows():
        try:
            parcela = None
            if formato == "nubank_fatura":
                descricao, valor, data_hora, parcela = _processar_linha_nubank_fatura(linha)
            elif formato == "nubank_conta":
                descricao, valor, data_hora = _processar_linha_nubank_conta(linha, colunas_map)
            elif formato == "c6_conta":
                descricao, valor, data_hora = _processar_linha_c6_conta(linha, colunas_map)
            elif formato == "bradesco_conta":
                descricao, valor, data_hora = _processar_linha_bradesco_conta(linha, colunas_map)
            elif formato == "c6_fatura":
                descricao, valor, data_hora, parcela = _processar_linha_c6_fatura(linha, colunas_map)
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
            # - Fatura (nubank/c6): positivo = saída, negativo = entrada/estorno
            # - Conta:  positivo = entrada, negativo = saída/estorno
            if formato in ("nubank_fatura", "c6_fatura"):
                if valor < 0 and _is_estorno(descricao):
                    tipo = "saida"
                    valor_abs = -abs(valor)
                else:
                    tipo = "saida" if valor > 0 else "entrada"
                    valor_abs = abs(valor)
            else:  # nubank_conta, c6_conta, bradesco_conta e legado
                if valor < 0 and _is_estorno(descricao):
                    tipo = "saida"
                    valor_abs = -abs(valor)
                else:
                    tipo = "entrada" if valor > 0 else "saida"
                    valor_abs = abs(valor)

            categoria = categorizar(descricao)

            # Se o usuário já corrigiu a categoria dessa descrição antes, usa a do histórico
            categoria_historica = historico_categorias.get(_normalizar(descricao))
            if categoria_historica:
                categoria = categoria_historica

            transacoes.append((descricao, valor_abs, data_hora, tipo, categoria, parcela))

        except Exception:
            continue

    # Detecta mês dominante e ajusta datas fora do padrão
    mes_dominante = _detectar_mes_dominante(transacoes)

    if mes_dominante:
        ano_alvo, mes_alvo = mes_dominante
        transacoes_ajustadas = []
        for descricao, valor_abs, data_hora, tipo, categoria, parcela in transacoes:
            data_original = None
            if (data_hora.year, data_hora.month) != (ano_alvo, mes_alvo):
                logger.info(
                    f"Data {data_hora.date()} fora do mês dominante "
                    f"{mes_alvo:02d}/{ano_alvo} — ajustando: {descricao}"
                )
                data_original = data_hora
                data_hora = _ajustar_data(data_hora, ano_alvo, mes_alvo)
            transacoes_ajustadas.append((descricao, valor_abs, data_hora, tipo, categoria, data_original, parcela))
    else:
        transacoes_ajustadas = [
            (d, v, dh, t, c, None, p) for d, v, dh, t, c, p in transacoes
        ]

    # Segunda passada: persiste no banco
    db: Session = SessionLocal()

    for descricao, valor_abs, data_hora, tipo, categoria, data_original, parcela in transacoes_ajustadas:
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
            parcela=parcela,
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

    # Detecta transferências internas entre contas do mesmo usuário
    _detectar_transferencias_internas(usuario_id, extrato_id)
