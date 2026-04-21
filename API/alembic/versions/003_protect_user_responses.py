"""Protect user responses from question deletion

Revision ID: 003
Revises: d4125b855639
Create Date: 2025-11-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '003'
down_revision = 'd4125b855639'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Proteger las respuestas de usuarios cuando se eliminan preguntas.
    
    Cambios:
    1. Agregar campos pregunta_texto y pregunta_tipo a respuestas_pregunta
    2. Cambiar FK pregunta_id de CASCADE a SET NULL
    3. Hacer pregunta_id nullable
    
    Esto preserva las respuestas de usuarios incluso si se edita/elimina una pregunta.
    """
    # Paso 1: Agregar nuevas columnas para preservar información de preguntas
    with op.batch_alter_table('respuestas_pregunta', schema=None) as batch_op:
        batch_op.add_column(sa.Column('pregunta_texto', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('pregunta_tipo', sa.String(), nullable=True))
    
    # Paso 2: Poblar los nuevos campos con datos existentes
    # Esto se hace antes de cambiar la FK para preservar la información
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE respuestas_pregunta
        SET pregunta_texto = (
            SELECT texto FROM preguntas WHERE preguntas.id = respuestas_pregunta.pregunta_id
        ),
        pregunta_tipo = (
            SELECT tipo FROM preguntas WHERE preguntas.id = respuestas_pregunta.pregunta_id
        )
        WHERE pregunta_id IS NOT NULL
    """))
    
    # Paso 3: Recrear la tabla con la nueva FK (SQLite no soporta ALTER CONSTRAINT)
    # Primero, crear tabla temporal con la nueva estructura
    op.create_table(
        'respuestas_pregunta_new',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('respuesta_cuestionario_id', sa.String(), nullable=False),
        sa.Column('pregunta_id', sa.String(), nullable=True),  # Ahora nullable
        sa.Column('valor', sa.JSON(), nullable=True),
        sa.Column('texto_otro', sa.Text(), nullable=True),
        sa.Column('pregunta_texto', sa.Text(), nullable=True),
        sa.Column('pregunta_tipo', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['respuesta_cuestionario_id'], ['respuestas_cuestionario.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pregunta_id'], ['preguntas.id'], ondelete='SET NULL'),  # SET NULL en lugar de CASCADE
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    
    # Copiar datos de la tabla antigua a la nueva
    conn.execute(sa.text("""
        INSERT INTO respuestas_pregunta_new 
        (id, respuesta_cuestionario_id, pregunta_id, valor, texto_otro, pregunta_texto, pregunta_tipo, created_at, updated_at)
        SELECT id, respuesta_cuestionario_id, pregunta_id, valor, texto_otro, pregunta_texto, pregunta_tipo, created_at, updated_at
        FROM respuestas_pregunta
    """))
    
    # Eliminar tabla antigua y renombrar la nueva
    op.drop_table('respuestas_pregunta')
    op.rename_table('respuestas_pregunta_new', 'respuestas_pregunta')


def downgrade() -> None:
    """
    Revertir los cambios: volver a CASCADE y eliminar campos adicionales.
    
    ADVERTENCIA: Esto puede causar pérdida de datos si hay respuestas
    con pregunta_id NULL.
    """
    # Recrear tabla con FK CASCADE
    op.create_table(
        'respuestas_pregunta_old',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('respuesta_cuestionario_id', sa.String(), nullable=False),
        sa.Column('pregunta_id', sa.String(), nullable=False),  # Volver a NOT NULL
        sa.Column('valor', sa.JSON(), nullable=True),
        sa.Column('texto_otro', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['respuesta_cuestionario_id'], ['respuestas_cuestionario.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pregunta_id'], ['preguntas.id'], ondelete='CASCADE'),  # Volver a CASCADE
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    
    # Copiar solo las respuestas que tienen pregunta_id válido
    conn = op.get_bind()
    conn.execute(sa.text("""
        INSERT INTO respuestas_pregunta_old 
        (id, respuesta_cuestionario_id, pregunta_id, valor, texto_otro, created_at, updated_at)
        SELECT id, respuesta_cuestionario_id, pregunta_id, valor, texto_otro, created_at, updated_at
        FROM respuestas_pregunta
        WHERE pregunta_id IS NOT NULL
    """))
    
    # Eliminar tabla nueva y renombrar la antigua
    op.drop_table('respuestas_pregunta')
    op.rename_table('respuestas_pregunta_old', 'respuestas_pregunta')

