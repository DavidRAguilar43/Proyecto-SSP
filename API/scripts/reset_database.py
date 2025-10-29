#!/usr/bin/env python3
"""
Script para resetear la base de datos sin confirmación interactiva.
Útil para desarrollo y testing automatizado.
"""

import sys
import os
from datetime import datetime, timezone

# Agregar el directorio padre al path para importar módulos de la app
API_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(API_ROOT)

# Cambiar al directorio raíz de API para que las rutas relativas funcionen correctamente
os.chdir(API_ROOT)

from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.models.persona import Persona
from app.models.religion import Religion
from app.models.grupo_etnico import GrupoEtnico
from app.models.discapacidad import Discapacidad
from app.models.programa_educativo import ProgramaEducativo
from app.models.grupo import Grupo
from app.models.cita import Cita, EstadoCita, TipoCita
from app.models.cuestionario import Cuestionario
from app.models.cuestionario_admin import CuestionarioAdmin, Pregunta, AsignacionCuestionario, TipoPregunta, EstadoCuestionario, TipoUsuario
from app.core.security import get_password_hash
import uuid

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
            cita, cuestionario, cohorte, cita, religion, grupo_etnico, discapacidad
        )
        
        # Crear todas las tablas
        print("🏗️ Creando tablas...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Base de datos reseteada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al resetear base de datos: {e}")
        return False

def create_catalogos(db: Session):
    """Crear catálogos completos."""
    print("\n📚 Creando catálogos...")

    try:
        # Religiones
        religiones = [
            {"titulo": "Católica", "activo": True},
            {"titulo": "Cristiana", "activo": True},
            {"titulo": "Evangélica", "activo": True},
            {"titulo": "Testigo de Jehová", "activo": True},
            {"titulo": "Mormona", "activo": True},
            {"titulo": "Judía", "activo": True},
            {"titulo": "Musulmana", "activo": True},
            {"titulo": "Budista", "activo": True},
            {"titulo": "Hinduista", "activo": True},
            {"titulo": "Atea", "activo": True},
            {"titulo": "Agnóstica", "activo": True},
            {"titulo": "Ninguna", "activo": True},
            {"titulo": "Otra", "activo": True},
        ]

        for religion_data in religiones:
            religion = Religion(**religion_data)
            db.add(religion)

        # Grupos Étnicos
        grupos_etnicos = [
            {"titulo": "Mestizo", "activo": True},
            {"titulo": "Indígena", "activo": True},
            {"titulo": "Afromexicano", "activo": True},
            {"titulo": "Blanco", "activo": True},
            {"titulo": "Asiático", "activo": True},
            {"titulo": "Otro", "activo": True},
            {"titulo": "Prefiero no decir", "activo": True},
        ]

        for grupo_data in grupos_etnicos:
            grupo = GrupoEtnico(**grupo_data)
            db.add(grupo)

        # Discapacidades
        discapacidades = [
            {"titulo": "Ninguna", "activo": True},
            {"titulo": "Visual", "activo": True},
            {"titulo": "Auditiva", "activo": True},
            {"titulo": "Motriz", "activo": True},
            {"titulo": "Intelectual", "activo": True},
            {"titulo": "Psicosocial", "activo": True},
            {"titulo": "Múltiple", "activo": True},
            {"titulo": "Otra", "activo": True},
        ]

        for discapacidad_data in discapacidades:
            discapacidad = Discapacidad(**discapacidad_data)
            db.add(discapacidad)

        db.commit()
        print("   ✅ Catálogos creados")
        return True

    except Exception as e:
        print(f"   ❌ Error al crear catálogos: {e}")
        db.rollback()
        return False


def create_usuarios(db: Session):
    """Crear usuarios de prueba con diferentes roles."""
    print("\n👥 Creando usuarios de prueba...")

    try:
        usuarios = []

        # 1. Usuario Admin
        admin = Persona(
            sexo="no_decir",
            genero="no_decir",
            edad=35,
            estado_civil="casado",
            religion="Católica",
            trabaja=True,
            lugar_trabajo="UABC",
            lugar_origen="Tijuana, BC",
            colonia_residencia_actual="Zona Río",
            correo_institucional="admin@uabc.edu.mx",
            celular="6641234567",
            discapacidad="Ninguna",
            observaciones="Usuario administrador del sistema",
            matricula="ADMIN001",
            semestre=None,
            numero_hijos=0,
            grupo_etnico="Mestizo",
            rol="admin",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            cohorte_ano=None,
            cohorte_periodo=1
        )
        usuarios.append(admin)

        # 2. Usuario Coordinador
        coordinador = Persona(
            sexo="femenino",
            genero="femenino",
            edad=40,
            estado_civil="casado",
            religion="Católica",
            trabaja=True,
            lugar_trabajo="UABC - Facultad de Ciencias Humanas",
            lugar_origen="Ensenada, BC",
            colonia_residencia_actual="Chapultepec",
            correo_institucional="coordinador@uabc.edu.mx",
            celular="6642345678",
            discapacidad="Ninguna",
            observaciones="Coordinadora del programa de seguimiento psicopedagógico",
            matricula="COORD001",
            semestre=None,
            numero_hijos=2,
            grupo_etnico="Mestizo",
            rol="coordinador",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            cohorte_ano=None,
            cohorte_periodo=1
        )
        usuarios.append(coordinador)

        # 3. Usuario Docente
        docente = Persona(
            sexo="masculino",
            genero="masculino",
            edad=38,
            estado_civil="soltero",
            religion="Ninguna",
            trabaja=True,
            lugar_trabajo="UABC - Facultad de Ciencias Humanas",
            lugar_origen="Mexicali, BC",
            colonia_residencia_actual="Cacho",
            correo_institucional="docente@uabc.edu.mx",
            celular="6643456789",
            discapacidad="Ninguna",
            observaciones="Docente de psicología educativa",
            matricula="DOC001",
            semestre=None,
            numero_hijos=0,
            grupo_etnico="Mestizo",
            rol="docente",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            cohorte_ano=None,
            cohorte_periodo=1
        )
        usuarios.append(docente)

        # 4. Usuario Personal (Psicólogo)
        personal = Persona(
            sexo="femenino",
            genero="femenino",
            edad=32,
            estado_civil="soltero",
            religion="Cristiana",
            trabaja=True,
            lugar_trabajo="UABC - Departamento de Psicopedagogía",
            lugar_origen="Tijuana, BC",
            colonia_residencia_actual="Hipódromo",
            correo_institucional="personal@uabc.edu.mx",
            celular="6644567890",
            discapacidad="Ninguna",
            observaciones="Psicóloga del departamento de seguimiento",
            matricula="PSI001",
            semestre=None,
            numero_hijos=0,
            grupo_etnico="Mestizo",
            rol="personal",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            cohorte_ano=None,
            cohorte_periodo=1
        )
        usuarios.append(personal)

        # 5. Usuario Alumno
        alumno = Persona(
            sexo="masculino",
            genero="masculino",
            edad=20,
            estado_civil="soltero",
            religion="Católica",
            trabaja=False,
            lugar_trabajo=None,
            lugar_origen="Rosarito, BC",
            colonia_residencia_actual="Playas de Tijuana",
            correo_institucional="alumno@uabc.edu.mx",
            celular="6645678901",
            discapacidad="Ninguna",
            observaciones="Estudiante de psicología",
            matricula="1234567",
            semestre=5,
            numero_hijos=0,
            grupo_etnico="Mestizo",
            rol="alumno",
            is_active=True,
            hashed_password=get_password_hash("12345678"),
            cohorte_ano=2023,
            cohorte_periodo=1
        )
        usuarios.append(alumno)

        # Agregar todos los usuarios
        for usuario in usuarios:
            db.add(usuario)

        db.commit()

        # Refrescar para obtener los IDs
        for usuario in usuarios:
            db.refresh(usuario)

        print(f"   ✅ {len(usuarios)} usuarios creados")
        print(f"      - Admin: admin@uabc.edu.mx")
        print(f"      - Coordinador: coordinador@uabc.edu.mx")
        print(f"      - Docente: docente@uabc.edu.mx")
        print(f"      - Personal: personal@uabc.edu.mx")
        print(f"      - Alumno: alumno@uabc.edu.mx")
        print(f"      - Contraseña para todos: 12345678")

        return usuarios

    except Exception as e:
        print(f"   ❌ Error al crear usuarios: {e}")
        db.rollback()
        return None


def create_programas_y_grupos(db: Session):
    """Crear programas educativos y grupos de prueba."""
    print("\n🎓 Creando programas educativos y grupos...")

    try:
        # Programas educativos
        programas = [
            ProgramaEducativo(
                nombre_programa="Licenciatura en Psicología",
                clave_programa="PSI"
            ),
            ProgramaEducativo(
                nombre_programa="Licenciatura en Ciencias de la Educación",
                clave_programa="CED"
            ),
            ProgramaEducativo(
                nombre_programa="Licenciatura en Pedagogía",
                clave_programa="PED"
            ),
        ]

        for programa in programas:
            db.add(programa)

        db.commit()

        # Grupos
        grupos = [
            Grupo(
                nombre_grupo="Grupo A - Psicología 2023-1",
                tipo_grupo="Regular",
                observaciones_grupo="Grupo de primer ingreso 2023"
            ),
            Grupo(
                nombre_grupo="Grupo B - Psicología 2023-1",
                tipo_grupo="Regular",
                observaciones_grupo="Grupo de primer ingreso 2023"
            ),
        ]

        for grupo in grupos:
            db.add(grupo)

        db.commit()

        print(f"   ✅ {len(programas)} programas educativos creados")
        print(f"   ✅ {len(grupos)} grupos creados")

        return True

    except Exception as e:
        print(f"   ❌ Error al crear programas y grupos: {e}")
        db.rollback()
        return False


def create_citas(db: Session, usuarios: list):
    """Crear citas de prueba."""
    print("\n📅 Creando citas de prueba...")

    try:
        # Buscar usuarios por rol
        alumno = next((u for u in usuarios if u.rol == "alumno"), None)
        personal = next((u for u in usuarios if u.rol == "personal"), None)

        if not alumno or not personal:
            print("   ⚠️ No se encontraron usuarios necesarios para crear citas")
            return False

        from datetime import timedelta
        now = datetime.now(timezone.utc)

        citas = [
            # Cita pendiente
            Cita(
                id_alumno=alumno.id,
                tipo_cita=TipoCita.PSICOLOGICA,
                motivo="Necesito apoyo para manejar el estrés académico",
                estado=EstadoCita.PENDIENTE,
                fecha_propuesta_alumno=now + timedelta(days=3),
                observaciones_alumno="Prefiero horario matutino"
            ),
            # Cita confirmada
            Cita(
                id_alumno=alumno.id,
                id_personal=personal.id,
                tipo_cita=TipoCita.ACADEMICA,
                motivo="Asesoría sobre técnicas de estudio",
                estado=EstadoCita.CONFIRMADA,
                fecha_propuesta_alumno=now + timedelta(days=5),
                fecha_confirmada=now + timedelta(days=5, hours=10),
                ubicacion="Cubículo 201, Edificio de Psicología",
                observaciones_personal="Traer material de estudio"
            ),
            # Cita completada
            Cita(
                id_alumno=alumno.id,
                id_personal=personal.id,
                tipo_cita=TipoCita.GENERAL,
                motivo="Orientación vocacional",
                estado=EstadoCita.COMPLETADA,
                fecha_propuesta_alumno=now - timedelta(days=7),
                fecha_confirmada=now - timedelta(days=7, hours=14),
                fecha_completada=now - timedelta(days=7, hours=15),
                ubicacion="Cubículo 201, Edificio de Psicología",
                observaciones_personal="Sesión completada satisfactoriamente",
                motivo_psicologico=False,
                motivo_academico=True,
                requiere_seguimiento=True,
                fecha_proxima_sesion=now + timedelta(days=14)
            ),
        ]

        for cita in citas:
            db.add(cita)

        db.commit()

        print(f"   ✅ {len(citas)} citas creadas")
        print(f"      - 1 pendiente, 1 confirmada, 1 completada")

        return True

    except Exception as e:
        print(f"   ❌ Error al crear citas: {e}")
        db.rollback()
        return False


def create_cuestionarios(db: Session, usuarios: list):
    """Crear cuestionarios de prueba."""
    print("\n📝 Creando cuestionarios de prueba...")

    try:
        # Buscar usuarios
        alumno = next((u for u in usuarios if u.rol == "alumno"), None)
        admin = next((u for u in usuarios if u.rol == "admin"), None)

        if not alumno or not admin:
            print("   ⚠️ No se encontraron usuarios necesarios para crear cuestionarios")
            return False

        from datetime import timedelta
        now = datetime.now(timezone.utc)

        # 1. Cuestionario psicopedagógico completado
        cuestionario_psi = Cuestionario(
            tipo_cuestionario="psicopedagogico",
            id_persona=alumno.id,
            respuestas={
                "motivacion": "alta",
                "habitos_estudio": "buenos",
                "apoyo_familiar": "si",
                "dificultades": "ninguna"
            },
            reporte_ia="El estudiante muestra buena adaptación académica y motivación.",
            fecha_completado=now - timedelta(days=5)
        )
        db.add(cuestionario_psi)
        db.commit()
        db.refresh(cuestionario_psi)

        # 2. Cuestionario administrativo - Encuesta de Satisfacción
        cuestionario_admin_id = str(uuid.uuid4())
        cuestionario_admin = CuestionarioAdmin(
            id=cuestionario_admin_id,
            titulo="Encuesta de Satisfacción del Servicio",
            descripcion="Cuestionario para evaluar la satisfacción de los estudiantes con el servicio de seguimiento psicopedagógico",
            estado=EstadoCuestionario.ACTIVO,
            creado_por=admin.id,
            fecha_inicio=now - timedelta(days=10),
            fecha_fin=now + timedelta(days=20)
        )
        db.add(cuestionario_admin)

        # Preguntas del cuestionario administrativo
        preguntas = [
            Pregunta(
                id=str(uuid.uuid4()),
                cuestionario_id=cuestionario_admin_id,
                tipo=TipoPregunta.ESCALA_LIKERT,
                texto="¿Qué tan satisfecho estás con el servicio de seguimiento psicopedagógico?",
                descripcion="Califica del 1 al 5, donde 1 es muy insatisfecho y 5 es muy satisfecho",
                obligatoria=True,
                orden=1,
                configuracion={"min": 1, "max": 5, "etiqueta_min": "Muy insatisfecho", "etiqueta_max": "Muy satisfecho"}
            ),
            Pregunta(
                id=str(uuid.uuid4()),
                cuestionario_id=cuestionario_admin_id,
                tipo=TipoPregunta.CHECKBOX,
                texto="¿Qué tipo de apoyo has recibido?",
                descripcion="Selecciona todas las opciones que apliquen",
                obligatoria=True,
                orden=2,
                configuracion={
                    "opciones": ["Psicológico", "Académico", "Orientación vocacional", "Otro"]
                }
            ),
            Pregunta(
                id=str(uuid.uuid4()),
                cuestionario_id=cuestionario_admin_id,
                tipo=TipoPregunta.ABIERTA,
                texto="¿Qué sugerencias tienes para mejorar el servicio?",
                descripcion="Comparte tus comentarios y sugerencias",
                obligatoria=False,
                orden=3,
                configuracion={"max_caracteres": 500}
            ),
        ]

        for pregunta in preguntas:
            db.add(pregunta)

        # Asignación del cuestionario a alumnos
        asignacion = AsignacionCuestionario(
            cuestionario_id=cuestionario_admin_id,
            tipo_usuario=TipoUsuario.ALUMNO
        )
        db.add(asignacion)

        db.commit()

        print(f"   ✅ Cuestionarios creados:")
        print(f"      - 1 cuestionario psicopedagógico completado")
        print(f"      - 1 cuestionario administrativo con 3 preguntas")

        return True

    except Exception as e:
        print(f"   ❌ Error al crear cuestionarios: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False


def main():
    """Función principal."""
    print("=== RESET AUTOMÁTICO DE BASE DE DATOS ===")
    print("Reseteando base de datos sin confirmación...")
    print()

    # Resetear base de datos
    if not reset_database():
        print("❌ Error al resetear base de datos")
        return 1

    # Crear sesión de base de datos
    db = SessionLocal()

    try:
        # Crear catálogos
        if not create_catalogos(db):
            print("❌ Error al crear catálogos")
            return 1

        # Crear usuarios
        usuarios = create_usuarios(db)
        if not usuarios:
            print("❌ Error al crear usuarios")
            return 1

        # Crear programas y grupos
        if not create_programas_y_grupos(db):
            print("❌ Error al crear programas y grupos")
            return 1

        # Crear citas
        if not create_citas(db, usuarios):
            print("❌ Error al crear citas")
            return 1

        # Crear cuestionarios
        if not create_cuestionarios(db, usuarios):
            print("❌ Error al crear cuestionarios")
            return 1

    finally:
        db.close()

    print("\n=== RESET COMPLETADO ===")
    print("✅ Base de datos reseteada exitosamente con datos de prueba")
    print()
    print("👥 USUARIOS CREADOS:")
    print("   👤 Admin: admin@uabc.edu.mx / 12345678")
    print("   👤 Coordinador: coordinador@uabc.edu.mx / 12345678")
    print("   👤 Docente: docente@uabc.edu.mx / 12345678")
    print("   👤 Personal: personal@uabc.edu.mx / 12345678")
    print("   👤 Alumno: alumno@uabc.edu.mx / 12345678")
    print()
    print("📊 DATOS DE PRUEBA:")
    print("   📚 Catálogos completos (religiones, grupos étnicos, discapacidades)")
    print("   🎓 3 programas educativos")
    print("   👥 2 grupos")
    print("   📅 3 citas (pendiente, confirmada, completada)")
    print("   📝 2 cuestionarios (1 psicopedagógico, 1 administrativo)")
    print()

    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
