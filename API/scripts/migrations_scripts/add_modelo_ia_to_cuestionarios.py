"""
Script de migración para agregar el campo modelo_ia a la tabla cuestionarios_admin.

Fecha: 2025-11-05
Descripción: Agrega el campo modelo_ia para permitir seleccionar el modelo de IA
             a utilizar para generar reportes en cada cuestionario.
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def run_migration():
    """Ejecutar la migración para agregar el campo modelo_ia."""
    
    print("=" * 60)
    print("MIGRACIÓN: Agregar campo modelo_ia a cuestionarios_admin")
    print("=" * 60)
    
    # Crear conexión a la base de datos
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar si la columna ya existe
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('cuestionarios_admin')]
        
        if 'modelo_ia' in columns:
            print("✓ La columna 'modelo_ia' ya existe en la tabla cuestionarios_admin")
            print("  No se requiere migración.")
            return
        
        print("\n1. Agregando columna 'modelo_ia' a la tabla cuestionarios_admin...")
        
        try:
            # Agregar la columna modelo_ia
            conn.execute(text("""
                ALTER TABLE cuestionarios_admin 
                ADD COLUMN modelo_ia VARCHAR(100) DEFAULT 'openai/gpt-3.5-turbo'
            """))
            conn.commit()
            print("   ✓ Columna 'modelo_ia' agregada exitosamente")
            
            # Actualizar registros existentes que tengan NULL
            print("\n2. Actualizando registros existentes...")
            result = conn.execute(text("""
                UPDATE cuestionarios_admin 
                SET modelo_ia = 'openai/gpt-3.5-turbo' 
                WHERE modelo_ia IS NULL
            """))
            conn.commit()
            print(f"   ✓ {result.rowcount} registros actualizados")
            
            print("\n" + "=" * 60)
            print("MIGRACIÓN COMPLETADA EXITOSAMENTE")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n✗ Error durante la migración: {e}")
            conn.rollback()
            raise

def rollback_migration():
    """Revertir la migración (eliminar el campo modelo_ia)."""
    
    print("=" * 60)
    print("ROLLBACK: Eliminar campo modelo_ia de cuestionarios_admin")
    print("=" * 60)
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar si la columna existe
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('cuestionarios_admin')]
        
        if 'modelo_ia' not in columns:
            print("✓ La columna 'modelo_ia' no existe en la tabla cuestionarios_admin")
            print("  No se requiere rollback.")
            return
        
        print("\nEliminando columna 'modelo_ia' de la tabla cuestionarios_admin...")
        
        try:
            conn.execute(text("""
                ALTER TABLE cuestionarios_admin 
                DROP COLUMN modelo_ia
            """))
            conn.commit()
            print("✓ Columna 'modelo_ia' eliminada exitosamente")
            
            print("\n" + "=" * 60)
            print("ROLLBACK COMPLETADO EXITOSAMENTE")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n✗ Error durante el rollback: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migración: Agregar campo modelo_ia')
    parser.add_argument(
        '--rollback', 
        action='store_true', 
        help='Revertir la migración'
    )
    
    args = parser.parse_args()
    
    try:
        if args.rollback:
            rollback_migration()
        else:
            run_migration()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

