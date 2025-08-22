#!/usr/bin/env python3
"""
Script para crear datos de prueba en el sistema SSP
"""

import asyncio
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.persona import Persona
from app.models.cohorte import Cohorte
from app.models.programa_educativo import ProgramaEducativo
from app.models.grupo import Grupo
from app.core.security import get_password_hash
from datetime import datetime, timezone

def create_test_data():
    """Crear datos de prueba para el sistema"""
    db = SessionLocal()
    
    try:
        print("🚀 Creando datos de prueba...")
        
        # 1. Crear cohortes de prueba
        print("📚 Creando cohortes...")
        cohortes_data = [
            {"nombre": "2024-1", "descripcion": "Primer semestre 2024", "activo": True},
            {"nombre": "2024-2", "descripcion": "Segundo semestre 2024", "activo": True},
            {"nombre": "2025-1", "descripcion": "Primer semestre 2025", "activo": True},
        ]
        
        cohortes_created = []
        for cohorte_data in cohortes_data:
            existing = db.query(Cohorte).filter(Cohorte.nombre == cohorte_data["nombre"]).first()
            if not existing:
                cohorte = Cohorte(**cohorte_data)
                db.add(cohorte)
                cohortes_created.append(cohorte)
        
        db.commit()
        for cohorte in cohortes_created:
            db.refresh(cohorte)
        print(f"✅ Creadas {len(cohortes_created)} cohortes")
        
        # 2. Crear programas educativos de prueba
        print("🎓 Creando programas educativos...")
        programas_data = [
            {"clave_programa": "ING-SIS", "nombre_programa": "Ingeniería en Sistemas"},
            {"clave_programa": "LIC-PSI", "nombre_programa": "Licenciatura en Psicología"},
            {"clave_programa": "ING-IND", "nombre_programa": "Ingeniería Industrial"},
        ]
        
        programas_created = []
        for programa_data in programas_data:
            existing = db.query(ProgramaEducativo).filter(
                ProgramaEducativo.clave_programa == programa_data["clave_programa"]
            ).first()
            if not existing:
                programa = ProgramaEducativo(**programa_data)
                db.add(programa)
                programas_created.append(programa)
        
        db.commit()
        for programa in programas_created:
            db.refresh(programa)
        print(f"✅ Creados {len(programas_created)} programas educativos")
        
        # 3. Crear grupos de prueba
        print("👥 Creando grupos...")
        grupos_data = [
            {"nombre_grupo": "SIS-A", "tipo_grupo": "Matutino", "observaciones_grupo": "Grupo de sistemas matutino"},
            {"nombre_grupo": "PSI-B", "tipo_grupo": "Vespertino", "observaciones_grupo": "Grupo de psicología vespertino"},
            {"nombre_grupo": "IND-C", "tipo_grupo": "Matutino", "observaciones_grupo": "Grupo de industrial matutino"},
        ]
        
        grupos_created = []
        for grupo_data in grupos_data:
            existing = db.query(Grupo).filter(Grupo.nombre_grupo == grupo_data["nombre_grupo"]).first()
            if not existing:
                grupo = Grupo(**grupo_data)
                db.add(grupo)
                grupos_created.append(grupo)
        
        db.commit()
        for grupo in grupos_created:
            db.refresh(grupo)
        print(f"✅ Creados {len(grupos_created)} grupos")
        
        # 4. Crear usuarios de prueba
        print("👤 Creando usuarios de prueba...")
        
        # Usuario administrador
        admin_email = "admin@sistema.edu"
        existing_admin = db.query(Persona).filter(Persona.correo_institucional == admin_email).first()
        if not existing_admin:
            admin = Persona(
                tipo_persona="administrativo",
                sexo="masculino",
                genero="masculino",
                edad=35,
                estado_civil="casado",
                lugar_origen="Ciudad de México",
                colonia_residencia_actual="Centro",
                celular="5551234567",
                correo_institucional=admin_email,
                rol="admin",
                hashed_password=get_password_hash("admin123")
            )
            db.add(admin)
            print("✅ Usuario administrador creado: admin@sistema.edu / admin123")
        
        # Usuario alumno de prueba
        alumno_email = "juan.perez@estudiante.edu"
        existing_alumno = db.query(Persona).filter(Persona.correo_institucional == alumno_email).first()
        if not existing_alumno:
            # Obtener cohorte y programa para asignar
            cohorte_2025 = db.query(Cohorte).filter(Cohorte.nombre == "2025-1").first()
            programa_sistemas = db.query(ProgramaEducativo).filter(
                ProgramaEducativo.clave_programa == "ING-SIS"
            ).first()
            grupo_sistemas = db.query(Grupo).filter(Grupo.nombre_grupo == "SIS-A").first()
            
            alumno = Persona(
                tipo_persona="alumno",
                sexo="masculino",
                genero="masculino",
                edad=20,
                estado_civil="soltero",
                religion="Católica",
                trabaja=False,
                lugar_origen="Guadalajara, Jalisco",
                colonia_residencia_actual="Zona Centro",
                celular="3331234567",
                correo_institucional=alumno_email,
                matricula="2025010001",
                semestre=3,
                numero_hijos=0,
                grupo_etnico="Mestizo",
                rol="alumno",
                cohorte_id=cohorte_2025.id if cohorte_2025 else None,
                hashed_password=get_password_hash("alumno123")
            )
            db.add(alumno)
            db.commit()
            db.refresh(alumno)
            
            # Asignar programa educativo y grupo
            if programa_sistemas:
                alumno.programas.append(programa_sistemas)
            if grupo_sistemas:
                alumno.grupos.append(grupo_sistemas)
            
            db.commit()
            print("✅ Usuario alumno creado: juan.perez@estudiante.edu / alumno123")
            print(f"   - Matrícula: 2025010001")
            print(f"   - Programa: {programa_sistemas.nombre_programa if programa_sistemas else 'No asignado'}")
            print(f"   - Grupo: {grupo_sistemas.nombre_grupo if grupo_sistemas else 'No asignado'}")
            print(f"   - Cohorte: {cohorte_2025.nombre if cohorte_2025 else 'No asignada'}")
        
        # Usuario personal de prueba
        personal_email = "maria.gonzalez@personal.edu"
        existing_personal = db.query(Persona).filter(Persona.correo_institucional == personal_email).first()
        if not existing_personal:
            personal = Persona(
                tipo_persona="administrativo",
                sexo="femenino",
                genero="femenino",
                edad=28,
                estado_civil="soltera",
                lugar_origen="Monterrey, Nuevo León",
                colonia_residencia_actual="San Pedro",
                celular="8181234567",
                correo_institucional=personal_email,
                rol="personal",
                hashed_password=get_password_hash("personal123")
            )
            db.add(personal)
            print("✅ Usuario personal creado: maria.gonzalez@personal.edu / personal123")
        
        db.commit()
        
        print("\n🎉 ¡Datos de prueba creados exitosamente!")
        print("\n📋 Resumen de usuarios creados:")
        print("┌─────────────────────────────────────┬─────────────┬──────────────┐")
        print("│ Correo                              │ Contraseña  │ Rol          │")
        print("├─────────────────────────────────────┼─────────────┼──────────────┤")
        print("│ admin@sistema.edu                   │ admin123    │ Administrador│")
        print("│ juan.perez@estudiante.edu           │ alumno123   │ Alumno       │")
        print("│ maria.gonzalez@personal.edu         │ personal123 │ Personal     │")
        print("└─────────────────────────────────────┴─────────────┴──────────────┘")
        
    except Exception as e:
        print(f"❌ Error creando datos de prueba: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()
