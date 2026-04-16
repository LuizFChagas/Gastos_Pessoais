from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from src.database.deps import get_db
from src.database.models import Investimento, Aporte
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


class AporteRequest(BaseModel):
    data: Optional[str] = None          # "YYYY-MM-DD"
    quantidade: Optional[float] = None
    preco_unitario: Optional[float] = None
    valor: float
    nota: Optional[str] = None


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


def _serialize_aporte(a):
    return {
        "id":             a.id,
        "investimento_id":a.investimento_id,
        "data":           a.data.isoformat() if a.data else None,
        "quantidade":     a.quantidade,
        "preco_unitario": a.preco_unitario,
        "valor":          a.valor,
        "nota":           a.nota,
    }


# ── INVESTIMENTOS ──────────────────────────────────────────────

@router.get("/")
def listar_investimentos(
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    itens = db.query(Investimento).filter(
        Investimento.usuario_id == usuario_id
    ).order_by(Investimento.criado_em.desc()).all()
    return [_serialize(i) for i in itens]


@router.post("/")
def criar_investimento(
    req: InvestimentoRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    inv = Investimento(
        usuario_id        = usuario_id,
        nome              = req.nome,
        ticker            = req.ticker,
        tipo              = req.tipo,
        valor_investido   = req.valor_investido,
        valor_atual       = req.valor_atual,
        rentabilidade_mes = req.rentabilidade_mes,
        rentabilidade_ano = req.rentabilidade_ano,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return _serialize(inv)


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


# ── APORTES ───────────────────────────────────────────────────

@router.get("/{inv_id}/aportes")
def listar_aportes(
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

    aportes = db.query(Aporte).filter(
        Aporte.investimento_id == inv_id
    ).order_by(Aporte.data.desc()).all()
    return [_serialize_aporte(a) for a in aportes]


@router.post("/{inv_id}/aportes")
def criar_aporte(
    inv_id: int,
    req: AporteRequest,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    inv = db.query(Investimento).filter(
        Investimento.id == inv_id,
        Investimento.usuario_id == usuario_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investimento não encontrado")

    data = datetime.fromisoformat(req.data) if req.data else datetime.utcnow()

    aporte = Aporte(
        investimento_id = inv_id,
        usuario_id      = usuario_id,
        data            = data,
        quantidade      = req.quantidade,
        preco_unitario  = req.preco_unitario,
        valor           = req.valor,
        nota            = req.nota,
    )
    db.add(aporte)

    # Atualiza valor_investido acumulando
    inv.valor_investido = (inv.valor_investido or 0) + req.valor
    db.commit()
    db.refresh(aporte)
    return _serialize_aporte(aporte)


@router.delete("/aportes/{aporte_id}")
def deletar_aporte(
    aporte_id: int,
    usuario_id: int = Depends(pegar_usuario_logado),
    db: Session = Depends(get_db)
):
    aporte = db.query(Aporte).filter(
        Aporte.id == aporte_id,
        Aporte.usuario_id == usuario_id
    ).first()
    if not aporte:
        raise HTTPException(status_code=404, detail="Aporte não encontrado")

    inv = db.query(Investimento).filter(Investimento.id == aporte.investimento_id).first()
    if inv:
        inv.valor_investido = max(0, (inv.valor_investido or 0) - aporte.valor)

    db.delete(aporte)
    db.commit()
    return {"message": "Aporte deletado"}
