from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from src.database.deps import get_db
from src.database.models import Investimento
from src.auth.security import pegar_usuario_logado

router = APIRouter()


class InvestimentoRequest(BaseModel):
    nome: str
    ticker: Optional[str] = None
    tipo: str
    valor_investido: float
    valor_atual: float
    rentabilidade_mes: Optional[float] = 0
    rentabilidade_ano: Optional[float] = 0


def _serialize(inv):
    return {
        "id":                inv.id,
        "nome":              inv.nome,
        "ticker":            inv.ticker,
        "tipo":              inv.tipo,
        "valor_investido":   inv.valor_investido,
        "valor_atual":       inv.valor_atual,
        "rentabilidade_mes": inv.rentabilidade_mes,
        "rentabilidade_ano": inv.rentabilidade_ano,
        "criado_em":         inv.criado_em,
    }


# ✅ LISTAR
@router.get("/")
def listar_investimentos(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    itens = db.query(Investimento).filter(
        Investimento.usuario_id == usuario_id
    ).order_by(Investimento.criado_em.desc()).all()
    return [_serialize(i) for i in itens]


# ✅ CRIAR
@router.post("/")
def criar_investimento(
    req: InvestimentoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    inv = Investimento(
        usuario_id       = usuario_id,
        nome             = req.nome,
        ticker           = req.ticker,
        tipo             = req.tipo,
        valor_investido  = req.valor_investido,
        valor_atual      = req.valor_atual,
        rentabilidade_mes= req.rentabilidade_mes,
        rentabilidade_ano= req.rentabilidade_ano,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return _serialize(inv)


# ✅ EDITAR
@router.put("/{inv_id}")
def editar_investimento(
    inv_id: int,
    req: InvestimentoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    inv = db.query(Investimento).filter(
        Investimento.id == inv_id,
        Investimento.usuario_id == usuario_id
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Investimento não encontrado")

    inv.nome              = req.nome
    inv.ticker            = req.ticker
    inv.tipo              = req.tipo
    inv.valor_investido   = req.valor_investido
    inv.valor_atual       = req.valor_atual
    inv.rentabilidade_mes = req.rentabilidade_mes
    inv.rentabilidade_ano = req.rentabilidade_ano

    db.commit()
    return _serialize(inv)


# ✅ DELETAR
@router.delete("/{inv_id}")
def deletar_investimento(
    inv_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    inv = db.query(Investimento).filter(
        Investimento.id == inv_id,
        Investimento.usuario_id == usuario_id
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Investimento não encontrado")

    db.delete(inv)
    db.commit()
    return {"message": "Investimento deletado"}
