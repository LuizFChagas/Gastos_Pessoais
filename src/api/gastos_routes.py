import uuid
from pathlib import Path
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field

from src.services.ingestao_manual import adicionar_gasto_manual
from src.services.ingestao_extrato_bancario import importar_extrato

from src.auth.security import pegar_usuario_logado


router = APIRouter()


class GastoManualRequest(BaseModel):

    descricao: str = Field(min_length=1, max_length=200)

    valor: float = Field(gt=0)

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