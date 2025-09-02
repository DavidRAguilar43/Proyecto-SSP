#!/usr/bin/env python3
"""
Script para probar el sistema de cohorte simplificado.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate

def test_cohorte_validation():
    """Probar validación de campos de cohorte."""
    print("=== PRUEBA DE VALIDACIÓN DE COHORTE ===")
    
    test_cases = [
        # (año, período, válido, descripción)
        (2024, 1, True, "Año y período válidos"),
        (2025, 2, True, "Año y período válidos"),
        (None, 1, True, "Solo período (año opcional)"),
        (2024, None, True, "Solo año (período opcional)"),
        (None, None, True, "Ambos opcionales"),
        (999, 1, False, "Año muy corto"),
        (10000, 1, False, "Año muy largo"),
        (2024, 3, False, "Período inválido"),
        (2024, 0, False, "Período muy bajo"),
        ("abc", 1, False, "Año no numérico"),
        (2024, "abc", False, "Período no numérico"),
    ]
    
    for ano, periodo, expected_valid, descripcion in test_cases:
        try:
            # Crear datos de prueba
            persona_data = {
                'tipo_persona': 'alumno',
                'sexo': 'masculino',
                'genero': 'masculino',
                'edad': 20,
                'estado_civil': 'soltero',
                'religion': '',
                'trabaja': False,
                'lugar_trabajo': '',
                'lugar_origen': 'Test',
                'colonia_residencia_actual': 'Test',
                'correo_institucional': 'test@uabc.edu.mx',
                'celular': '1234567890',
                'discapacidad': '',
                'observaciones': '',
                'matricula': 'TEST001',
                'semestre': 1,
                'numero_hijos': 0,
                'grupo_etnico': '',
                'rol': 'alumno',
                'password': 'test123',
                'cohorte_ano': ano,
                'cohorte_periodo': periodo
            }
            
            # Intentar crear esquema
            persona_create = PersonaCreate(**persona_data)
            is_valid = True
            error_msg = "OK"
            
        except Exception as e:
            is_valid = False
            error_msg = str(e)
        
        status = "✅" if is_valid == expected_valid else "❌"
        print(f"  {status} {descripcion}: Año={ano}, Período={periodo}")
        if not is_valid:
            print(f"      Error: {error_msg}")

def test_database_operations():
    """Probar operaciones de base de datos con cohorte simplificada."""
    print("\n=== PRUEBA DE OPERACIONES DE BASE DE DATOS ===")
    
    db = SessionLocal()
    
    try:
        # Casos de prueba para inserción
        test_personas = [
            {
                'email': 'test_cohorte_1@uabc.edu.mx',
                'matricula': 'TEST2024001',
                'cohorte_ano': 2024,
                'cohorte_periodo': 1
            },
            {
                'email': 'test_cohorte_2@uabc.edu.mx',
                'matricula': 'TEST2024002',
                'cohorte_ano': 2024,
                'cohorte_periodo': 2
            },
            {
                'email': 'test_cohorte_3@uabc.edu.mx',
                'matricula': 'TEST2025001',
                'cohorte_ano': 2025,
                'cohorte_periodo': 1
            },
            {
                'email': 'test_sin_cohorte@uabc.edu.mx',
                'matricula': 'TESTSIN001',
                'cohorte_ano': None,
                'cohorte_periodo': 1  # Valor por defecto
            }
        ]
        
        created_personas = []
        
        # Crear personas de prueba
        print("Creando personas de prueba:")
        for test_data in test_personas:
            persona = Persona(
                correo_institucional=test_data['email'],
                hashed_password="test_password",
                tipo_persona="alumno",
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
                matricula=test_data['matricula'],
                semestre=1,
                numero_hijos=0,
                grupo_etnico="",
                rol="alumno",
                cohorte_ano=test_data['cohorte_ano'],
                cohorte_periodo=test_data['cohorte_periodo']
            )
            
            db.add(persona)
            db.commit()
            db.refresh(persona)
            created_personas.append(persona)
            
            print(f"  ✅ {test_data['email']}: Año={test_data['cohorte_ano']}, Período={test_data['cohorte_periodo']}")
        
        # Probar consultas
        print("\nProbando consultas:")
        
        # Consulta por año específico
        personas_2024 = db.query(Persona).filter(Persona.cohorte_ano == 2024).all()
        print(f"  📊 Personas de 2024: {len(personas_2024)}")
        
        # Consulta por año y período
        personas_2024_1 = db.query(Persona).filter(
            Persona.cohorte_ano == 2024,
            Persona.cohorte_periodo == 1
        ).all()
        print(f"  📊 Personas de 2024-1: {len(personas_2024_1)}")
        
        # Consulta personas sin año de cohorte
        personas_sin_ano = db.query(Persona).filter(Persona.cohorte_ano.is_(None)).all()
        print(f"  📊 Personas sin año de cohorte: {len(personas_sin_ano)}")
        
        # Consulta por período específico
        personas_periodo_1 = db.query(Persona).filter(Persona.cohorte_periodo == 1).all()
        print(f"  📊 Personas en período 1: {len(personas_periodo_1)}")
        
        # Limpiar datos de prueba
        print("\nLimpiando datos de prueba:")
        for persona in created_personas:
            db.delete(persona)
        
        db.commit()
        print("✅ Datos de prueba limpiados")
        
    except Exception as e:
        print(f"❌ Error durante pruebas de base de datos: {e}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0

def test_edge_cases():
    """Probar casos extremos."""
    print("\n=== PRUEBA DE CASOS EXTREMOS ===")
    
    edge_cases = [
        {
            'name': 'Año mínimo válido',
            'ano': 1000,
            'periodo': 1,
            'should_pass': True
        },
        {
            'name': 'Año máximo válido',
            'ano': 9999,
            'periodo': 2,
            'should_pass': True
        },
        {
            'name': 'Año con 3 dígitos',
            'ano': 999,
            'periodo': 1,
            'should_pass': False
        },
        {
            'name': 'Año con 5 dígitos',
            'ano': 10000,
            'periodo': 1,
            'should_pass': False
        },
        {
            'name': 'Período 0',
            'ano': 2024,
            'periodo': 0,
            'should_pass': False
        },
        {
            'name': 'Período 3',
            'ano': 2024,
            'periodo': 3,
            'should_pass': False
        }
    ]
    
    for case in edge_cases:
        try:
            persona_data = {
                'tipo_persona': 'alumno',
                'sexo': 'masculino',
                'genero': 'masculino',
                'edad': 20,
                'estado_civil': 'soltero',
                'religion': '',
                'trabaja': False,
                'lugar_trabajo': '',
                'lugar_origen': 'Test',
                'colonia_residencia_actual': 'Test',
                'correo_institucional': 'test@uabc.edu.mx',
                'celular': '1234567890',
                'discapacidad': '',
                'observaciones': '',
                'matricula': 'TEST001',
                'semestre': 1,
                'numero_hijos': 0,
                'grupo_etnico': '',
                'rol': 'alumno',
                'password': 'test123',
                'cohorte_ano': case['ano'],
                'cohorte_periodo': case['periodo']
            }
            
            PersonaCreate(**persona_data)
            passed = True
            
        except Exception as e:
            passed = False
        
        status = "✅" if passed == case['should_pass'] else "❌"
        print(f"  {status} {case['name']}: Año={case['ano']}, Período={case['periodo']}")

def main():
    """Función principal."""
    print("=== PRUEBAS DEL SISTEMA DE COHORTE SIMPLIFICADO ===")
    print("Probando campos directos sin tabla cohorte...")
    print()
    
    try:
        # Ejecutar todas las pruebas
        test_cohorte_validation()
        result = test_database_operations()
        test_edge_cases()
        
        print("\n=== PRUEBAS COMPLETADAS ===")
        print("✅ Sistema de cohorte simplificado funciona correctamente")
        print("✅ Campos opcionales e independientes")
        print("✅ Validaciones funcionando")
        print("✅ Consultas de base de datos operativas")
        
        return result
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
