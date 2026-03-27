from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from pydantic import BaseModel
from pathlib import Path
import shutil
import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from src.database.deps import get_db
from src.database.models import Gasto

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
    usuario_id: int = Depends(pegar_usuario_logado)
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

    importar_extrato(caminho_temp, usuario_id)

    logger.info(f"Usuário {usuario_id} importou arquivo: {file.filename}")

    return {
        "message": "Extrato importado com sucesso",
        "arquivo": file.filename
    }


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
            "tipo": g.tipo,  # 👈 NOVO
            "data_hora": g.data_hora
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
        Gasto.tipo == "saida"  # 👈 FILTRO
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
        Gasto.tipo == "saida"  # 👈 FILTRO
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
        Gasto.usuario_id == usuario_id
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
            "data_hora": g.data_hora
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
            "data_hora": g.data_hora
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
        Gasto.tipo == "saida"  # 👈 IMPORTANTE
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
            "data_hora": g.data_hora
        }
        for g in gastos
    ]


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