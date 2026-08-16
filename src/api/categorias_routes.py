import difflib
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from src.database.models import CategoriaPersonalizada
from src.auth.security import pegar_usuario_logado, get_db_autenticado

router = APIRouter()

LIMITE_CATEGORIAS_PERSONALIZADAS = 3

CATEGORIAS_FIXAS = [
    "salário", "alimentação", "transporte", "saúde", "beleza", "lazer",
    "compras", "assinaturas", "educação", "moradia", "financeiro",
    "viagem", "pet", "serviços", "outros",
]

LIMIAR_SIMILARIDADE = 0.82


def _normalizar(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("ASCII").lower().strip()


def _sao_similares(nome_a: str, nome_b: str) -> bool:
    """Compara dois nomes de categoria de forma aproximada (fuzzy), pra pegar
    typos/variações da mesma categoria (ex: 'viagem' vs 'viagens'). Não usa
    contenção de substring pura — isso bloquearia nomes legítimos que só
    compartilham uma palavra em comum com uma categoria menor (ex: 'Pet
    extra' não pode ser barrado só por conter 'pet')."""
    a, b = _normalizar(nome_a), _normalizar(nome_b)
    if not a or not b:
        return False
    if a == b:
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= LIMIAR_SIMILARIDADE


class CategoriaRequest(BaseModel):
    nome: str
    cor: str

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Nome da categoria não pode ser vazio")
        if len(v) > 30:
            raise ValueError("Nome da categoria muito longo (máximo 30 caracteres)")
        return v

    @field_validator("cor")
    @classmethod
    def validar_cor(cls, v):
        v = v.strip()
        if not v.startswith("#") or len(v) not in (4, 7):
            raise ValueError("Cor inválida, use formato hexadecimal (ex: #10b981)")
        return v


@router.get("/")
def listar_categorias(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    categorias = db.query(CategoriaPersonalizada).filter(
        CategoriaPersonalizada.usuario_id == usuario_id
    ).order_by(CategoriaPersonalizada.criado_em.asc()).all()

    return [
        {"id": c.id, "nome": c.nome, "cor": c.cor}
        for c in categorias
    ]


@router.post("/")
def criar_categoria(
    request: CategoriaRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    existentes = db.query(CategoriaPersonalizada).filter(
        CategoriaPersonalizada.usuario_id == usuario_id
    ).all()

    if len(existentes) >= LIMITE_CATEGORIAS_PERSONALIZADAS:
        raise HTTPException(status_code=400, detail=f"Limite de {LIMITE_CATEGORIAS_PERSONALIZADAS} categorias personalizadas atingido")

    for nome_fixo in CATEGORIAS_FIXAS:
        if _sao_similares(request.nome, nome_fixo):
            raise HTTPException(status_code=400, detail=f"Categoria parecida com '{nome_fixo}' já existe")

    for categoria in existentes:
        if _sao_similares(request.nome, categoria.nome):
            raise HTTPException(status_code=400, detail=f"Categoria parecida com '{categoria.nome}' já foi criada")

    nova = CategoriaPersonalizada(
        nome=request.nome,
        cor=request.cor,
        usuario_id=usuario_id
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)

    return {"id": nova.id, "nome": nova.nome, "cor": nova.cor}


@router.delete("/{categoria_id}")
def deletar_categoria(
    categoria_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db_autenticado)
):
    categoria = db.query(CategoriaPersonalizada).filter(
        CategoriaPersonalizada.id == categoria_id,
        CategoriaPersonalizada.usuario_id == usuario_id
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    db.delete(categoria)
    db.commit()

    return {"message": "Categoria removida"}
