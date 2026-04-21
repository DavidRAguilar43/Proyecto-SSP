"""
Script para corregir la foreign key de reportes_ia.

La tabla reportes_ia tiene una FK que apunta a respuestas_cuestionario_old
en lugar de respuestas_cuestionario. Esto causa errores al intentar
cancelar o eliminar respuestas.

Reason: Quedó de una migración anterior que no se completó correctamente.
"""

import sqlite3
import sys
from pathlib import Path

# Añadir el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def fix_reportes_ia_foreign_key():
    """Corrige la foreign key de reportes_ia para que apunte a respuestas_cuestionario."""
    
    db_path = "ssp.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔄 Iniciando corrección de foreign key en reportes_ia...")
        
        # 1. Verificar la FK actual
        cursor.execute("PRAGMA foreign_key_list(reportes_ia)")
        fks = cursor.fetchall()
        print(f"📋 Foreign keys actuales: {fks}")
        
        # 2. Crear tabla temporal con la estructura correcta
        print("➕ Creando tabla temporal con FK correcta...")
        cursor.execute("""
            CREATE TABLE reportes_ia_new (
                id VARCHAR NOT NULL,
                respuesta_cuestionario_id VARCHAR NOT NULL,
                contenido TEXT NOT NULL,
                version INTEGER NOT NULL,
                es_actual BOOLEAN NOT NULL,
                fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(respuesta_cuestionario_id) REFERENCES respuestas_cuestionario (id) ON DELETE CASCADE
            )
        """)
        
        # 3. Copiar datos existentes
        print("📦 Copiando datos existentes...")
        cursor.execute("""
            INSERT INTO reportes_ia_new 
            (id, respuesta_cuestionario_id, contenido, version, es_actual, fecha_generacion, created_at)
            SELECT 
                id, respuesta_cuestionario_id, contenido, version, es_actual, fecha_generacion, created_at
            FROM reportes_ia
        """)
        
        rows_copied = cursor.rowcount
        print(f"✅ {rows_copied} registros copiados")
        
        # 4. Eliminar tabla antigua
        print("🗑️  Eliminando tabla antigua...")
        cursor.execute("DROP TABLE reportes_ia")
        
        # 5. Renombrar tabla nueva
        print("🔄 Renombrando tabla nueva...")
        cursor.execute("ALTER TABLE reportes_ia_new RENAME TO reportes_ia")
        
        # 6. Recrear índices
        print("📇 Recreando índices...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_reportes_ia_id ON reportes_ia (id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_reportes_ia_respuesta_id ON reportes_ia (respuesta_cuestionario_id)")
        
        # 7. Verificar la nueva FK
        cursor.execute("PRAGMA foreign_key_list(reportes_ia)")
        new_fks = cursor.fetchall()
        print(f"✅ Foreign keys nuevas: {new_fks}")
        
        conn.commit()
        print("\n✅ Corrección completada exitosamente!")
        print("   La tabla reportes_ia ahora apunta correctamente a respuestas_cuestionario")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la corrección: {str(e)}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    fix_reportes_ia_foreign_key()

