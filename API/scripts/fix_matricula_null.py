#!/usr/bin/env python3
"""
Script para corregir registros con matricula = NULL.
Asigna matrículas temporales a registros existentes que no tienen matrícula.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.persona import Persona

def fix_null_matriculas(db: Session):
    """Corregir registros con matricula = NULL."""
    print("=== CORRIGIENDO MATRÍCULAS NULL ===")
    
    # Buscar personas con matricula NULL
    personas_sin_matricula = db.query(Persona).filter(Persona.matricula.is_(None)).all()
    
    if not personas_sin_matricula:
        print("✅ No hay registros con matrícula NULL")
        return 0
    
    print(f"Encontrados {len(personas_sin_matricula)} registros con matrícula NULL")
    
    updated_count = 0
    for persona in personas_sin_matricula:
        # Generar matrícula temporal basada en el ID
        temp_matricula = f"TEMP-{persona.id:06d}"
        
        # Verificar que la matrícula temporal no exista
        existing = db.query(Persona).filter(Persona.matricula == temp_matricula).first()
        if existing:
            # Si existe, usar un formato diferente
            temp_matricula = f"TEMP-{persona.id:06d}-{persona.correo_institucional[:5]}"
        
        # Actualizar la matrícula
        persona.matricula = temp_matricula
        updated_count += 1
        
        print(f"  - ID {persona.id}: {persona.correo_institucional} → {temp_matricula}")
    
    # Guardar cambios
    db.commit()
    
    print(f"✅ Se actualizaron {updated_count} registros")
    return updated_count

def main():
    """Función principal."""
    print("=== CORRECCIÓN DE MATRÍCULAS NULL ===")
    print("Este script corrige registros existentes con matrícula NULL")
    print()
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Corregir matrículas NULL
        updated = fix_null_matriculas(db)
        
        if updated > 0:
            print()
            print("=== IMPORTANTE ===")
            print("Se han asignado matrículas temporales a los registros existentes.")
            print("Los usuarios afectados deberán actualizar sus matrículas reales")
            print("a través del sistema de administración.")
            print()
            print("Matrículas temporales tienen el formato: TEMP-XXXXXX")
        
        print()
        print("=== COMPLETADO ===")
        
    except Exception as e:
        print(f"❌ Error durante la corrección: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
