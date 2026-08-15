"""add forma_pagamento, fixo, origem_id, ajuste_saldo, motivo_ajuste to gastos; categorias_personalizadas table

Revision ID: c8f3d1a9b2e7
Revises: b7e2c9f4a1d3
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8f3d1a9b2e7'
down_revision: Union[str, Sequence[str], None] = 'b7e2c9f4a1d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── gastos: forma de pagamento, gasto fixo/recorrente, parcelamento, ajuste de saldo ──
    op.add_column('gastos', sa.Column('forma_pagamento', sa.String(), nullable=True))
    op.add_column('gastos', sa.Column('fixo', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('gastos', sa.Column('origem_id', sa.Integer(), nullable=True))
    op.add_column('gastos', sa.Column('ajuste_saldo', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('gastos', sa.Column('motivo_ajuste', sa.String(), nullable=True))
    op.create_foreign_key('fk_gastos_origem_id', 'gastos', 'gastos', ['origem_id'], ['id'])
    op.create_index(op.f('ix_gastos_origem_id'), 'gastos', ['origem_id'], unique=False)

    # ── categorias_personalizadas ──
    # Guarda com "se não existir" porque o Base.metadata.create_all() que roda
    # no startup do backend (src/api/main.py) pode ter criado essa tabela
    # antes da migração rodar, caso o deploy tenha subido o código novo primeiro.
    inspector = sa.inspect(op.get_bind())
    if 'categorias_personalizadas' not in inspector.get_table_names():
        op.create_table(
            'categorias_personalizadas',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=True),
            sa.Column('nome', sa.String(), nullable=True),
            sa.Column('cor', sa.String(), nullable=True),
            sa.Column('criado_em', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
            sa.PrimaryKeyConstraint('id')
        )

    indices_existentes = {ix['name'] for ix in inspector.get_indexes('categorias_personalizadas')} \
        if 'categorias_personalizadas' in inspector.get_table_names() else set()
    if op.f('ix_categorias_personalizadas_id') not in indices_existentes:
        op.create_index(op.f('ix_categorias_personalizadas_id'), 'categorias_personalizadas', ['id'], unique=False)
    if op.f('ix_categorias_personalizadas_usuario_id') not in indices_existentes:
        op.create_index(op.f('ix_categorias_personalizadas_usuario_id'), 'categorias_personalizadas', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_categorias_personalizadas_usuario_id'), table_name='categorias_personalizadas')
    op.drop_index(op.f('ix_categorias_personalizadas_id'), table_name='categorias_personalizadas')
    op.drop_table('categorias_personalizadas')

    op.drop_index(op.f('ix_gastos_origem_id'), table_name='gastos')
    op.drop_constraint('fk_gastos_origem_id', 'gastos', type_='foreignkey')
    op.drop_column('gastos', 'motivo_ajuste')
    op.drop_column('gastos', 'ajuste_saldo')
    op.drop_column('gastos', 'origem_id')
    op.drop_column('gastos', 'fixo')
    op.drop_column('gastos', 'forma_pagamento')
