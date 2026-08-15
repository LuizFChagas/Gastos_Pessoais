import calendar
from datetime import datetime

from sqlalchemy import extract
from sqlalchemy.orm import Session

from src.database.models import Gasto


def _somar_mes(data: datetime, meses: int = 1) -> datetime:
    total = data.month - 1 + meses
    ano = data.year + total // 12
    mes = total % 12 + 1
    dia = min(data.day, calendar.monthrange(ano, mes)[1])
    return data.replace(year=ano, month=mes, day=dia)


def _gerar_copia(db: Session, root: Gasto, base: Gasto) -> Gasto | None:
    """Gera a cópia do próximo mês em relação a `base`, vinculada à raiz `root`
    da cadeia (via origem_id). Não gera duplicata se já existir uma cópia para
    aquele mês."""
    proxima_data = _somar_mes(base.data_hora, 1)

    existe = db.query(Gasto).filter(
        Gasto.origem_id == root.id,
        extract("year", Gasto.data_hora) == proxima_data.year,
        extract("month", Gasto.data_hora) == proxima_data.month,
    ).first()
    if existe:
        return None

    copia = Gasto(
        descricao=base.descricao,
        valor=base.valor,
        categoria=base.categoria,
        categoria_manual=base.categoria_manual,
        banco=base.banco,
        tipo=base.tipo,
        forma_pagamento=base.forma_pagamento,
        data_hora=proxima_data,
        fixo=True,
        origem_id=root.id,
        usuario_id=base.usuario_id,
    )
    db.add(copia)
    db.commit()
    db.refresh(copia)
    return copia


def marcar_fixo(db: Session, gasto: Gasto, fixo: bool) -> None:
    """Marca/desmarca um gasto como fixo. Ao marcar, gera imediatamente uma
    cópia para o próximo mês (a cadeia continua sozinha depois disso via
    processar_gastos_fixos, só quando o mês gerado já tiver outros dados)."""
    gasto.fixo = fixo
    db.commit()

    if fixo:
        root = gasto
        if gasto.origem_id is not None:
            root = db.query(Gasto).filter(Gasto.id == gasto.origem_id).first() or gasto
        _gerar_copia(db, root, gasto)


def processar_gastos_fixos(db: Session, usuario_id: int) -> None:
    """Para cada cadeia de gasto fixo do usuário, olha a última cópia gerada
    (a 'ponta' da cadeia); se o mês dela já tem outros lançamentos além dela
    mesma, gera a cópia do mês seguinte. Evita gerar muitos meses vazios à toa."""
    raizes = db.query(Gasto).filter(
        Gasto.usuario_id == usuario_id,
        Gasto.fixo.is_(True),
        Gasto.origem_id.is_(None),
    ).all()

    for root in raizes:
        copias = db.query(Gasto).filter(
            Gasto.origem_id == root.id
        ).order_by(Gasto.data_hora.desc()).all()

        ponta = copias[0] if copias else root

        outros_dados = db.query(Gasto).filter(
            Gasto.usuario_id == usuario_id,
            Gasto.id != ponta.id,
            extract("year", Gasto.data_hora) == ponta.data_hora.year,
            extract("month", Gasto.data_hora) == ponta.data_hora.month,
        ).count()

        if outros_dados > 0:
            _gerar_copia(db, root, ponta)
