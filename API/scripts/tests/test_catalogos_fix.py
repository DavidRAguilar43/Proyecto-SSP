#!/usr/bin/env python3
"""
Script para probar si los catálogos funcionan después de los cambios.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Probar imports de modelos."""
    print("=== PROBANDO IMPORTS ===")
    
    try:
        print("Importando modelos de catálogos...")
        from app.models.religion import Religion
        from app.models.grupo_etnico import GrupoEtnico
        from app.models.discapacidad import Discapacidad
        print("✅ Modelos de catálogos importados correctamente")
        
        print("Importando modelo Persona...")
        from app.models.persona import Persona
        print("✅ Modelo Persona importado correctamente")
        
        print("Importando modelo Cohorte...")
        from app.models.cohorte import Cohorte
        print("✅ Modelo Cohorte importado correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en imports: {e}")
        return False

def test_database_connection():
    """Probar conexión a base de datos."""
    print("\n=== PROBANDO CONEXIÓN A BASE DE DATOS ===")
    
    try:
        from app.db.database import SessionLocal
        
        db = SessionLocal()
        print("✅ Conexión a base de datos establecida")
        
        # Probar consulta simple
        from app.models.religion import Religion
        count = db.query(Religion).count()
        print(f"✅ Consulta de religiones exitosa: {count} registros")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en base de datos: {e}")
        return False

def test_catalogos_queries():
    """Probar consultas específicas de catálogos."""
    print("\n=== PROBANDO CONSULTAS DE CATÁLOGOS ===")
    
    try:
        from app.db.database import SessionLocal
        from app.models.religion import Religion
        from app.models.grupo_etnico import GrupoEtnico
        from app.models.discapacidad import Discapacidad
        
        db = SessionLocal()
        
        # Probar consultas que estaban fallando
        print("Probando consulta de religiones activas...")
        religiones = db.query(Religion).filter(Religion.activo == True).all()
        print(f"✅ Religiones activas: {len(religiones)}")
        
        print("Probando consulta de grupos étnicos activos...")
        grupos = db.query(GrupoEtnico).filter(GrupoEtnico.activo == True).all()
        print(f"✅ Grupos étnicos activos: {len(grupos)}")
        
        print("Probando consulta de discapacidades activas...")
        discapacidades = db.query(Discapacidad).filter(Discapacidad.activo == True).all()
        print(f"✅ Discapacidades activas: {len(discapacidades)}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en consultas de catálogos: {e}")
        return False

def test_persona_model():
    """Probar modelo Persona con nuevos campos."""
    print("\n=== PROBANDO MODELO PERSONA ===")
    
    try:
        from app.db.database import SessionLocal
        from app.models.persona import Persona
        
        db = SessionLocal()
        
        # Verificar que los nuevos campos existen
        print("Verificando campos de cohorte en modelo Persona...")
        
        # Intentar crear una consulta que use los nuevos campos
        personas_con_cohorte = db.query(Persona).filter(
            Persona.cohorte_ano.isnot(None)
        ).count()
        print(f"✅ Personas con año de cohorte: {personas_con_cohorte}")
        
        personas_periodo_1 = db.query(Persona).filter(
            Persona.cohorte_periodo == 1
        ).count()
        print(f"✅ Personas en período 1: {personas_periodo_1}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en modelo Persona: {e}")
        return False

def main():
    """Función principal."""
    print("=== PRUEBA DE CORRECCIÓN DE CATÁLOGOS ===")
    print("Verificando que los cambios resolvieron el problema...")
    print()
    
    success = True
    
    # Ejecutar todas las pruebas
    if not test_imports():
        success = False
    
    if not test_database_connection():
        success = False
    
    if not test_catalogos_queries():
        success = False
    
    if not test_persona_model():
        success = False
    
    print("\n=== RESULTADO ===")
    if success:
        print("✅ Todas las pruebas pasaron exitosamente")
        print("✅ Los catálogos deberían funcionar correctamente ahora")
        return 0
    else:
        print("❌ Algunas pruebas fallaron")
        print("❌ Puede que necesites ejecutar la migración de base de datos")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
