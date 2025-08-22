#!/usr/bin/env python3
"""
Script para crear todas las tablas de la base de datos
"""

from app.db.database import engine, Base
from app.models import *  # Importar todos los modelos

def create_all_tables():
    """Crear todas las tablas en la base de datos"""
    print("🚀 Creando todas las tablas...")
    
    try:
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Todas las tablas creadas exitosamente!")
        
        # Mostrar las tablas creadas
        print("\n📋 Tablas creadas:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
            
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        raise

if __name__ == "__main__":
    create_all_tables()
