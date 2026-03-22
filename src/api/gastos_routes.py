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
    data_hora: str | None = None


@router.post("/manual")
def adicionar_manual(
    dados: GastoManualRequest,
    usuario_id: int = Depends(pegar_usuario_logado)
):
    adicionar_gasto_manual(
        descricao=dados.descricao,
        valor=dados.valor,
        categoria=dados.categoria,
        usuario_id=usuario_id,
        data_hora=dados.data_hora
    )

    return {"message": "Gasto manual adicionado com sucesso"}


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
            "data": g.data_hora
        }
        for g in gastos
    ]


@router.get("/por-dia")
def gastos_por_dia(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    resultados = db.query(
        func.date(Gasto.data_hora).label("data"),
        func.sum(Gasto.valor).label("total")
    ).filter(
        Gasto.usuario_id == usuario_id
    ).group_by(
        func.date(Gasto.data_hora)
    ).all()

    return [{"data": str(r.data), "total": float(r.total)} for r in resultados]


@router.get("/por-categoria")
def gastos_por_categoria(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    resultados = db.query(
        Gasto.categoria,
        func.sum(Gasto.valor).label("total")
    ).filter(
        Gasto.usuario_id == usuario_id
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

    entradas = sum(g.valor for g in gastos if g.valor > 0)
    saidas = sum(abs(g.valor) for g in gastos if g.valor < 0)
    saldo = entradas - saidas

    return {
        "entradas": float(entradas),
        "saidas": float(saidas),
        "saldo": float(saldo)
    }

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
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data": g.data_hora
        }
        for g in gastos
    ]


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
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data": g.data_hora
        }
        for g in gastos
    ]


@router.get("/top-gastos")
def top_maiores_gastos(
    limite: int = 5,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    gastos = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id
    ).order_by(
        desc(Gasto.valor)
    ).limit(limite).all()

    return [
        {
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data": g.data_hora
        }
        for g in gastos
    ]
