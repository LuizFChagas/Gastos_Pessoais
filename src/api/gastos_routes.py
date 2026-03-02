from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from pathlib import Path
import shutil

from src.ingestao_manual import adicionar_gasto_manual
from src.ingestao_extrato_bancario import importar_extrato

router = APIRouter()


class GastoManualRequest(BaseModel):
    descricao: str
    valor: float
    categoria: str


@router.post("/manual")
def adicionar_manual(dados: GastoManualRequest):
    adicionar_gasto_manual(
        descricao=dados.descricao,
        valor=dados.valor,
        categoria=dados.categoria
    )
    return {
        "message": "Gasto manual adicionado com sucesso"
    }


@router.post("/importar")
def importar_extrato_bancario(file: UploadFile = File(...)):

    # 🔎 Validação simples de formato
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