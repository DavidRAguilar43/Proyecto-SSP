#!/usr/bin/env python3
"""
Script para probar la validación de elementos personalizados en catálogos.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad

def test_case_insensitive_validation(db: Session):
    """Probar validación case-insensitive."""
    print("=== PRUEBA DE VALIDACIÓN CASE-INSENSITIVE ===")
    
    # Casos de prueba para religiones
    test_cases = [
        ("Católica", "católica", True),  # Debe detectar duplicado
        ("Católica", "CATÓLICA", True),  # Debe detectar duplicado
        ("Católica", "  católica  ", True),  # Debe detectar duplicado (con espacios)
        ("Católica", "Nueva Religión", False),  # No debe detectar duplicado
    ]
    
    print("\nProbando validación de religiones:")
    for existing_title, test_title, should_exist in test_cases:
        # Limpiar y crear elemento de prueba
        db.query(Religion).filter(Religion.titulo.ilike(f"%{existing_title}%")).delete()
        db.commit()
        
        # Crear elemento existente
        religion_existente = Religion(titulo=existing_title, activo=True)
        db.add(religion_existente)
        db.commit()
        
        # Probar validación
        titulo_normalizado = test_title.strip().lower()
        existing = db.query(Religion).filter(
            Religion.titulo.ilike(f"%{titulo_normalizado}%")
        ).first()
        
        # Verificación más estricta
        exists = existing and existing.titulo.strip().lower() == titulo_normalizado
        
        status = "✅" if exists == should_exist else "❌"
        print(f"  {status} '{existing_title}' vs '{test_title}' -> Existe: {exists} (Esperado: {should_exist})")
        
        # Limpiar
        db.query(Religion).filter(Religion.titulo.ilike(f"%{existing_title}%")).delete()
        db.commit()

def test_unique_creation(db: Session):
    """Probar creación de elementos únicos."""
    print("\n=== PRUEBA DE CREACIÓN DE ELEMENTOS ÚNICOS ===")
    
    # Limpiar datos de prueba
    db.query(Religion).filter(Religion.titulo.ilike("%test%")).delete()
    db.commit()
    
    # Crear elemento inicial
    religion1 = Religion(titulo="Test Religion", activo=True)
    db.add(religion1)
    db.commit()
    
    print(f"Creado: '{religion1.titulo}' (ID: {religion1.id})")
    
    # Intentar crear duplicados con diferentes casos
    test_duplicates = ["test religion", "TEST RELIGION", "  Test Religion  "]
    
    for test_title in test_duplicates:
        titulo_normalizado = test_title.strip().lower()
        existing = db.query(Religion).filter(
            Religion.titulo.ilike(f"%{titulo_normalizado}%")
        ).first()
        
        exists = existing and existing.titulo.strip().lower() == titulo_normalizado
        
        if exists:
            print(f"  ✅ Duplicado detectado correctamente: '{test_title}' -> '{existing.titulo}'")
        else:
            print(f"  ❌ Duplicado NO detectado: '{test_title}'")
    
    # Crear elemento realmente único
    unique_title = "Religión Completamente Nueva"
    titulo_normalizado = unique_title.strip().lower()
    existing = db.query(Religion).filter(
        Religion.titulo.ilike(f"%{titulo_normalizado}%")
    ).first()
    
    exists = existing and existing.titulo.strip().lower() == titulo_normalizado
    
    if not exists:
        religion_nueva = Religion(titulo=unique_title, activo=False)
        db.add(religion_nueva)
        db.commit()
        print(f"  ✅ Elemento único creado: '{religion_nueva.titulo}' (ID: {religion_nueva.id})")
    else:
        print(f"  ❌ Error: elemento único no se pudo crear")
    
    # Limpiar
    db.query(Religion).filter(Religion.titulo.ilike("%test%")).delete()
    db.query(Religion).filter(Religion.titulo.ilike("%religión%")).delete()
    db.commit()

def test_pending_elements(db: Session):
    """Probar elementos pendientes."""
    print("\n=== PRUEBA DE ELEMENTOS PENDIENTES ===")
    
    # Crear algunos elementos pendientes de prueba
    elementos_pendientes = [
        Religion(titulo="Religión Pendiente 1", activo=False),
        Religion(titulo="Religión Pendiente 2", activo=False),
        GrupoEtnico(titulo="Grupo Étnico Pendiente", activo=False),
        Discapacidad(titulo="Discapacidad Pendiente", activo=False),
    ]
    
    for elemento in elementos_pendientes:
        db.add(elemento)
    
    db.commit()
    
    # Contar elementos pendientes
    religiones_pendientes = db.query(Religion).filter(Religion.activo == False).count()
    grupos_pendientes = db.query(GrupoEtnico).filter(GrupoEtnico.activo == False).count()
    discapacidades_pendientes = db.query(Discapacidad).filter(Discapacidad.activo == False).count()
    
    total_pendientes = religiones_pendientes + grupos_pendientes + discapacidades_pendientes
    
    print(f"  Religiones pendientes: {religiones_pendientes}")
    print(f"  Grupos étnicos pendientes: {grupos_pendientes}")
    print(f"  Discapacidades pendientes: {discapacidades_pendientes}")
    print(f"  Total pendientes: {total_pendientes}")
    
    # Limpiar elementos de prueba
    for elemento in elementos_pendientes:
        db.delete(elemento)
    db.commit()
    
    print("  ✅ Elementos de prueba limpiados")

def main():
    """Función principal."""
    print("=== PRUEBAS DE VALIDACIÓN DE CATÁLOGOS ===")
    print("Ejecutando pruebas de validación para elementos personalizados...")
    print()
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Ejecutar pruebas
        test_case_insensitive_validation(db)
        test_unique_creation(db)
        test_pending_elements(db)
        
        print("\n=== PRUEBAS COMPLETADAS ===")
        print("Todas las pruebas de validación han sido ejecutadas.")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
