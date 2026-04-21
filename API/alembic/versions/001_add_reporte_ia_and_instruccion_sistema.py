"""Add ReporteIA table and instruccion_sistema field to CuestionarioAdmin

Revision ID: 001
Revises: 
Create Date: 2025-11-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar campo instruccion_sistema a cuestionarios_admin
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.add_column(sa.Column('instruccion_sistema', sa.Text(), nullable=True))

    # Crear tabla reportes_ia
    op.create_table(
        'reportes_ia',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('respuesta_cuestionario_id', sa.String(), nullable=False),
        sa.Column('contenido', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('es_actual', sa.Boolean(), nullable=False),
        sa.Column('fecha_generacion', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['respuesta_cuestionario_id'], ['respuestas_cuestionario.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_reportes_ia_id', 'id'),
        sa.Index('ix_reportes_ia_respuesta_cuestionario_id', 'respuesta_cuestionario_id')
    )


def downgrade() -> None:
    # Eliminar tabla reportes_ia
    op.drop_table('reportes_ia')

    # Eliminar campo instruccion_sistema de cuestionarios_admin
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.drop_column('instruccion_sistema')

