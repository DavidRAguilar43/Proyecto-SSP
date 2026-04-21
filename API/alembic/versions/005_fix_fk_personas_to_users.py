"""fix foreign key personas to users

Revision ID: 005
Revises: 004
Create Date: 2025-01-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Arreglar foreign key de respuestas_cuestionario.usuario_id
    que apunta a 'personas' (tabla que ya no existe) para que apunte a 'users'

    Reason: Al habilitar PRAGMA foreign_keys=ON, SQLite valida todas las FKs
    y falla porque 'personas' fue renombrada a 'users' pero la FK no se actualizó.

    IMPORTANTE: Usamos SQL directo porque batch_alter_table falla al intentar
    reflejar una tabla con FK a una tabla inexistente.
    """

    # SQLite no soporta ALTER TABLE para modificar FKs directamente
    # Necesitamos recrear la tabla completa

    # Paso 1: Deshabilitar temporalmente las FKs para poder trabajar
    op.execute('PRAGMA foreign_keys=OFF')

    # Paso 2: Renombrar la tabla actual
    op.rename_table('respuestas_cuestionario', 'respuestas_cuestionario_old')

    # Paso 3: Crear la nueva tabla con la FK correcta
    op.execute('''
        CREATE TABLE respuestas_cuestionario (
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
    ''')

    # Paso 4: Copiar los datos
    op.execute('''
        INSERT INTO respuestas_cuestionario
        SELECT * FROM respuestas_cuestionario_old
    ''')

    # Paso 5: Eliminar la tabla antigua
    op.execute('DROP TABLE respuestas_cuestionario_old')

    # Paso 6: Reactivar las FKs
    op.execute('PRAGMA foreign_keys=ON')


def downgrade() -> None:
    """
    Revertir el cambio (volver a apuntar a 'personas')
    """
    with op.batch_alter_table('respuestas_cuestionario', schema=None) as batch_op:
        # Eliminar la FK a 'users'
        batch_op.drop_constraint('fk_respuestas_cuestionario_usuario_id_users', type_='foreignkey')
        
        # Recrear la FK a 'personas'
        batch_op.create_foreign_key(
            'fk_respuestas_cuestionario_usuario_id_personas',
            'personas',
            ['usuario_id'],
            ['id'],
            ondelete='CASCADE'
        )

