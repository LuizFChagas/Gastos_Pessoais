"""criptografa campos sensiveis (descricao/valor de gasto, dados de
investimento/aporte, nome de arquivo de extrato) com Fernet

Muda o tipo da coluna de float/varchar pra text (o token Fernet é uma
string), e recifra o dado que já existe em produção. Roda em uma
transação só: se a chave ENCRYPTION_KEY não estiver certa ou faltar,
a migração falha e nada fica salvo pela metade.

Revision ID: d4a8e2c6f9b1
Revises: c8f3d1a9b2e7
Create Date: 2026-08-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from src.core.config import ENCRYPTION_KEY
from cryptography.fernet import Fernet


revision: str = 'd4a8e2c6f9b1'
down_revision: Union[str, Sequence[str], None] = 'c8f3d1a9b2e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# tabela -> [(coluna, é_float)]
_CAMPOS = {
    "gastos": [("descricao", False), ("valor", True)],
    "extratos": [("nome_arquivo", False)],
    "investimentos": [
        ("nome", False), ("ticker", False),
        ("valor_investido", True), ("valor_atual", True),
        ("rentabilidade_mes", True), ("rentabilidade_ano", True),
    ],
    "aportes": [
        ("valor", True), ("quantidade", True),
        ("preco_unitario", True), ("nota", False),
    ],
}


def upgrade() -> None:
    fernet = Fernet(ENCRYPTION_KEY.encode())
    conn = op.get_bind()

    for tabela, colunas in _CAMPOS.items():
        for coluna, _ in colunas:
            op.alter_column(tabela, coluna, type_=sa.Text(), postgresql_using=f"{coluna}::text")

        nomes_colunas = [c for c, _ in colunas]
        linhas = conn.execute(
            sa.text(f"SELECT id, {', '.join(nomes_colunas)} FROM {tabela}")
        ).fetchall()

        for linha in linhas:
            valores_cifrados = {}
            for coluna, _ in colunas:
                valor_atual = getattr(linha, coluna)
                if valor_atual is None:
                    valores_cifrados[coluna] = None
                else:
                    valores_cifrados[coluna] = fernet.encrypt(str(valor_atual).encode()).decode()

            set_clause = ", ".join(f"{c} = :{c}" for c in nomes_colunas)
            conn.execute(
                sa.text(f"UPDATE {tabela} SET {set_clause} WHERE id = :id"),
                {**valores_cifrados, "id": linha.id},
            )


def downgrade() -> None:
    fernet = Fernet(ENCRYPTION_KEY.encode())
    conn = op.get_bind()

    for tabela, colunas in _CAMPOS.items():
        nomes_colunas = [c for c, _ in colunas]
        linhas = conn.execute(
            sa.text(f"SELECT id, {', '.join(nomes_colunas)} FROM {tabela}")
        ).fetchall()

        for linha in linhas:
            valores_decifrados = {}
            for coluna, _ in colunas:
                valor_atual = getattr(linha, coluna)
                valores_decifrados[coluna] = (
                    None if valor_atual is None else fernet.decrypt(valor_atual.encode()).decode()
                )

            set_clause = ", ".join(f"{c} = :{c}" for c in nomes_colunas)
            conn.execute(
                sa.text(f"UPDATE {tabela} SET {set_clause} WHERE id = :id"),
                {**valores_decifrados, "id": linha.id},
            )

        for coluna, e_float in colunas:
            tipo = sa.Float() if e_float else sa.String()
            using = f"{coluna}::double precision" if e_float else coluna
            op.alter_column(tabela, coluna, type_=tipo, postgresql_using=using)
