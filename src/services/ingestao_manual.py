import calendar
from sqlalchemy.orm import Session
from datetime import datetime

from src.database.models import Gasto
from src.services.gastos_fixos import marcar_fixo


def parse_data(data_str: str) -> datetime:
    try:
        return datetime.fromisoformat(data_str)
    except:
        try:
            return datetime.strptime(data_str, "%d/%m/%Y")
        except:
            return datetime.now()


def _somar_mes(data: datetime, meses: int) -> datetime:
    total = data.month - 1 + meses
    ano = data.year + total // 12
    mes = total % 12 + 1
    dia = min(data.day, calendar.monthrange(ano, mes)[1])
    return data.replace(year=ano, month=mes, day=dia)


def adicionar_gasto_manual(
    db: Session,
    descricao: str,
    valor: float,
    categoria: str,
    usuario_id: int,
    banco: str,
    tipo: str,  # 👈 NOVO
    data_hora: str | None = None,
    forma_pagamento: str | None = None,
    fixo: bool = False,
    parcelas: int | None = None,
):
    descricao = (descricao or "").strip()
    if not descricao:
        descricao = "Sem descrição"

    data = parse_data(data_hora) if data_hora else datetime.now()

    if parcelas and parcelas > 1:
        # Gasto parcelado: gera uma entrada por mês, cada uma com o valor da parcela
        primeiro_id = None
        for i in range(1, parcelas + 1):
            gasto = Gasto(
                descricao=descricao,
                valor=valor,
                categoria=categoria,
                banco=banco,
                tipo=tipo,
                data_hora=_somar_mes(data, i - 1),
                parcela=f"{i}/{parcelas}",
                forma_pagamento=forma_pagamento,
                origem_id=primeiro_id,
                usuario_id=usuario_id
            )
            db.add(gasto)
            db.commit()
            db.refresh(gasto)
            if primeiro_id is None:
                primeiro_id = gasto.id
        return

    gasto = Gasto(
        descricao=descricao,
        valor=valor,
        categoria=categoria,
        banco=banco,
        tipo=tipo,  # 👈 IMPORTANTE
        data_hora=data,
        forma_pagamento=forma_pagamento,
        usuario_id=usuario_id
    )

    db.add(gasto)
    db.commit()
    db.refresh(gasto)

    if fixo:
        marcar_fixo(db, gasto, True)
