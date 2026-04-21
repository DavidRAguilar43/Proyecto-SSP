"""
Script de migración para añadir columnas de snapshot a respuestas.

Este script añade las columnas necesarias para el sistema de snapshots:
- snapshot_id en respuestas_cuestionario
- pregunta_snapshot_id en respuestas_pregunta

Reason: Las tablas de snapshot ya existen pero faltan las columnas de relación.
"""

import sqlite3
import sys
from pathlib import Path

# Añadir el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.config import settings


def add_snapshot_columns():
    """Añade las columnas de snapshot a las tablas de respuestas."""
    
    db_path = "ssp.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔄 Iniciando migración de columnas de snapshot...")
        
        # 1. Verificar si la columna snapshot_id ya existe en respuestas_cuestionario
        cursor.execute("PRAGMA table_info(respuestas_cuestionario)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'snapshot_id' not in columns:
            print("➕ Añadiendo columna snapshot_id a respuestas_cuestionario...")
            
            # Añadir columna snapshot_id (nullable por ahora)
            cursor.execute("""
                ALTER TABLE respuestas_cuestionario 
                ADD COLUMN snapshot_id VARCHAR
            """)
            
            # Añadir índice
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_respuestas_cuestionario_snapshot_id 
                ON respuestas_cuestionario(snapshot_id)
            """)
            
            print("✅ Columna snapshot_id añadida exitosamente")
        else:
            print("ℹ️  Columna snapshot_id ya existe en respuestas_cuestionario")
        
        # 2. Verificar si la columna pregunta_snapshot_id ya existe en respuestas_pregunta
        cursor.execute("PRAGMA table_info(respuestas_pregunta)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'pregunta_snapshot_id' not in columns:
            print("➕ Añadiendo columna pregunta_snapshot_id a respuestas_pregunta...")
            
            # Añadir columna pregunta_snapshot_id (nullable por ahora)
            cursor.execute("""
                ALTER TABLE respuestas_pregunta 
                ADD COLUMN pregunta_snapshot_id VARCHAR
            """)
            
            # Añadir índice
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_respuestas_pregunta_snapshot_id 
                ON respuestas_pregunta(pregunta_snapshot_id)
            """)
            
            print("✅ Columna pregunta_snapshot_id añadida exitosamente")
        else:
            print("ℹ️  Columna pregunta_snapshot_id ya existe en respuestas_pregunta")
        
        # 3. Modificar cuestionario_id para que sea nullable
        print("🔄 Verificando si cuestionario_id es nullable...")
        cursor.execute("PRAGMA table_info(respuestas_cuestionario)")
        for col in cursor.fetchall():
            if col[1] == 'cuestionario_id':
                if col[3] == 1:  # NOT NULL
                    print("⚠️  ADVERTENCIA: cuestionario_id es NOT NULL")
                    print("   SQLite no permite modificar columnas directamente.")
                    print("   Se recomienda hacer esto en una migración de Alembic.")
                else:
                    print("✅ cuestionario_id ya es nullable")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        print("\n📝 NOTA IMPORTANTE:")
        print("   - Las columnas snapshot_id y pregunta_snapshot_id son nullable por ahora")
        print("   - Las respuestas existentes NO tienen snapshots")
        print("   - Las nuevas respuestas DEBEN tener snapshots")
        print("   - Considera ejecutar un script para crear snapshots de respuestas existentes")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la migración: {str(e)}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    add_snapshot_columns()

