"""add pregunta_snapshot_id foreign key to respuestas_pregunta

Revision ID: add_pregunta_snapshot_fk
Revises: make_cuestionario_id_nullable
Create Date: 2025-01-06 00:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pregunta_snapshot_fk'
down_revision = 'make_cuestionario_id_nullable'
branch_labels = None
depends_on = None


def upgrade():
    """
    Añade foreign key de pregunta_snapshot_id en respuestas_pregunta.
    
    En SQLite, esto requiere recrear la tabla.
    """
    # Crear tabla temporal con la nueva estructura
    op.execute("""
        CREATE TABLE respuestas_pregunta_new (
            id INTEGER NOT NULL,
            respuesta_cuestionario_id VARCHAR NOT NULL,
            pregunta_id VARCHAR,
            pregunta_snapshot_id VARCHAR,
            valor JSON,
            texto_otro TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY(respuesta_cuestionario_id) REFERENCES respuestas_cuestionario (id) ON DELETE CASCADE,
            FOREIGN KEY(pregunta_id) REFERENCES preguntas (id) ON DELETE SET NULL,
            FOREIGN KEY(pregunta_snapshot_id) REFERENCES preguntas_snapshot (id) ON DELETE CASCADE
        )
    """)
    
    # Copiar datos existentes
    op.execute("""
        INSERT INTO respuestas_pregunta_new 
        (id, respuesta_cuestionario_id, pregunta_id, pregunta_snapshot_id, 
         valor, texto_otro, created_at, updated_at)
        SELECT 
            id, respuesta_cuestionario_id, pregunta_id, pregunta_snapshot_id,
            valor, texto_otro, created_at, updated_at
        FROM respuestas_pregunta
    """)
    
    # Eliminar tabla antigua
    op.execute("DROP TABLE respuestas_pregunta")
    
    # Renombrar tabla nueva
    op.execute("ALTER TABLE respuestas_pregunta_new RENAME TO respuestas_pregunta")
    
    # Recrear índices
    op.execute("CREATE INDEX ix_respuestas_pregunta_id ON respuestas_pregunta (id)")
    op.execute("CREATE INDEX ix_respuestas_pregunta_snapshot_id ON respuestas_pregunta (pregunta_snapshot_id)")


def downgrade():
    """
    Revierte el cambio eliminando la foreign key de pregunta_snapshot_id.
    """
    # Crear tabla temporal con la estructura antigua
    op.execute("""
        CREATE TABLE respuestas_pregunta_old (
            id INTEGER NOT NULL,
            respuesta_cuestionario_id VARCHAR NOT NULL,
            pregunta_id VARCHAR,
            valor JSON,
            texto_otro TEXT,
            pregunta_texto TEXT,
            pregunta_tipo VARCHAR,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY(respuesta_cuestionario_id) REFERENCES respuestas_cuestionario (id) ON DELETE CASCADE,
            FOREIGN KEY(pregunta_id) REFERENCES preguntas (id) ON DELETE SET NULL
        )
    """)
    
    # Copiar datos
    op.execute("""
        INSERT INTO respuestas_pregunta_old 
        (id, respuesta_cuestionario_id, pregunta_id, 
         valor, texto_otro, created_at, updated_at)
        SELECT 
            id, respuesta_cuestionario_id, pregunta_id,
            valor, texto_otro, created_at, updated_at
        FROM respuestas_pregunta
    """)
    
    # Eliminar tabla nueva
    op.execute("DROP TABLE respuestas_pregunta")
    
    # Renombrar tabla antigua
    op.execute("ALTER TABLE respuestas_pregunta_old RENAME TO respuestas_pregunta")
    
    # Recrear índices
    op.execute("CREATE INDEX ix_respuestas_pregunta_id ON respuestas_pregunta (id)")

