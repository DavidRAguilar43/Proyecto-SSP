"""drop old cuestionario table

Revision ID: 002
Revises: 001
Create Date: 2025-01-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """
    Elimina la tabla antigua 'cuestionario' del sistema viejo.
    El sistema nuevo usa las tablas: cuestionarios_admin, preguntas,
    respuestas_cuestionario, respuestas_pregunta, reportes_ia
    """
    # Eliminar tabla cuestionario (sistema viejo) solo si existe
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'cuestionario' in tables:
        op.drop_table('cuestionario')


def downgrade():
    """
    Recrea la tabla cuestionario si se necesita revertir la migración.
    Nota: Los datos no se pueden recuperar después de eliminar la tabla.
    """
    op.create_table(
        'cuestionario',
        sa.Column('id_cuestionario', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('variables', mysql.JSON(), nullable=True),
        sa.Column('tipo_cuestionario', sa.String(length=50), nullable=True),
        sa.Column('respuestas', mysql.JSON(), nullable=True),
        sa.Column('reporte_ia', sa.Text(), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=True),
        sa.Column('fecha_completado', sa.DateTime(), nullable=True),
        sa.Column('id_persona', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['id_persona'], ['personas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_cuestionario')
    )
