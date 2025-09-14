#!/usr/bin/env python3
"""
Script para resetear la base de datos sin confirmación interactiva.
Útil para desarrollo y testing automatizado.
"""

import sys
import os
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.models.persona import Persona
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad
from app.core.security import get_password_hash

def reset_database():
    """Resetear completamente la base de datos."""
    print("=== RESETEANDO BASE DE DATOS ===")
    
    try:
        # Eliminar todas las tablas
        print("🗑️ Eliminando tablas existentes...")
        Base.metadata.drop_all(bind=engine)
        
        # Importar todos los modelos
        from app.models import (
            persona, programa_educativo, grupo, personal, contacto_emergencia,
            atencion, cuestionario, cohorte, cita, religion, grupo_etnico, discapacidad
        )
        
        # Crear todas las tablas
        print("🏗️ Creando tablas...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Base de datos reseteada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al resetear base de datos: {e}")
        return False

def create_initial_data():
    """Crear datos iniciales mínimos."""
    print("\n=== CREANDO DATOS INICIALES ===")
    
    db = SessionLocal()
    
    try:
        # Usuario admin
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
        
        # Catálogos básicos
        catalogos_data = {
            Religion: [
                {"titulo": "Católica", "activo": True},
                {"titulo": "Ninguna", "activo": True},
                {"titulo": "Otra", "activo": True},
            ],
            GrupoEtnico: [
                {"titulo": "Mestizo", "activo": True},
                {"titulo": "Indígena", "activo": True},
                {"titulo": "Otro", "activo": True},
            ],
            Discapacidad: [
                {"titulo": "Ninguna", "activo": True},
                {"titulo": "Visual", "activo": True},
                {"titulo": "Otra", "activo": True},
            ]
        }
        
        for model_class, items in catalogos_data.items():
            for item_data in items:
                item = model_class(**item_data)
                db.add(item)
        
        db.commit()
        print("✅ Datos iniciales creados")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear datos iniciales: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Función principal."""
    print("=== RESET AUTOMÁTICO DE BASE DE DATOS ===")
    print("Reseteando base de datos sin confirmación...")
    print()
    
    # Resetear base de datos
    if not reset_database():
        print("❌ Error al resetear base de datos")
        return 1
    
    # Crear datos iniciales
    if not create_initial_data():
        print("❌ Error al crear datos iniciales")
        return 1
    
    print("\n=== RESET COMPLETADO ===")
    print("✅ Base de datos reseteada exitosamente")
    print("👤 Admin: admin@uabc.edu.mx / 12345678")
    print()
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
