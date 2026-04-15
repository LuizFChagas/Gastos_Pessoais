from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from pydantic import BaseModel
from pathlib import Path
import shutil
import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract

from src.database.deps import get_db
from src.database.models import Gasto, Extrato

from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato
from src.auth.security import pegar_usuario_logado


logger = logging.getLogger(__name__)

router = APIRouter()


class GastoManualRequest(BaseModel):
    descricao: str
    valor: float
    categoria: str
    banco: str
    tipo: str  # 👈 NOVO
    data_hora: str | None = None


# ✅ CRIAR GASTO / ENTRADA
@router.post("/manual")
def criar_gasto_manual(
    request: GastoManualRequest,
    usuario_id: int = Depends(pegar_usuario_logado)
):
    adicionar_gasto_manual(
        request.descricao,
        request.valor,
        request.categoria,
        usuario_id,
        request.banco,
        request.tipo,
        request.data_hora
    )

    return {"msg": "Gasto adicionado"}


# ✅ IMPORTAR EXTRATO
@router.post("/importar")
def importar_extrato_bancario(
    file: UploadFile = File(...),
    banco: str = "",
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Envie CSV."
        )

    caminho_temp = Path("data/extratos") / file.filename
    caminho_temp.parent.mkdir(parents=True, exist_ok=True)

    with open(caminho_temp, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extrato = Extrato(
        nome_arquivo=file.filename,
        banco=banco,
        usuario_id=usuario_id
    )
    db.add(extrato)
    db.commit()
    db.refresh(extrato)

    importar_extrato(caminho_temp, usuario_id, extrato_id=extrato.id, banco=banco)

    logger.info(f"Usuário {usuario_id} importou arquivo: {file.filename}")

    return {
        "message": "Extrato importado com sucesso",
        "arquivo": file.filename,
        "extrato_id": extrato.id
    }


# ✅ LISTAR HISTÓRICO DE EXTRATOS
@router.get("/extratos")
def listar_extratos(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
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
            "transferencia_interna": g.transferencia_interna or False
        }
        for g in gastos
    ]


# ✅ GASTOS POR DIA (SOMENTE SAÍDA)
@router.get("/por-dia")
def gastos_por_dia(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    resultados = db.query(
        func.date(Gasto.data_hora).label("data"),
        func.sum(Gasto.valor).label("total")
    ).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).group_by(
        func.date(Gasto.data_hora)
    ).all()

    return [{"data": str(r.data), "total": float(r.total)} for r in resultados]


# ✅ GASTOS POR CATEGORIA (SOMENTE SAÍDA)
@router.get("/por-categoria")
def gastos_por_categoria(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    resultados = db.query(
        Gasto.categoria,
        func.sum(Gasto.valor).label("total")
    ).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).group_by(
        Gasto.categoria
    ).all()

    return [{"categoria": r.categoria, "total": float(r.total)} for r in resultados]


@router.get("/dashboard/resumo")
def resumo_dashboard(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
            "transferencia_interna": g.transferencia_interna or False
        }
        for g in gastos
    ]


# ✅ INTERVALO
@router.get("/intervalo")
def gastos_por_intervalo(
    data_inicio: str = Query(...),
    data_fim: str = Query(...),
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
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
            "transferencia_interna": g.transferencia_interna or False
        }
        for g in gastos
    ]


# ✅ TOP GASTOS (SOMENTE SAÍDA)
@router.get("/top-gastos")
def top_maiores_gastos(
    limite: int = 5,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.tipo == "saida",
        Gasto.transferencia_interna.isnot(True)
    ).order_by(
        desc(Gasto.valor)
    ).limit(limite).all()

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
            "transferencia_interna": g.transferencia_interna or False
        }
        for g in gastos
    ]


class EditarGastoRequest(BaseModel):
    descricao: str | None = None
    valor: float | None = None
    categoria: str | None = None
    tipo: str | None = None
    banco: str | None = None
    data_hora: str | None = None


class RecategorizarLoteRequest(BaseModel):
    ids: list[int]
    categoria: str


# ✅ RECATEGORIZAR EM LOTE (antes do /{gasto_id} para evitar conflito de rota)
@router.put("/recategorizar-lote")
def recategorizar_lote(
    request: RecategorizarLoteRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    db.query(Gasto).filter(
        Gasto.id.in_(request.ids),
        Gasto.usuario_id == usuario_id
    ).update({"categoria": request.categoria}, synchronize_session=False)
    db.commit()
    return {"message": f"{len(request.ids)} transações recategorizadas"}


# ✅ EDITAR TRANSAÇÃO
@router.put("/{gasto_id}")
def editar_gasto(
    gasto_id: int,
    request: EditarGastoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
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
    if request.tipo is not None:
        gasto.tipo = request.tipo
    if request.banco is not None:
        gasto.banco = request.banco
    if request.data_hora is not None:
        gasto.data_hora = datetime.fromisoformat(request.data_hora)

    db.commit()
    return {"message": "Gasto atualizado"}


# ✅ DELETE
@router.delete("/{gasto_id}")
def deletar_gasto(
    gasto_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
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