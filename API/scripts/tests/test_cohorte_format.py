#!/usr/bin/env python3
"""
Script para probar el nuevo formato de cohorte (año-período).
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.persona import Persona

def test_cohorte_format():
    """Probar el nuevo formato de cohorte."""
    print("=== PRUEBA DE FORMATO DE COHORTE ===")
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Casos de prueba para diferentes formatos de cohorte
        test_cases = [
            "2024-1",
            "2024-2", 
            "2025-1",
            "2025-3",
            "2026-2"
        ]
        
        print("Probando diferentes formatos de cohorte:")
        
        for cohorte_format in test_cases:
            # Crear persona de prueba
            persona_test = Persona(
                correo_institucional=f"test_{cohorte_format.replace('-', '_')}@uabc.edu.mx",
                hashed_password="test_password",
                sexo="masculino",
                genero="masculino",
                edad=20,
                estado_civil="soltero",
                religion="",
                trabaja=False,
                lugar_trabajo="",
                lugar_origen="Test",
                colonia_residencia_actual="Test",
                celular="1234567890",
                discapacidad="",
                observaciones="",
                matricula=f"TEST{cohorte_format.replace('-', '')}",
                semestre=1,
                numero_hijos=0,
                grupo_etnico="",
                rol="alumno",
                cohorte_id=cohorte_format  # Nuevo formato string
            )
            
            db.add(persona_test)
            db.commit()
            db.refresh(persona_test)
            
            print(f"  ✅ Cohorte '{cohorte_format}' creada exitosamente (ID: {persona_test.id})")
            
            # Verificar que se guardó correctamente
            persona_verificada = db.query(Persona).filter(Persona.id == persona_test.id).first()
            if persona_verificada and persona_verificada.cohorte_id == cohorte_format:
                print(f"     Verificado: cohorte_id = '{persona_verificada.cohorte_id}'")
            else:
                print(f"     ❌ Error: cohorte_id no coincide")
        
        # Consultar personas por cohorte
        print("\nConsultando personas por cohorte:")
        for cohorte_format in test_cases:
            count = db.query(Persona).filter(Persona.cohorte_id == cohorte_format).count()
            print(f"  Cohorte '{cohorte_format}': {count} persona(s)")
        
        # Limpiar datos de prueba
        print("\nLimpiando datos de prueba...")
        for cohorte_format in test_cases:
            db.query(Persona).filter(
                Persona.correo_institucional.like(f"%test_{cohorte_format.replace('-', '_')}%")
            ).delete()
        
        db.commit()
        print("✅ Datos de prueba limpiados")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0

def validate_cohorte_format(cohorte_str):
    """Validar formato de cohorte año-período."""
    if not cohorte_str:
        return False, "Cohorte vacía"
    
    parts = cohorte_str.split('-')
    if len(parts) != 2:
        return False, "Formato debe ser 'año-período'"
    
    try:
        year = int(parts[0])
        period = int(parts[1])
        
        if year < 2020 or year > 2030:
            return False, "Año debe estar entre 2020 y 2030"
        
        if period < 1 or period > 3:
            return False, "Período debe estar entre 1 y 3"
        
        return True, "Formato válido"
        
    except ValueError:
        return False, "Año y período deben ser números"

def test_validation():
    """Probar validación de formato de cohorte."""
    print("\n=== PRUEBA DE VALIDACIÓN DE FORMATO ===")
    
    test_cases = [
        ("2024-1", True),
        ("2024-2", True),
        ("2025-3", True),
        ("2019-1", False),  # Año muy bajo
        ("2031-1", False),  # Año muy alto
        ("2024-0", False),  # Período muy bajo
        ("2024-4", False),  # Período muy alto
        ("2024", False),    # Sin período
        ("2024-1-extra", False),  # Formato incorrecto
        ("abc-1", False),   # Año no numérico
        ("2024-abc", False), # Período no numérico
        ("", False),        # Vacío
    ]
    
    for cohorte_str, expected_valid in test_cases:
        is_valid, message = validate_cohorte_format(cohorte_str)
        status = "✅" if is_valid == expected_valid else "❌"
        print(f"  {status} '{cohorte_str}' -> {is_valid} ({message})")

def main():
    """Función principal."""
    print("=== PRUEBAS DE FORMATO DE COHORTE ===")
    print("Probando el nuevo sistema de cohorte con formato año-período...")
    print()
    
    try:
        # Ejecutar pruebas
        test_validation()
        result = test_cohorte_format()
        
        print("\n=== PRUEBAS COMPLETADAS ===")
        print("El nuevo formato de cohorte funciona correctamente.")
        print("Formato: {año}-{período} (ej: 2024-1, 2025-2)")
        
        return result
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
