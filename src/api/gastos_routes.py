from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from pathlib import Path
from typing import Literal
import logging
import uuid
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import extract

from src.database.models import Gasto, Extrato, Usuario

from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato, pre_visualizar_extrato
from src.services.gastos_fixos import processar_gastos_fixos, marcar_fixo
from src.services.exportacao import gerar_csv, gerar_excel, gerar_pdf
from src.auth.security import pegar_usuario_logado, get_db_autenticado


logger = logging.getLogger(__name__)

router = APIRouter()

FORMAS_PAGAMENTO = Literal["debito", "credito", "pix", "dinheiro", "outro"]


class GastoManualRequest(BaseModel):
    descricao: str
    valor: float = Field(gt=0)
    categoria: str
    banco: str
    tipo: Literal["entrada", "saida"]
    data_hora: str | None = None
    forma_pagamento: FORMAS_PAGAMENTO | None = None
    fixo: bool = False
    parcelas: int | None = Field(default=None, ge=2, le=48)


# ✅ CRIAR GASTO / ENTRADA
@router.post("/manual")
def criar_gasto_manual(
    request: GastoManualRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    adicionar_gasto_manual(
        db,
        request.descricao,
        request.valor,
        request.categoria,
        usuario_id,
        request.banco,
        request.tipo,
        request.data_hora,
        request.forma_pagamento,
        request.fixo,
        request.parcelas,
    )

    processar_gastos_fixos(db, usuario_id)

    return {"msg": "Gasto adicionado"}


class AjusteSaldoRequest(BaseModel):
    novo_saldo: float
    motivo: str

    @field_validator("motivo")
    @classmethod
    def validar_motivo(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Conte o que aconteceu pra gerar esse ajuste")
        if len(v) > 500:
            raise ValueError("Motivo muito longo (máximo 500 caracteres)")
        return v


# ✅ AJUSTAR SALDO MANUALMENTE
@router.post("/ajuste-saldo")
def ajustar_saldo(
    request: AjusteSaldoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.transferencia_interna.isnot(True)
    ).all()

    saldo_atual = sum(g.valor for g in gastos if g.tipo == "entrada") - \
        sum(g.valor for g in gastos if g.tipo == "saida")

    diferenca = request.novo_saldo - saldo_atual

    if diferenca == 0:
        raise HTTPException(status_code=400, detail="O saldo informado já é o saldo atual")

    ajuste = Gasto(
        descricao="Ajuste de saldo",
        valor=abs(diferenca),
        categoria="ajuste",
        banco="Ajuste manual",
        tipo="entrada" if diferenca > 0 else "saida",
        data_hora=datetime.now(),
        ajuste_saldo=True,
        motivo_ajuste=request.motivo.strip(),
        usuario_id=usuario_id
    )
    db.add(ajuste)
    db.commit()

    return {"message": "Saldo ajustado", "diferenca": diferenca}


MAX_CSV_SIZE = 10 * 1024 * 1024  # 10 MB


def _salvar_csv_temp(file: UploadFile) -> Path:
    """Valida extensão/tamanho e salva o upload num arquivo temporário com nome
    gerado (nunca o nome enviado pelo cliente, evita path traversal/colisão)."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Formato inválido. Envie CSV.")

    pasta = Path("data/extratos")
    pasta.mkdir(parents=True, exist_ok=True)
    caminho_temp = pasta / f"{uuid.uuid4().hex}.csv"

    tamanho = 0
    with open(caminho_temp, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            tamanho += len(chunk)
            if tamanho > MAX_CSV_SIZE:
                buffer.close()
                caminho_temp.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 10MB)")
            buffer.write(chunk)

    return caminho_temp


# ✅ PRÉ-VISUALIZAR EXTRATO (sem salvar nada no banco)
@router.post("/importar/preview")
def preview_extrato_bancario(
    file: UploadFile = File(...),
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    caminho_temp = _salvar_csv_temp(file)
    try:
        return pre_visualizar_extrato(db, caminho_temp, usuario_id)
    finally:
        caminho_temp.unlink(missing_ok=True)


# ✅ IMPORTAR EXTRATO
@router.post("/importar")
def importar_extrato_bancario(
    file: UploadFile = File(...),
    banco: str = "",
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    caminho_temp = _salvar_csv_temp(file)

    try:
        extrato = Extrato(
            nome_arquivo=file.filename,
            banco=banco,
            usuario_id=usuario_id
        )
        db.add(extrato)
        db.commit()
        db.refresh(extrato)

        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        nome_usuario = usuario.nome if usuario else None
        importar_extrato(db, caminho_temp, usuario_id, extrato_id=extrato.id, banco=banco, nome_usuario=nome_usuario)

        processar_gastos_fixos(db, usuario_id)

        logger.info(f"Usuário {usuario_id} importou arquivo: {file.filename}")

        return {
            "message": "Extrato importado com sucesso",
            "arquivo": file.filename,
            "extrato_id": extrato.id
        }
    finally:
        caminho_temp.unlink(missing_ok=True)


# ✅ LISTAR HISTÓRICO DE EXTRATOS
@router.get("/extratos")
def listar_extratos(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    extratos = db.query(Extrato).filter(
        Extrato.usuario_id == usuario_id
    ).order_by(Extrato.data_importacao.desc()).all()

    return [
        {
            "id": e.id,
            "nome_arquivo": e.nome_arquivo,
            "banco": e.banco,
            "data_importacao": e.data_importacao
        }
        for e in extratos
    ]


# ✅ DELETAR EXTRATO E TODOS OS GASTOS VINCULADOS
@router.delete("/extratos/{extrato_id}")
def deletar_extrato(
    extrato_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    extrato = db.query(Extrato).filter(
        Extrato.id == extrato_id,
        Extrato.usuario_id == usuario_id
    ).first()

    if not extrato:
        raise HTTPException(status_code=404, detail="Extrato não encontrado")

    db.delete(extrato)
    db.commit()

    return {"message": "Extrato e transações vinculadas deletados com sucesso"}


# ✅ MESES QUE TÊM DADOS
@router.get("/meses-disponiveis")
def meses_disponiveis(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    resultados = db.query(
        extract("year",  Gasto.data_hora).label("ano"),
        extract("month", Gasto.data_hora).label("mes")
    ).filter(
        Gasto.usuario_id == usuario_id
    ).distinct().order_by("ano", "mes").all()

    # mes retorna 1-12 do banco; convertemos para 0-11 (padrão JS)
    return [{"ano": int(r.ano), "mes": int(r.mes) - 1} for r in resultados]


# ✅ LISTAR TODOS (ENTRADA + SAÍDA)
@router.get("/")
def listar_gastos(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    processar_gastos_fixos(db, usuario_id)

    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id
    ).order_by(Gasto.data_hora.desc()).all()

    return [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "banco": g.banco,
            "tipo": g.tipo,
            "data_hora": g.data_hora,
            "data_original": g.data_original,
            "parcela": g.parcela,
            "transferencia_interna": g.transferencia_interna or False,
            "forma_pagamento": g.forma_pagamento,
            "fixo": g.fixo or False,
            "origem_id": g.origem_id,
            "ajuste_saldo": g.ajuste_saldo or False,
            "motivo_ajuste": g.motivo_ajuste,
        }
        for g in gastos
    ]


# ✅ GASTOS POR DIA (SOMENTE SAÍDA)
@router.get("/por-dia")
def gastos_por_dia(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    # valor é criptografado (não soma no SQL) — soma em Python depois de decifrado
    gastos = db.query(Gasto.data_hora, Gasto.valor).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).all()

    totais_por_dia: dict[str, float] = {}
    for data_hora, valor in gastos:
        chave = data_hora.date().isoformat()
        totais_por_dia[chave] = totais_por_dia.get(chave, 0) + float(valor)

    return [{"data": data, "total": total} for data, total in totais_por_dia.items()]


# ✅ GASTOS POR CATEGORIA (SOMENTE SAÍDA)
@router.get("/por-categoria")
def gastos_por_categoria(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    # valor é criptografado (não soma no SQL) — soma em Python depois de decifrado
    gastos = db.query(Gasto.categoria, Gasto.valor).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).all()

    totais_por_categoria: dict[str, float] = {}
    for categoria, valor in gastos:
        totais_por_categoria[categoria] = totais_por_categoria.get(categoria, 0) + float(valor)

    return [{"categoria": categoria, "total": total} for categoria, total in totais_por_categoria.items()]


@router.get("/dashboard/resumo")
def resumo_dashboard(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.transferencia_interna.isnot(True)
    ).all()

    entradas = 0
    saidas = 0

    for g in gastos:
        tipo = (g.tipo or "").strip().lower()

        if tipo == "entrada":
            entradas += float(g.valor)

        elif tipo == "saida":
            saidas += float(g.valor)

    saldo = entradas - saidas

    return {
        "entradas": entradas,
        "saidas": saidas,
        "saldo": saldo
    }


# ✅ POR MÊS (MANTÉM TUDO)
@router.get("/por-mes")
def gastos_por_mes(
    ano: int,
    mes: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    inicio = datetime(ano, mes, 1)

    if mes == 12:
        fim = datetime(ano + 1, 1, 1)
    else:
        fim = datetime(ano, mes + 1, 1)

    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.data_hora >= inicio,
        Gasto.data_hora < fim
    ).all()

    return [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "banco": g.banco,
            "tipo": g.tipo,
            "data_hora": g.data_hora,
            "data_original": g.data_original,
            "parcela": g.parcela,
            "transferencia_interna": g.transferencia_interna or False,
            "forma_pagamento": g.forma_pagamento,
            "fixo": g.fixo or False,
            "origem_id": g.origem_id,
            "ajuste_saldo": g.ajuste_saldo or False,
            "motivo_ajuste": g.motivo_ajuste,
        }
        for g in gastos
    ]


# ✅ INTERVALO
@router.get("/intervalo")
def gastos_por_intervalo(
    data_inicio: str = Query(...),
    data_fim: str = Query(...),
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    try:
        inicio = datetime.fromisoformat(data_inicio)
        fim = datetime.fromisoformat(data_fim)
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de data inválido")

    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.data_hora >= inicio,
        Gasto.data_hora <= fim
    ).all()

    return [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "banco": g.banco,
            "tipo": g.tipo,
            "data_hora": g.data_hora,
            "data_original": g.data_original,
            "parcela": g.parcela,
            "transferencia_interna": g.transferencia_interna or False,
            "forma_pagamento": g.forma_pagamento,
            "fixo": g.fixo or False,
            "origem_id": g.origem_id,
            "ajuste_saldo": g.ajuste_saldo or False,
            "motivo_ajuste": g.motivo_ajuste,
        }
        for g in gastos
    ]


# ✅ TOP GASTOS (SOMENTE SAÍDA)
@router.get("/top-gastos")
def top_maiores_gastos(
    limite: int = 5,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    # valor é criptografado (não ordena no SQL) — busca tudo e ordena em Python
    gastos_todos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).all()

    gastos = sorted(gastos_todos, key=lambda g: g.valor, reverse=True)[:limite]

    return [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "banco": g.banco,
            "tipo": g.tipo,
            "data_hora": g.data_hora,
            "data_original": g.data_original,
            "parcela": g.parcela,
            "transferencia_interna": g.transferencia_interna or False,
            "forma_pagamento": g.forma_pagamento,
            "fixo": g.fixo or False,
            "origem_id": g.origem_id,
            "ajuste_saldo": g.ajuste_saldo or False,
            "motivo_ajuste": g.motivo_ajuste,
        }
        for g in gastos
    ]


class EditarGastoRequest(BaseModel):
    descricao: str | None = None
    valor: float | None = Field(default=None, gt=0)
    categoria: str | None = None
    tipo: Literal["entrada", "saida"] | None = None
    banco: str | None = None
    data_hora: str | None = None
    forma_pagamento: FORMAS_PAGAMENTO | None = None
    fixo: bool | None = None


class RecategorizarLoteRequest(BaseModel):
    ids: list[int]
    categoria: str


# ✅ RECATEGORIZAR EM LOTE (antes do /{gasto_id} para evitar conflito de rota)
@router.put("/recategorizar-lote")
def recategorizar_lote(
    request: RecategorizarLoteRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    db.query(Gasto).filter(
        Gasto.id.in_(request.ids),
        Gasto.usuario_id == usuario_id
    ).update({"categoria": request.categoria, "categoria_manual": True}, synchronize_session=False)
    db.commit()
    return {"message": f"{len(request.ids)} transações recategorizadas"}


# ✅ EDITAR TRANSAÇÃO
@router.put("/{gasto_id}")
def editar_gasto(
    gasto_id: int,
    request: EditarGastoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    gasto = db.query(Gasto).filter(
        Gasto.id == gasto_id,
        Gasto.usuario_id == usuario_id
    ).first()

    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")

    if request.descricao is not None:
        gasto.descricao = request.descricao
    if request.valor is not None:
        gasto.valor = request.valor
    if request.categoria is not None:
        gasto.categoria = request.categoria
        gasto.categoria_manual = True
    if request.tipo is not None:
        gasto.tipo = request.tipo
    if request.banco is not None:
        gasto.banco = request.banco
    if request.data_hora is not None:
        gasto.data_hora = datetime.fromisoformat(request.data_hora)
    if request.forma_pagamento is not None:
        gasto.forma_pagamento = request.forma_pagamento

    db.commit()

    if request.fixo is not None and request.fixo != (gasto.fixo or False):
        marcar_fixo(db, gasto, request.fixo)

    return {"message": "Gasto atualizado"}


# ✅ DELETE
@router.delete("/{gasto_id}")
def deletar_gasto(
    gasto_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    gasto = db.query(Gasto).filter(
        Gasto.id == gasto_id,
        Gasto.usuario_id == usuario_id
    ).first()

    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")

    db.delete(gasto)
    db.commit()

    return {"message": "Gasto deletado com sucesso"}


MEDIA_TYPES_EXPORT = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
}


# ✅ EXPORTAR (CSV / EXCEL / PDF)
@router.get("/exportar")
def exportar_gastos(
    formato: Literal["csv", "xlsx", "pdf"],
    ano: int | None = None,
    mes: int | None = None,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    query = db.query(Gasto).filter(Gasto.usuario_id == usuario_id)

    if ano is not None and mes is not None:
        inicio = datetime(ano, mes, 1)
        fim = datetime(ano + 1, 1, 1) if mes == 12 else datetime(ano, mes + 1, 1)
        query = query.filter(Gasto.data_hora >= inicio, Gasto.data_hora < fim)
    elif ano is not None:
        query = query.filter(extract("year", Gasto.data_hora) == ano)

    gastos = query.order_by(Gasto.data_hora.desc()).all()

    if formato == "csv":
        conteudo = gerar_csv(gastos)
    elif formato == "xlsx":
        conteudo = gerar_excel(gastos)
    else:
        conteudo = gerar_pdf(gastos)

    nome_arquivo = f"finly_transacoes.{formato}"
    return StreamingResponse(
        iter([conteudo]),
        media_type=MEDIA_TYPES_EXPORT[formato],
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'}
    )