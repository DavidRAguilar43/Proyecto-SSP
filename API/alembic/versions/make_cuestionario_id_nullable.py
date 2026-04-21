"""make cuestionario_id nullable in respuestas_cuestionario

Revision ID: make_cuestionario_id_nullable
Revises: c82fa1995974
Create Date: 2025-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_cuestionario_id_nullable'
down_revision = 'c82fa1995974'
branch_labels = None
depends_on = None


def upgrade():
    """
    Hace que cuestionario_id sea nullable en respuestas_cuestionario.
    
    En SQLite, esto requiere recrear la tabla porque no se pueden
    modificar columnas directamente.
    """
    # Crear tabla temporal con la nueva estructura
    # NOTA: snapshot_id es nullable para permitir respuestas existentes sin snapshot
    op.execute("""
        CREATE TABLE respuestas_cuestionario_new (
            id VARCHAR NOT NULL,
            cuestionario_id VARCHAR,
            snapshot_id VARCHAR,
            usuario_id INTEGER NOT NULL,
            estado VARCHAR NOT NULL,
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            fecha_completado DATETIME,
            progreso INTEGER NOT NULL,
            tiempo_total_minutos INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY(cuestionario_id) REFERENCES cuestionarios_admin (id) ON DELETE SET NULL,
            FOREIGN KEY(snapshot_id) REFERENCES cuestionarios_snapshot (id) ON DELETE CASCADE,
            FOREIGN KEY(usuario_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Copiar datos existentes
    # NOTA: Las respuestas existentes tendrán snapshot_id NULL por ahora
    op.execute("""
        INSERT INTO respuestas_cuestionario_new 
        (id, cuestionario_id, snapshot_id, usuario_id, estado, fecha_inicio, 
         fecha_completado, progreso, tiempo_total_minutos, created_at, updated_at)
        SELECT 
            id, cuestionario_id, snapshot_id, usuario_id, estado, fecha_inicio,
            fecha_completado, progreso, tiempo_total_minutos, created_at, updated_at
        FROM respuestas_cuestionario
    """)
    
    # Eliminar tabla antigua
    op.execute("DROP TABLE respuestas_cuestionario")
    
    # Renombrar tabla nueva
    op.execute("ALTER TABLE respuestas_cuestionario_new RENAME TO respuestas_cuestionario")
    
    # Recrear índices
    op.execute("CREATE INDEX ix_respuestas_cuestionario_id ON respuestas_cuestionario (id)")
    op.execute("CREATE INDEX ix_respuestas_cuestionario_snapshot_id ON respuestas_cuestionario (snapshot_id)")


def downgrade():
    """
    Revierte el cambio haciendo cuestionario_id NOT NULL nuevamente.
    
    ADVERTENCIA: Esto fallará si hay registros con cuestionario_id NULL.
    """
    # Crear tabla temporal con la estructura antigua
    op.execute("""
        CREATE TABLE respuestas_cuestionario_old (
            id VARCHAR NOT NULL,
            cuestionario_id VARCHAR NOT NULL,
            usuario_id INTEGER NOT NULL,
            estado VARCHAR NOT NULL,
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            fecha_completado DATETIME,
            progreso INTEGER NOT NULL,
            tiempo_total_minutos INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY(cuestionario_id) REFERENCES cuestionarios_admin (id) ON DELETE CASCADE,
            FOREIGN KEY(usuario_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Copiar datos (solo los que tienen cuestionario_id)
    op.execute("""
        INSERT INTO respuestas_cuestionario_old 
        (id, cuestionario_id, usuario_id, estado, fecha_inicio, 
         fecha_completado, progreso, tiempo_total_minutos, created_at, updated_at)
        SELECT 
            id, cuestionario_id, usuario_id, estado, fecha_inicio,
            fecha_completado, progreso, tiempo_total_minutos, created_at, updated_at
        FROM respuestas_cuestionario
        WHERE cuestionario_id IS NOT NULL
    """)
    
    # Eliminar tabla nueva
    op.execute("DROP TABLE respuestas_cuestionario")
    
    # Renombrar tabla antigua
    op.execute("ALTER TABLE respuestas_cuestionario_old RENAME TO respuestas_cuestionario")
    
    # Recrear índices
    op.execute("CREATE INDEX ix_respuestas_cuestionario_id ON respuestas_cuestionario (id)")

