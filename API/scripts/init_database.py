#!/usr/bin/env python3
"""
Script completo para inicializar la base de datos desde cero.
Crea todas las tablas, datos iniciales y usuario administrador.
"""

import sys
import os
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.models.persona import Persona
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad
from app.core.security import get_password_hash

def drop_all_tables():
    """Eliminar todas las tablas existentes."""
    print("=== ELIMINANDO TABLAS EXISTENTES ===")
    try:
        Base.metadata.drop_all(bind=engine)
        print("✅ Todas las tablas eliminadas exitosamente")
        return True
    except Exception as e:
        print(f"⚠️ Error al eliminar tablas (puede ser normal si no existen): {e}")
        return True  # Continuar aunque falle

def create_all_tables():
    """Crear todas las tablas de la base de datos."""
    print("\n=== CREANDO TABLAS ===")
    try:
        # Importar todos los modelos para asegurar que se registren
        from app.models import (
            persona, programa_educativo, grupo, personal, contacto_emergencia,
            atencion, cuestionario, cuestionario_admin, cohorte, cita, religion, grupo_etnico, discapacidad, notificacion
        )
        
        Base.metadata.create_all(bind=engine)
        print("✅ Todas las tablas creadas exitosamente")
        return True
    except OperationalError as e:
        print(f"❌ Error al crear las tablas: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def create_admin_user(db: Session):
    """Crear usuario administrador por defecto."""
    print("\n=== CREANDO USUARIO ADMINISTRADOR ===")
    
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(Persona).filter(
            Persona.correo_institucional == "admin@uabc.edu.mx"
        ).first()
        
        if existing_admin:
            print("ℹ️ Usuario administrador ya existe")
            return True
        
        # Crear usuario admin
        admin_user = Persona(
            sexo="no_decir",
            genero="no_decir",
            edad=30,
            estado_civil="no_decir",
            religion="",
            trabaja=True,
            lugar_trabajo="UABC",
            lugar_origen="Tijuana, BC",
            colonia_residencia_actual="Centro",
            correo_institucional="admin@uabc.edu.mx",
            celular="6641234567",
            discapacidad="",
            observaciones="Usuario administrador del sistema",
            matricula="ADMIN001",
            semestre=None,
            numero_hijos=0,
            grupo_etnico="",
            rol="admin",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            fecha_creacion=datetime.now(timezone.utc),
            cohorte_ano=None,
            cohorte_periodo=1
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuario administrador creado exitosamente")
        print(f"   📧 Email: admin@uabc.edu.mx")
        print(f"   🔑 Password: 12345678")
        print(f"   👤 ID: {admin_user.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear usuario administrador: {e}")
        db.rollback()
        return False

def seed_catalogos(db: Session):
    """Poblar catálogos con datos iniciales."""
    print("\n=== POBLANDO CATÁLOGOS ===")
    
    try:
        # Religiones iniciales
        religiones_iniciales = [
            {"titulo": "Católica", "activo": True},
            {"titulo": "Protestante", "activo": True},
            {"titulo": "Judía", "activo": True},
            {"titulo": "Musulmana", "activo": True},
            {"titulo": "Budista", "activo": True},
            {"titulo": "Hinduista", "activo": True},
            {"titulo": "Otra", "activo": True},
            {"titulo": "Ninguna", "activo": True},
        ]
        
        print("Creando religiones...")
        for religion_data in religiones_iniciales:
            existing = db.query(Religion).filter(Religion.titulo == religion_data["titulo"]).first()
            if not existing:
                religion = Religion(**religion_data)
                db.add(religion)
        
        # Grupos étnicos iniciales
        grupos_etnicos_iniciales = [
            {"titulo": "Mestizo", "activo": True},
            {"titulo": "Indígena", "activo": True},
            {"titulo": "Afrodescendiente", "activo": True},
            {"titulo": "Asiático", "activo": True},
            {"titulo": "Europeo", "activo": True},
            {"titulo": "Otro", "activo": True},
            {"titulo": "Prefiero no decir", "activo": True},
        ]
        
        print("Creando grupos étnicos...")
        for grupo_data in grupos_etnicos_iniciales:
            existing = db.query(GrupoEtnico).filter(GrupoEtnico.titulo == grupo_data["titulo"]).first()
            if not existing:
                grupo = GrupoEtnico(**grupo_data)
                db.add(grupo)
        
        # Discapacidades iniciales
        discapacidades_iniciales = [
            {"titulo": "Ninguna", "activo": True},
            {"titulo": "Visual", "activo": True},
            {"titulo": "Auditiva", "activo": True},
            {"titulo": "Motriz", "activo": True},
            {"titulo": "Intelectual", "activo": True},
            {"titulo": "Psicosocial", "activo": True},
            {"titulo": "Múltiple", "activo": True},
            {"titulo": "Otra", "activo": True},
        ]
        
        print("Creando discapacidades...")
        for discapacidad_data in discapacidades_iniciales:
            existing = db.query(Discapacidad).filter(Discapacidad.titulo == discapacidad_data["titulo"]).first()
            if not existing:
                discapacidad = Discapacidad(**discapacidad_data)
                db.add(discapacidad)
        
        db.commit()
        print("✅ Catálogos poblados exitosamente")
        
        # Mostrar estadísticas
        religiones_count = db.query(Religion).count()
        grupos_count = db.query(GrupoEtnico).count()
        discapacidades_count = db.query(Discapacidad).count()
        
        print(f"   📊 Religiones: {religiones_count}")
        print(f"   📊 Grupos étnicos: {grupos_count}")
        print(f"   📊 Discapacidades: {discapacidades_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al poblar catálogos: {e}")
        db.rollback()
        return False

def verify_database(db: Session):
    """Verificar que la base de datos se inicializó correctamente."""
    print("\n=== VERIFICANDO BASE DE DATOS ===")
    
    try:
        # Verificar usuario admin
        admin = db.query(Persona).filter(Persona.rol == "admin").first()
        if admin:
            print(f"✅ Usuario admin encontrado: {admin.correo_institucional}")
        else:
            print("❌ Usuario admin no encontrado")
            return False
        
        # Verificar catálogos
        religiones = db.query(Religion).filter(Religion.activo == True).count()
        grupos = db.query(GrupoEtnico).filter(GrupoEtnico.activo == True).count()
        discapacidades = db.query(Discapacidad).filter(Discapacidad.activo == True).count()
        
        print(f"✅ Catálogos activos:")
        print(f"   - Religiones: {religiones}")
        print(f"   - Grupos étnicos: {grupos}")
        print(f"   - Discapacidades: {discapacidades}")
        
        if religiones > 0 and grupos > 0 and discapacidades > 0:
            return True
        else:
            print("❌ Algunos catálogos están vacíos")
            return False
            
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

def main():
    """Función principal."""
    print("=== INICIALIZACIÓN COMPLETA DE BASE DE DATOS ===")
    print("Este script eliminará y recreará toda la base de datos.")
    print("ADVERTENCIA: Se perderán todos los datos existentes.")
    print()
    
    # Confirmar acción
    confirm = input("¿Estás seguro de que quieres continuar? (sí/no): ").lower().strip()
    if confirm not in ['sí', 'si', 'yes', 'y', 's']:
        print("❌ Operación cancelada por el usuario")
        return 1
    
    print("\n🚀 Iniciando proceso de inicialización...")
    
    # Paso 1: Eliminar tablas existentes
    if not drop_all_tables():
        print("❌ Error al eliminar tablas. Abortando.")
        return 1
    
    # Paso 2: Crear todas las tablas
    if not create_all_tables():
        print("❌ Error al crear tablas. Abortando.")
        return 1
    
    # Paso 3: Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Paso 4: Crear usuario administrador
        if not create_admin_user(db):
            print("❌ Error al crear usuario administrador. Abortando.")
            return 1
        
        # Paso 5: Poblar catálogos
        if not seed_catalogos(db):
            print("❌ Error al poblar catálogos. Abortando.")
            return 1
        
        # Paso 6: Verificar inicialización
        if not verify_database(db):
            print("❌ Error en verificación. La base de datos puede no estar completa.")
            return 1
        
    finally:
        db.close()
    
    print("\n=== INICIALIZACIÓN COMPLETADA EXITOSAMENTE ===")
    print("✅ Base de datos creada y configurada correctamente")
    print()
    print("📋 Información de acceso:")
    print("   👤 Usuario: admin@uabc.edu.mx")
    print("   🔑 Contraseña: 12345678")
    print("   🎯 Rol: admin")
    print()
    print("🚀 Próximos pasos:")
    print("   1. Inicia el servidor: uvicorn app.main:app --reload")
    print("   2. Accede a: http://localhost:8000/docs")
    print("   3. Usa las credenciales de admin para autenticarte")
    print()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
