#!/usr/bin/env python3
"""
Script para verificar el estado de la base de datos.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.db.database import engine, SessionLocal
from app.models.persona import Persona
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad

def check_tables():
    """Verificar que las tablas existen."""
    print("=== VERIFICANDO TABLAS ===")
    
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            'personas', 'religiones', 'grupos_etnicos', 'discapacidades',
            'programas_educativos', 'grupos', 'atenciones', 'citas',
            'contactos_emergencia', 'cuestionarios', 'cohorte'
        ]
        
        print(f"📊 Tablas encontradas: {len(tables)}")
        
        for table in expected_tables:
            if table in tables:
                print(f"  ✅ {table}")
            else:
                print(f"  ❌ {table} (faltante)")
        
        missing_tables = [t for t in expected_tables if t not in tables]
        if missing_tables:
            print(f"\n⚠️ Tablas faltantes: {missing_tables}")
            return False
        else:
            print("\n✅ Todas las tablas principales están presentes")
            return True
            
    except Exception as e:
        print(f"❌ Error al verificar tablas: {e}")
        return False

def check_admin_user():
    """Verificar que existe el usuario administrador."""
    print("\n=== VERIFICANDO USUARIO ADMIN ===")
    
    db = SessionLocal()
    
    try:
        admin = db.query(Persona).filter(Persona.rol == "admin").first()
        
        if admin:
            print(f"✅ Usuario admin encontrado:")
            print(f"   📧 Email: {admin.correo_institucional}")
            print(f"   👤 ID: {admin.id}")
            print(f"   📅 Creado: {admin.fecha_creacion}")
            print(f"   🔄 Activo: {admin.is_active}")
            return True
        else:
            print("❌ No se encontró usuario administrador")
            return False
            
    except Exception as e:
        print(f"❌ Error al verificar admin: {e}")
        return False
    finally:
        db.close()

def check_catalogos():
    """Verificar el estado de los catálogos."""
    print("\n=== VERIFICANDO CATÁLOGOS ===")
    
    db = SessionLocal()
    
    try:
        # Verificar religiones
        religiones_total = db.query(Religion).count()
        religiones_activas = db.query(Religion).filter(Religion.activo == True).count()
        print(f"📿 Religiones: {religiones_activas}/{religiones_total} activas")
        
        # Verificar grupos étnicos
        grupos_total = db.query(GrupoEtnico).count()
        grupos_activos = db.query(GrupoEtnico).filter(GrupoEtnico.activo == True).count()
        print(f"👥 Grupos étnicos: {grupos_activos}/{grupos_total} activos")
        
        # Verificar discapacidades
        discap_total = db.query(Discapacidad).count()
        discap_activas = db.query(Discapacidad).filter(Discapacidad.activo == True).count()
        print(f"♿ Discapacidades: {discap_activas}/{discap_total} activas")
        
        # Verificar elementos pendientes
        religiones_pendientes = db.query(Religion).filter(Religion.activo == False).count()
        grupos_pendientes = db.query(GrupoEtnico).filter(GrupoEtnico.activo == False).count()
        discap_pendientes = db.query(Discapacidad).filter(Discapacidad.activo == False).count()
        
        total_pendientes = religiones_pendientes + grupos_pendientes + discap_pendientes
        
        if total_pendientes > 0:
            print(f"\n⏳ Elementos pendientes: {total_pendientes}")
            print(f"   - Religiones: {religiones_pendientes}")
            print(f"   - Grupos étnicos: {grupos_pendientes}")
            print(f"   - Discapacidades: {discap_pendientes}")
        else:
            print("\n✅ No hay elementos pendientes")
        
        # Verificar que hay datos básicos
        if religiones_activas > 0 and grupos_activos > 0 and discap_activas > 0:
            print("✅ Todos los catálogos tienen datos activos")
            return True
        else:
            print("❌ Algunos catálogos están vacíos")
            return False
            
    except Exception as e:
        print(f"❌ Error al verificar catálogos: {e}")
        return False
    finally:
        db.close()

def check_personas():
    """Verificar el estado de las personas."""
    print("\n=== VERIFICANDO PERSONAS ===")
    
    db = SessionLocal()
    
    try:
        total_personas = db.query(Persona).count()
        personas_activas = db.query(Persona).filter(Persona.is_active == True).count()
        
        print(f"👤 Total personas: {total_personas}")
        print(f"✅ Personas activas: {personas_activas}")
        
        # Contar por roles
        roles = db.execute(text("""
            SELECT rol, COUNT(*) as count 
            FROM personas 
            GROUP BY rol
        """)).fetchall()
        
        print("📊 Por roles:")
        for rol, count in roles:
            print(f"   - {rol}: {count}")
        
        # Verificar campos de cohorte
        con_cohorte = db.query(Persona).filter(Persona.cohorte_ano.isnot(None)).count()
        print(f"🎓 Con cohorte asignada: {con_cohorte}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al verificar personas: {e}")
        return False
    finally:
        db.close()

def check_database_file():
    """Verificar el archivo de base de datos."""
    print("=== VERIFICANDO ARCHIVO DE BASE DE DATOS ===")
    
    try:
        # Obtener la URL de la base de datos
        db_url = str(engine.url)
        print(f"🗄️ URL de base de datos: {db_url}")
        
        if "sqlite" in db_url:
            # Extraer ruta del archivo SQLite
            db_path = db_url.replace("sqlite:///", "")
            if os.path.exists(db_path):
                file_size = os.path.getsize(db_path)
                print(f"📁 Archivo: {db_path}")
                print(f"📏 Tamaño: {file_size:,} bytes")
                print("✅ Archivo de base de datos existe")
                return True
            else:
                print(f"❌ Archivo de base de datos no encontrado: {db_path}")
                return False
        else:
            print("ℹ️ Base de datos no es SQLite, no se puede verificar archivo")
            return True
            
    except Exception as e:
        print(f"❌ Error al verificar archivo: {e}")
        return False

def main():
    """Función principal."""
    print("=== VERIFICACIÓN DE BASE DE DATOS ===")
    print("Verificando el estado completo de la base de datos...")
    print()
    
    checks = [
        ("Archivo de base de datos", check_database_file),
        ("Tablas", check_tables),
        ("Usuario administrador", check_admin_user),
        ("Catálogos", check_catalogos),
        ("Personas", check_personas),
    ]
    
    results = []
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ Error en verificación '{check_name}': {e}")
            results.append((check_name, False))
    
    print("\n=== RESUMEN DE VERIFICACIÓN ===")
    all_passed = True
    
    for check_name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
        if not result:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 ¡Base de datos en perfecto estado!")
        print("✅ Todos los componentes están funcionando correctamente")
        return 0
    else:
        print("⚠️ Se encontraron problemas en la base de datos")
        print("💡 Considera ejecutar 'python scripts/init_database.py' para reinicializar")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
