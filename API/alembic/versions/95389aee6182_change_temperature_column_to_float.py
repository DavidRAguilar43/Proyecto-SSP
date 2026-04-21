"""Change temperature column to Float

Revision ID: 95389aee6182
Revises: add_ai_params_001
Create Date: 2025-11-05 16:24:10.770905

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95389aee6182'
down_revision: Union[str, None] = 'add_ai_params_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite no soporta ALTER COLUMN directamente, necesitamos recrear la tabla
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        # Primero, crear una nueva columna temporal
        batch_op.add_column(sa.Column('temperature_new', sa.Float(), nullable=True))

    # Copiar datos de la columna antigua a la nueva (dividiendo por 100 si es necesario)
    # Si el valor es mayor a 10, asumimos que está en escala 0-100 y lo dividimos
    op.execute("""
        UPDATE cuestionarios_admin
        SET temperature_new = CASE
            WHEN temperature > 10 THEN CAST(temperature AS REAL) / 100.0
            ELSE CAST(temperature AS REAL)
        END
    """)

    # Eliminar la columna antigua y renombrar la nueva
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.drop_column('temperature')
        batch_op.alter_column('temperature_new', new_column_name='temperature')


def downgrade() -> None:
    """Downgrade schema."""
    # Revertir: Float a Integer
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.add_column(sa.Column('temperature_old', sa.Integer(), nullable=True))

    # Copiar datos multiplicando por 100
    op.execute("""
        UPDATE cuestionarios_admin
        SET temperature_old = CAST(temperature * 100 AS INTEGER)
    """)

    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.drop_column('temperature')
        batch_op.alter_column('temperature_old', new_column_name='temperature')
