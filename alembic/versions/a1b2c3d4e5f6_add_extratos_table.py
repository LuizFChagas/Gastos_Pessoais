"""add extratos table and extrato_id to gastos

Revision ID: a1b2c3d4e5f6
Revises: 2549d157e4c7
Create Date: 2026-04-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '2549d157e4c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'extratos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome_arquivo', sa.String(), nullable=True),
        sa.Column('banco', sa.String(), nullable=True),
        sa.Column('data_importacao', sa.DateTime(), nullable=True),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_extratos_id'), 'extratos', ['id'], unique=False)
    op.create_index(op.f('ix_extratos_usuario_id'), 'extratos', ['usuario_id'], unique=False)

    op.add_column('gastos', sa.Column('extrato_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_gastos_extrato_id'), 'gastos', ['extrato_id'], unique=False)
    op.create_foreign_key('fk_gastos_extrato_id', 'gastos', 'extratos', ['extrato_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_gastos_extrato_id', 'gastos', type_='foreignkey')
    op.drop_index(op.f('ix_gastos_extrato_id'), table_name='gastos')
    op.drop_column('gastos', 'extrato_id')

    op.drop_index(op.f('ix_extratos_usuario_id'), table_name='extratos')
    op.drop_index(op.f('ix_extratos_id'), table_name='extratos')
    op.drop_table('extratos')
