"""
Script para corregir la FK de snapshot_id en respuestas_cuestionario.

PROBLEMA CRÍTICO:
- La FK snapshot_id tiene ON DELETE CASCADE
- Esto significa que si se elimina un snapshot, se eliminan todas las respuestas
- Esto es INCORRECTO porque los snapshots NO deben eliminarse nunca

SOLUCIÓN:
- Cambiar ON DELETE CASCADE a ON DELETE RESTRICT
- Esto impedirá eliminar snapshots que tengan respuestas asociadas
"""

import sqlite3
import sys
from pathlib import Path

# Añadir el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def fix_snapshot_fk():
    """Corrige la FK de snapshot_id para usar RESTRICT en lugar de CASCADE."""
    
    db_path = "ssp.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("=" * 80)
        print("CORRECCIÓN DE FK: snapshot_id en respuestas_cuestionario")
        print("=" * 80)
        
        # 1. Verificar FK actual
        print("\n1. Verificando FK actual...")
        cursor.execute("PRAGMA foreign_key_list(respuestas_cuestionario);")
        fks = cursor.fetchall()
        print(f"   FKs encontradas: {len(fks)}")
        for fk in fks:
            print(f"   - {fk}")
        
        # 2. Obtener estructura actual
        print("\n2. Obteniendo estructura actual...")
        cursor.execute("SELECT sql FROM sqlite_master WHERE name='respuestas_cuestionario';")
        create_sql = cursor.fetchone()[0]
        print(f"   CREATE TABLE actual:")
        print(f"   {create_sql[:200]}...")
        
        # 3. Contar registros
        print("\n3. Contando registros...")
        cursor.execute("SELECT COUNT(*) FROM respuestas_cuestionario;")
        count = cursor.fetchone()[0]
        print(f"   Total de respuestas: {count}")
        
        # 4. Crear tabla temporal con FK corregida
        print("\n4. Creando tabla temporal con FK corregida...")
        cursor.execute("""
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
                FOREIGN KEY(usuario_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY(snapshot_id) REFERENCES cuestionarios_snapshot (id) ON DELETE RESTRICT,
                FOREIGN KEY(cuestionario_id) REFERENCES cuestionarios_admin (id) ON DELETE SET NULL
            )
        """)
        print("   ✓ Tabla temporal creada")
        
        # 5. Copiar datos
        print("\n5. Copiando datos...")
        cursor.execute("""
            INSERT INTO respuestas_cuestionario_new
            SELECT * FROM respuestas_cuestionario
        """)
        copied = cursor.rowcount
        print(f"   ✓ {copied} registros copiados")
        
        # 6. Eliminar tabla antigua
        print("\n6. Eliminando tabla antigua...")
        cursor.execute("DROP TABLE respuestas_cuestionario")
        print("   ✓ Tabla antigua eliminada")
        
        # 7. Renombrar tabla nueva
        print("\n7. Renombrando tabla nueva...")
        cursor.execute("ALTER TABLE respuestas_cuestionario_new RENAME TO respuestas_cuestionario")
        print("   ✓ Tabla renombrada")
        
        # 8. Recrear índices
        print("\n8. Recreando índices...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_respuestas_cuestionario_id ON respuestas_cuestionario (id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_respuestas_cuestionario_usuario_id ON respuestas_cuestionario (usuario_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_respuestas_cuestionario_cuestionario_id ON respuestas_cuestionario (cuestionario_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_respuestas_cuestionario_snapshot_id ON respuestas_cuestionario (snapshot_id)")
        print("   ✓ Índices recreados")
        
        # 9. Verificar FK nueva
        print("\n9. Verificando FK nueva...")
        cursor.execute("PRAGMA foreign_key_list(respuestas_cuestionario);")
        fks_new = cursor.fetchall()
        print(f"   FKs nuevas: {len(fks_new)}")
        for fk in fks_new:
            print(f"   - {fk}")
        
        # 10. Verificar datos
        print("\n10. Verificando datos...")
        cursor.execute("SELECT COUNT(*) FROM respuestas_cuestionario;")
        count_new = cursor.fetchone()[0]
        print(f"   Total de respuestas después: {count_new}")
        
        if count == count_new:
            print("   ✓ Todos los datos preservados")
        else:
            print(f"   ⚠️ ADVERTENCIA: Se perdieron {count - count_new} registros")
        
        # Commit
        conn.commit()
        
        print("\n" + "=" * 80)
        print("✅ FK CORREGIDA EXITOSAMENTE")
        print("=" * 80)
        print("\nAhora:")
        print("- snapshot_id usa ON DELETE RESTRICT")
        print("- NO se pueden eliminar snapshots que tengan respuestas")
        print("- Las respuestas están protegidas")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    fix_snapshot_fk()

