#!/usr/bin/env python3
"""
Script para actualizar la tabla cuestionario con los nuevos campos.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.database import SessionLocal, engine

def update_cuestionario_table():
    """Actualizar la tabla cuestionario con los nuevos campos."""
    
    # Lista de columnas a agregar
    columns_to_add = [
        "ALTER TABLE cuestionario ADD COLUMN tipo_cuestionario VARCHAR DEFAULT 'psicopedagogico'",
        "ALTER TABLE cuestionario ADD COLUMN respuestas JSON",
        "ALTER TABLE cuestionario ADD COLUMN reporte_ia TEXT",
        "ALTER TABLE cuestionario ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE cuestionario ADD COLUMN fecha_completado DATETIME",
        "ALTER TABLE cuestionario ADD COLUMN id_persona INTEGER"
    ]
    
    db = SessionLocal()
    
    try:
        # Verificar qué columnas ya existen
        result = db.execute(text("PRAGMA table_info(cuestionario)"))
        existing_columns = [row[1] for row in result.fetchall()]
        print(f"Columnas existentes: {existing_columns}")
        
        # Agregar cada columna si no existe
        for alter_statement in columns_to_add:
            column_name = alter_statement.split("ADD COLUMN ")[1].split(" ")[0]
            
            if column_name not in existing_columns:
                try:
                    print(f"Agregando columna: {column_name}")
                    db.execute(text(alter_statement))
                    db.commit()
                    print(f"✓ Columna {column_name} agregada exitosamente")
                except Exception as e:
                    print(f"✗ Error agregando columna {column_name}: {e}")
                    db.rollback()
            else:
                print(f"- Columna {column_name} ya existe")
        
        # Verificar las columnas finales
        result = db.execute(text("PRAGMA table_info(cuestionario)"))
        final_columns = [row[1] for row in result.fetchall()]
        print(f"\nColumnas finales: {final_columns}")
        
        print("\n✓ Actualización de tabla completada")
        
    except Exception as e:
        print(f"Error general: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_cuestionario_table()
