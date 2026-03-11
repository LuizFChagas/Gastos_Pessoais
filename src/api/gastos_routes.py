from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from pathlib import Path
import shutil
from typing import Optional
from datetime import datetime
from sqlalchemy import extract, func
from src.database.database import SessionLocal
from src.database.models import Gasto
from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato


router = APIRouter()


class GastoManualRequest(BaseModel):
    descricao: str
    valor: float
    categoria: str
    data_hora: Optional[datetime] = None

@router.post("/manual")
def adicionar_manual(dados: GastoManualRequest):

    adicionar_gasto_manual(
        descricao=dados.descricao,
        valor=dados.valor,
        categoria=dados.categoria,
        data_hora=dados.data_hora
    )

    return {"message": "Gasto manual adicionado com sucesso"}

@router.post("/importar")
def importar_extrato_bancario(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Envie um arquivo CSV."
        )

    caminho_temp = Path("data/extratos") / file.filename
    caminho_temp.parent.mkdir(parents=True, exist_ok=True)

    with open(caminho_temp, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    importar_extrato(caminho_temp)

    return {
        "message": "Extrato importado com sucesso",
        "arquivo": file.filename
    }

@router.get("/")
def listar_gastos():

    db = SessionLocal()

    gastos = db.query(Gasto).all()

    resultado = []

    for g in gastos:
        resultado.append({
            "id": g.id,
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data_hora": g.data_hora
        })

    db.close()

    return resultado

@router.get("/mes/{mes}")
def gastos_por_mes(mes: int):

    db = SessionLocal()

    gastos = db.query(Gasto).filter(
        extract("month", Gasto.data_hora) == mes
    ).all()

    total = sum(g.valor for g in gastos)

    db.close()

    return {
        "mes": mes,
        "total": total,
        "quantidade_gastos": len(gastos)
    }

@router.get("/dia/{dia}")
def gastos_por_dia(dia: int):

    db = SessionLocal()

    gastos = db.query(Gasto).filter(
        extract("day", Gasto.data_hora) == dia
    ).all()

    resultado = []

    for g in gastos:
        resultado.append({
            "descricao": g.descricao,
            "valor": g.valor,
            "categoria": g.categoria,
            "data_hora": g.data_hora
        })

    db.close()

    return resultado

@router.get("/categoria")
def gastos_por_categoria():

    db = SessionLocal()

    resultado = db.query(
        Gasto.categoria,
        func.sum(Gasto.valor)
    ).group_by(
        Gasto.categoria
    ).all()

    db.close()

    resposta = {}

    for categoria, total in resultado:
        resposta[categoria] = float(total)

    return resposta

@router.get("/dashboard/resumo")
def resumo_dashboard():

    db = SessionLocal()

    total = db.query(
        func.sum(Gasto.valor)
    ).scalar()

    quantidade = db.query(
        func.count(Gasto.id)
    ).scalar()

    categorias = db.query(
        Gasto.categoria,
        func.sum(Gasto.valor)
    ).group_by(
        Gasto.categoria
    ).all()

    db.close()

    return {
        "total_gasto": float(total or 0),
        "quantidade_gastos": quantidade,
        "categorias": [
            {
                "categoria": c,
                "total": float(v)
            }
            for c, v in categorias
        ]
    }

@router.get("/dashboard/dias/{mes}")
def gastos_por_dia_mes(mes: int):

    db = SessionLocal()

    resultado = db.query(
        extract("day", Gasto.data_hora).label("dia"),
        func.sum(Gasto.valor)
    ).filter(
        extract("month", Gasto.data_hora) == mes
    ).group_by("dia").all()

    db.close()

    return [
        {
            "dia": int(dia),
            "total": float(total)
        }
        for dia, total in resultado
    ]

@router.get("/dashboard/horarios")
def gastos_por_horario():

    db = SessionLocal()

    resultado = db.query(
        extract("hour", Gasto.data_hora).label("hora"),
        func.sum(Gasto.valor)
    ).group_by("hora").all()

    db.close()

    return [
        {
            "hora": int(hora),
            "total": float(total)
        }
        for hora, total in resultado
    ]