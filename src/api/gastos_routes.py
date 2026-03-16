from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field
from pathlib import Path
import shutil
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime

from src.database.database import SessionLocal
from src.database.models import Gasto

from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato

from src.auth.security import pegar_usuario_logado


router = APIRouter()


class GastoManualRequest(BaseModel):

    descricao: str = Field(min_length=1, max_length=200)
    valor: float
    categoria: str = Field(min_length=1, max_length=50)
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

    nome_arquivo = f"{uuid.uuid4()}.csv"

    caminho_temp = Path("data/extratos") / nome_arquivo

    caminho_temp.parent.mkdir(parents=True, exist_ok=True)

    with open(caminho_temp, "wb") as buffer:

        shutil.copyfileobj(file.file, buffer)

    importar_extrato(caminho_temp, usuario_id)

    return {
        "message": "Extrato importado com sucesso"
    }


@router.get("/")
def listar_gastos(usuario_id: int = Depends(pegar_usuario_logado)):

    db: Session = SessionLocal()

    gastos = (
        db.query(Gasto)
        .filter(Gasto.usuario_id == usuario_id)
        .order_by(Gasto.data_hora.desc())
        .all()
    )

    resultado = [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data_hora": g.data_hora
        }
        for g in gastos
    ]

    db.close()

    return resultado


@router.get("/por-dia")
def gastos_por_dia(usuario_id: int = Depends(pegar_usuario_logado)):

    db: Session = SessionLocal()

    resultados = (
        db.query(
            func.date(Gasto.data_hora).label("dia"),
            func.sum(Gasto.valor).label("total")
        )
        .filter(Gasto.usuario_id == usuario_id)
        .group_by(func.date(Gasto.data_hora))
        .order_by(func.date(Gasto.data_hora))
        .all()
    )

    db.close()

    return resultados


@router.get("/por-categoria")
def gastos_por_categoria(usuario_id: int = Depends(pegar_usuario_logado)):

    db: Session = SessionLocal()

    resultados = (
        db.query(
            Gasto.categoria,
            func.sum(Gasto.valor).label("total")
        )
        .filter(Gasto.usuario_id == usuario_id)
        .group_by(Gasto.categoria)
        .all()
    )

    db.close()

    return resultados


@router.get("/mes")
def gastos_mes(usuario_id: int = Depends(pegar_usuario_logado)):

    db: Session = SessionLocal()

    mes_atual = datetime.now().month
    ano_atual = datetime.now().year

    resultados = (
        db.query(Gasto)
        .filter(
            Gasto.usuario_id == usuario_id,
            extract("month", Gasto.data_hora) == mes_atual,
            extract("year", Gasto.data_hora) == ano_atual
        )
        .order_by(Gasto.data_hora.desc())
        .all()
    )

    resultado = [
        {
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data_hora": g.data_hora
        }
        for g in resultados
    ]

    db.close()

    return resultado


@router.get("/dashboard/resumo")
def resumo_dashboard(usuario_id: int = Depends(pegar_usuario_logado)):

    db: Session = SessionLocal()

    entradas = (
        db.query(func.sum(Gasto.valor))
        .filter(Gasto.usuario_id == usuario_id, Gasto.valor > 0)
        .scalar()
    ) or 0

    saidas = (
        db.query(func.sum(Gasto.valor))
        .filter(Gasto.usuario_id == usuario_id, Gasto.valor < 0)
        .scalar()
    ) or 0

    saldo = entradas + saidas

    db.close()

    return {
        "entradas": entradas,
        "saidas": abs(saidas),
        "saldo": saldo
    }