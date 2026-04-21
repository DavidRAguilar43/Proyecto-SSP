"""rename_personas_to_users

Revision ID: d4125b855639
Revises: 002
Create Date: 2025-11-04 19:42:21.044341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4125b855639'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Rename personas table to users."""

    # Obtener inspector para verificar qué tablas existen
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Renombrar tabla principal de personas a users (solo si personas existe y users no)
    if 'personas' in tables and 'users' not in tables:
        op.rename_table('personas', 'users')
    elif 'personas' in tables and 'users' in tables:
        # Si ambas existen, copiar datos de personas a users y eliminar personas
        print("⚠️  Ambas tablas 'personas' y 'users' existen. Migrando datos...")
        # Copiar datos de personas a users si users está vacía
        conn.execute(sa.text("""
            INSERT OR IGNORE INTO users
            SELECT * FROM personas
        """))
        # Eliminar tabla personas
        op.drop_table('personas')

    # 2. Renombrar tablas de asociación many-to-many
    if 'persona_grupo' in tables and 'user_grupo' not in tables:
        op.rename_table('persona_grupo', 'user_grupo')
    elif 'persona_grupo' in tables and 'user_grupo' in tables:
        # Si ambas existen, copiar datos y eliminar la antigua
        conn.execute(sa.text("""
            INSERT OR IGNORE INTO user_grupo
            SELECT * FROM persona_grupo
        """))
        op.drop_table('persona_grupo')

    if 'persona_programa' in tables and 'user_programa' not in tables:
        op.rename_table('persona_programa', 'user_programa')
    elif 'persona_programa' in tables and 'user_programa' in tables:
        # Si ambas existen, copiar datos y eliminar la antigua
        conn.execute(sa.text("""
            INSERT OR IGNORE INTO user_programa
            SELECT * FROM persona_programa
        """))
        op.drop_table('persona_programa')

    # 3. Renombrar columnas id_persona a id_user en tablas relacionadas

    # Verificar si las columnas existen antes de renombrarlas
    personal_columns = [col['name'] for col in inspector.get_columns('personal')]
    contacto_columns = [col['name'] for col in inspector.get_columns('contacto_emergencia')]

    # Para SQLite, necesitamos recrear las tablas para renombrar columnas
    # Tabla: personal
    if 'id_persona' in personal_columns:
        # Crear tabla temporal
        conn.execute(sa.text("""
            CREATE TABLE personal_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area VARCHAR,
                rol VARCHAR,
                numero_empleado VARCHAR UNIQUE,
                id_user INTEGER,
                FOREIGN KEY (id_user) REFERENCES users(id)
            )
        """))
        # Copiar datos
        conn.execute(sa.text("""
            INSERT INTO personal_new (id, area, rol, numero_empleado, id_user)
            SELECT id, area, rol, numero_empleado, id_persona FROM personal
        """))
        # Eliminar tabla antigua y renombrar la nueva
        conn.execute(sa.text("DROP TABLE personal"))
        conn.execute(sa.text("ALTER TABLE personal_new RENAME TO personal"))

    # Tabla: contacto_emergencia
    if 'id_persona' in contacto_columns:
        # Crear tabla temporal
        conn.execute(sa.text("""
            CREATE TABLE contacto_emergencia_new (
                id_contacto INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_contacto VARCHAR,
                telefono_contacto VARCHAR,
                parentesco VARCHAR,
                id_user INTEGER,
                FOREIGN KEY (id_user) REFERENCES users(id)
            )
        """))
        # Copiar datos
        conn.execute(sa.text("""
            INSERT INTO contacto_emergencia_new (id_contacto, nombre_contacto, telefono_contacto, parentesco, id_user)
            SELECT id_contacto, nombre_contacto, telefono_contacto, parentesco, id_persona FROM contacto_emergencia
        """))
        # Eliminar tabla antigua y renombrar la nueva
        conn.execute(sa.text("DROP TABLE contacto_emergencia"))
        conn.execute(sa.text("ALTER TABLE contacto_emergencia_new RENAME TO contacto_emergencia"))

    # Tabla: citas (tiene id_alumno e id_personal que apuntan a users)
    # No necesita cambios de nombre de columna, solo las ForeignKeys ya apuntan a users

    # Tabla: cuestionarios_admin (tiene creado_por que apunta a users)
    # No necesita cambios de nombre de columna

    # Tabla: respuestas_cuestionario (tiene usuario_id que apunta a users)
    # No necesita cambios de nombre de columna

    # Tabla: notificaciones_registro (tiene usuario_solicitante_id y usuario_destinatario_id)
    # No necesita cambios de nombre de columna


def downgrade() -> None:
    """Downgrade schema: Rename users table back to personas."""

    # 1. Renombrar columnas id_user de vuelta a id_persona en tablas relacionadas

    # Tabla: contacto_emergencia
    with op.batch_alter_table('contacto_emergencia', schema=None) as batch_op:
        batch_op.alter_column('id_user',
                              new_column_name='id_persona',
                              existing_type=sa.Integer(),
                              existing_nullable=True)

    # Tabla: personal
    with op.batch_alter_table('personal', schema=None) as batch_op:
        batch_op.alter_column('id_user',
                              new_column_name='id_persona',
                              existing_type=sa.Integer(),
                              existing_nullable=True)

    # 2. Renombrar tablas de asociación de vuelta
    op.rename_table('user_programa', 'persona_programa')
    op.rename_table('user_grupo', 'persona_grupo')

    # 3. Renombrar tabla principal de users de vuelta a personas
    op.rename_table('users', 'personas')
