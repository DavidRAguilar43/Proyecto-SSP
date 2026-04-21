"""Fix cuestionarios_admin FK to users table

Revision ID: 004
Revises: 003
Create Date: 2025-11-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Corregir la FK de cuestionarios_admin.creado_por para que apunte a users en lugar de personas.
    """
    conn = op.get_bind()

    # IMPORTANTE: Deshabilitar foreign keys temporalmente para poder eliminar la tabla
    # Reason: SQLite verifica las FKs al eliminar tablas, y la FK a 'personas' no existe
    conn.execute(sa.text("PRAGMA foreign_keys=OFF"))

    # SQLite no soporta ALTER CONSTRAINT, necesitamos recrear la tabla
    # Paso 1: Crear tabla temporal con la FK correcta
    op.create_table(
        'cuestionarios_admin_new',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('titulo', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=False),
        sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('fecha_inicio', sa.DateTime(), nullable=True),
        sa.Column('fecha_fin', sa.DateTime(), nullable=True),
        sa.Column('estado', sa.String(length=8), nullable=False),
        sa.Column('creado_por', sa.Integer(), nullable=False),
        sa.Column('instruccion_sistema', sa.Text(), nullable=True),
        sa.Column('modelo_ia', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['creado_por'], ['users.id']),  # FK correcta a users
        sa.PrimaryKeyConstraint('id')
    )

    # Paso 2: Copiar datos
    conn.execute(sa.text("""
        INSERT INTO cuestionarios_admin_new
        (id, titulo, descripcion, fecha_creacion, fecha_inicio, fecha_fin, estado, creado_por,
         instruccion_sistema, modelo_ia, created_at, updated_at)
        SELECT id, titulo, descripcion, fecha_creacion, fecha_inicio, fecha_fin, estado, creado_por,
               instruccion_sistema, modelo_ia, created_at, updated_at
        FROM cuestionarios_admin
    """))

    # Paso 3: Eliminar tabla antigua y renombrar
    op.drop_table('cuestionarios_admin')
    op.rename_table('cuestionarios_admin_new', 'cuestionarios_admin')

    # Paso 4: Recrear índices
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.create_index('ix_cuestionarios_admin_id', ['id'], unique=False)
        batch_op.create_index('ix_cuestionarios_admin_titulo', ['titulo'], unique=False)

    # Paso 5: Rehabilitar foreign keys
    conn.execute(sa.text("PRAGMA foreign_keys=ON"))


def downgrade() -> None:
    """
    Revertir la FK a personas (no recomendado).
    """
    conn = op.get_bind()
    
    # Recrear tabla con FK a personas
    op.create_table(
        'cuestionarios_admin_old',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('titulo', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=False),
        sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('fecha_inicio', sa.DateTime(), nullable=True),
        sa.Column('fecha_fin', sa.DateTime(), nullable=True),
        sa.Column('estado', sa.String(length=8), nullable=False),
        sa.Column('creado_por', sa.Integer(), nullable=False),
        sa.Column('instruccion_sistema', sa.Text(), nullable=True),
        sa.Column('modelo_ia', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['creado_por'], ['personas.id']),  # FK a personas
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copiar datos
    conn.execute(sa.text("""
        INSERT INTO cuestionarios_admin_old 
        (id, titulo, descripcion, fecha_creacion, fecha_inicio, fecha_fin, estado, creado_por,
         instruccion_sistema, modelo_ia, created_at, updated_at)
        SELECT id, titulo, descripcion, fecha_creacion, fecha_inicio, fecha_fin, estado, creado_por,
               instruccion_sistema, modelo_ia, created_at, updated_at
        FROM cuestionarios_admin
    """))
    
    # Eliminar y renombrar
    op.drop_table('cuestionarios_admin')
    op.rename_table('cuestionarios_admin_old', 'cuestionarios_admin')
    
    # Recrear índices
    with op.batch_alter_table('cuestionarios_admin', schema=None) as batch_op:
        batch_op.create_index('ix_cuestionarios_admin_id', ['id'], unique=False)
        batch_op.create_index('ix_cuestionarios_admin_titulo', ['titulo'], unique=False)

