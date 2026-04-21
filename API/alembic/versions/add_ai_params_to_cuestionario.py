"""Add AI generation parameters to cuestionario_admin

Revision ID: add_ai_params_001
Revises: 
Create Date: 2025-01-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_ai_params_001'
down_revision = '004'  # Última revisión existente
branch_labels = None
depends_on = None


def upgrade():
    # Agregar columnas de parámetros de IA a cuestionarios_admin
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.add_column(sa.Column('min_tokens', sa.Integer(), nullable=True, server_default='1000'))
        batch_op.add_column(sa.Column('max_tokens', sa.Integer(), nullable=True, server_default='4000'))
        batch_op.add_column(sa.Column('temperature', sa.Integer(), nullable=True, server_default='70'))


def downgrade():
    # Eliminar columnas de parámetros de IA de cuestionarios_admin
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.drop_column('temperature')
        batch_op.drop_column('max_tokens')
        batch_op.drop_column('min_tokens')

