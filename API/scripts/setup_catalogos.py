#!/usr/bin/env python3
"""
Script para configurar los catálogos: crear tablas y poblar con datos iniciales.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import OperationalError
from app.db.database import engine, Base
from seed_catalogos import main as seed_main

def create_tables():
    """Crear las tablas de la base de datos."""
    print("=== CREANDO TABLAS ===")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
        return True
    except OperationalError as e:
        print(f"❌ Error al crear las tablas: {e}")
        print("Asegúrate de que la base de datos esté disponible y configurada correctamente.")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    """Función principal."""
    print("=== CONFIGURACIÓN DE CATÁLOGOS ===")
    print("Este script creará las tablas necesarias y poblará los catálogos con datos iniciales.")
    print()
    
    # Paso 1: Crear tablas
    if not create_tables():
        print("❌ No se pudieron crear las tablas. Abortando.")
        return 1
    
    print()
    
    # Paso 2: Poblar catálogos
    print("=== POBLANDO CATÁLOGOS ===")
    try:
        result = seed_main()
        if result == 0:
            print("✅ Catálogos poblados exitosamente")
        else:
            print("❌ Error al poblar catálogos")
            return 1
    except Exception as e:
        print(f"❌ Error al poblar catálogos: {e}")
        return 1
    
    print()
    print("=== CONFIGURACIÓN COMPLETADA ===")
    print("Los catálogos han sido configurados exitosamente.")
    print()
    print("Próximos pasos:")
    print("1. Inicia el servidor de la API: uvicorn app.main:app --reload")
    print("2. Accede a la documentación en: http://localhost:8000/docs")
    print("3. Usa los endpoints de catálogos para gestionar los elementos")
    print()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
