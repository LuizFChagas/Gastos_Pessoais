from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from pathlib import Path
import shutil

from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato

from src.auth.security import pegar_usuario_logado


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

    return {
        "message": "Extrato importado com sucesso",
        "arquivo": file.filename
    }