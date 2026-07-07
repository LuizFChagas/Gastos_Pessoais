"""add 2fa, email verification, reset password and plano columns; investimentos, aportes, sugestoes tables

Revision ID: b7e2c9f4a1d3
Revises: a1b2c3d4e5f6
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e2c9f4a1d3'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── usuarios: 2FA, verificação de email, reset de senha, plano ──
    op.add_column('usuarios', sa.Column('two_fa_enabled', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('usuarios', sa.Column('otp_code', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('otp_expiry', sa.DateTime(), nullable=True))
    op.add_column('usuarios', sa.Column('email_verificado', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('usuarios', sa.Column('verificacao_token', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('reset_token', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('reset_token_expiry', sa.DateTime(), nullable=True))
    op.add_column('usuarios', sa.Column('plano', sa.String(), nullable=True, server_default='free'))

    # ── investimentos ──
    op.create_table(
        'investimentos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('nome', sa.String(), nullable=True),
        sa.Column('ticker', sa.String(), nullable=True),
        sa.Column('tipo', sa.String(), nullable=True),
        sa.Column('valor_investido', sa.Float(), nullable=True),
        sa.Column('valor_atual', sa.Float(), nullable=True),
        sa.Column('rentabilidade_mes', sa.Float(), nullable=True),
        sa.Column('rentabilidade_ano', sa.Float(), nullable=True),
        sa.Column('criado_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_investimentos_id'), 'investimentos', ['id'], unique=False)
    op.create_index(op.f('ix_investimentos_usuario_id'), 'investimentos', ['usuario_id'], unique=False)

    # ── aportes ──
    op.create_table(
        'aportes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('investimento_id', sa.Integer(), nullable=True),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('data', sa.DateTime(), nullable=True),
        sa.Column('quantidade', sa.Float(), nullable=True),
        sa.Column('preco_unitario', sa.Float(), nullable=True),
        sa.Column('valor', sa.Float(), nullable=True),
        sa.Column('nota', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['investimento_id'], ['investimentos.id']),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_aportes_id'), 'aportes', ['id'], unique=False)
    op.create_index(op.f('ix_aportes_investimento_id'), 'aportes', ['investimento_id'], unique=False)
    op.create_index(op.f('ix_aportes_usuario_id'), 'aportes', ['usuario_id'], unique=False)

    # ── sugestoes ──
    op.create_table(
        'sugestoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('texto', sa.String(), nullable=True),
        sa.Column('criado_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sugestoes_id'), 'sugestoes', ['id'], unique=False)
    op.create_index(op.f('ix_sugestoes_usuario_id'), 'sugestoes', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_sugestoes_usuario_id'), table_name='sugestoes')
    op.drop_index(op.f('ix_sugestoes_id'), table_name='sugestoes')
    op.drop_table('sugestoes')

    op.drop_index(op.f('ix_aportes_usuario_id'), table_name='aportes')
    op.drop_index(op.f('ix_aportes_investimento_id'), table_name='aportes')
    op.drop_index(op.f('ix_aportes_id'), table_name='aportes')
    op.drop_table('aportes')

    op.drop_index(op.f('ix_investimentos_usuario_id'), table_name='investimentos')
    op.drop_index(op.f('ix_investimentos_id'), table_name='investimentos')
    op.drop_table('investimentos')

    op.drop_column('usuarios', 'plano')
    op.drop_column('usuarios', 'reset_token_expiry')
    op.drop_column('usuarios', 'reset_token')
    op.drop_column('usuarios', 'verificacao_token')
    op.drop_column('usuarios', 'email_verificado')
    op.drop_column('usuarios', 'otp_expiry')
    op.drop_column('usuarios', 'otp_code')
    op.drop_column('usuarios', 'two_fa_enabled')
