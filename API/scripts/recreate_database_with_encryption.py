#!/usr/bin/env python3
"""
Script para recrear la base de datos con cifrado habilitado y datos de prueba.

Este script:
1. Elimina la base de datos actual (ssp.db)
2. Crea todas las tablas desde cero
3. Configura los listeners de cifrado
4. Crea datos de prueba con cifrado automático

Uso:
    python scripts/recreate_database_with_encryption.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime, timedelta

from app.db.database import Base, SQLALCHEMY_DATABASE_URL
from app.models.persona import User
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.cuestionario_admin import (
    CuestionarioAdmin, Pregunta, RespuestaCuestionario, RespuestaPregunta,
    ReporteIA, AsignacionCuestionario, TipoPregunta, EstadoCuestionario, TipoUsuario
)
from app.models.encryption_mixin import setup_all_encryption_listeners
from app.core.security import get_password_hash


def print_separator(title=""):
    """Imprime un separador visual."""
    if title:
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}\n")
    else:
        print(f"{'='*80}\n")


def recreate_database():
    """Elimina y recrea la base de datos."""
    print_separator("RECREANDO BASE DE DATOS")
    
    # Obtener ruta de la base de datos
    db_path = Path("ssp.db")
    
    # Eliminar base de datos si existe
    if db_path.exists():
        print(f"🗑️  Eliminando base de datos existente: {db_path}")
        db_path.unlink()
        print("   ✓ Base de datos eliminada")
    else:
        print(f"ℹ️  No existe base de datos previa")
    
    # Crear engine
    print(f"\n📦 Creando nueva base de datos: {SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Crear todas las tablas
    print("📋 Creando tablas...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tablas creadas exitosamente")
    
    # Configurar listeners de cifrado
    print("\n🔐 Configurando sistema de cifrado...")
    setup_all_encryption_listeners()
    print("   ✓ Listeners de cifrado configurados")
    
    return engine


def create_test_users(session):
    """Crea usuarios de prueba con datos cifrados."""
    print_separator("CREANDO USUARIOS DE PRUEBA")
    
    users_data = [
        {
            "sexo": "masculino",
            "genero": "masculino",
            "edad": 20,
            "estado_civil": "soltero",
            "lugar_trabajo": "Universidad Nacional Autónoma de México",
            "lugar_origen": "Ciudad de México",
            "colonia_residencia_actual": "Colonia Del Valle",
            "celular": "5551234567",
            "extension_telefonica": "1001",
            "correo_institucional": "admin@unam.mx",
            "observaciones": "Usuario administrador del sistema",
            "matricula": None,
            "rol": "admin",
            "password": "admin123"
        },
        {
            "sexo": "femenino",
            "genero": "femenino",
            "edad": 22,
            "estado_civil": "soltera",
            "lugar_trabajo": "Instituto Politécnico Nacional",
            "lugar_origen": "Guadalajara",
            "colonia_residencia_actual": "Roma Norte",
            "celular": "5559876543",
            "extension_telefonica": None,
            "correo_institucional": "maria.garcia@unam.mx",
            "observaciones": "Estudiante destacada en matemáticas",
            "matricula": "2024001",
            "semestre": 4,
            "rol": "alumno",
            "password": "maria123"
        },
        {
            "sexo": "masculino",
            "genero": "masculino",
            "edad": 21,
            "estado_civil": "soltero",
            "lugar_trabajo": None,
            "lugar_origen": "Monterrey",
            "colonia_residencia_actual": "Condesa",
            "celular": "5552223344",
            "extension_telefonica": None,
            "correo_institucional": "juan.perez@unam.mx",
            "observaciones": "Requiere apoyo psicopedagógico",
            "matricula": "2024002",
            "semestre": 3,
            "rol": "alumno",
            "password": "juan123"
        },
        {
            "sexo": "otro",
            "genero": "no_binario",
            "edad": 23,
            "estado_civil": "soltero",
            "lugar_trabajo": "Freelance - Desarrollo Web",
            "lugar_origen": "Puebla",
            "colonia_residencia_actual": "Polanco",
            "celular": "5553334455",
            "extension_telefonica": None,
            "correo_institucional": "alex.lopez@unam.mx",
            "observaciones": "Estudiante con excelente rendimiento académico",
            "matricula": "2024003",
            "semestre": 5,
            "rol": "alumno",
            "password": "alex123"
        },
        {
            "sexo": "femenino",
            "genero": "femenino",
            "edad": 35,
            "estado_civil": "casada",
            "lugar_trabajo": "UNAM - Facultad de Psicología",
            "lugar_origen": "Querétaro",
            "colonia_residencia_actual": "Coyoacán",
            "celular": "5554445566",
            "extension_telefonica": "2001",
            "correo_institucional": "dra.martinez@unam.mx",
            "observaciones": "Coordinadora del área psicopedagógica",
            "matricula": None,
            "rol": "coordinador",
            "password": "coord123"
        }
    ]
    
    created_users = []
    
    for i, user_data in enumerate(users_data, 1):
        password = user_data.pop("password")
        
        user = User(
            **user_data,
            hashed_password=get_password_hash(password)
        )
        
        session.add(user)
        session.flush()  # Para obtener el ID
        
        created_users.append(user)
        
        print(f"✓ Usuario {i}/5 creado:")
        print(f"  - Email: {user.correo_institucional}")
        print(f"  - Rol: {user.rol}")
        print(f"  - Celular (cifrado): {user.celular}")
        if user.lugar_trabajo:
            print(f"  - Lugar trabajo (cifrado): {user.lugar_trabajo[:50]}...")
    
    session.commit()
    print(f"\n✅ {len(created_users)} usuarios creados exitosamente")
    
    return created_users


def create_test_contactos(session, users):
    """Crea contactos de emergencia de prueba."""
    print_separator("CREANDO CONTACTOS DE EMERGENCIA")
    
    # Crear contactos para los alumnos
    alumnos = [u for u in users if u.rol == "alumno"]
    
    contactos_data = [
        {
            "nombre_contacto": "Sra. Patricia García Rodríguez",
            "telefono_contacto": "5556667788",
            "parentesco": "Madre"
        },
        {
            "nombre_contacto": "Dr. Roberto Pérez Sánchez",
            "telefono_contacto": "5557778899",
            "parentesco": "Padre"
        },
        {
            "nombre_contacto": "Lic. Carmen López Martínez",
            "telefono_contacto": "5558889900",
            "parentesco": "Hermana"
        }
    ]
    
    created_contactos = []
    
    for i, (alumno, contacto_data) in enumerate(zip(alumnos, contactos_data), 1):
        contacto = ContactoEmergencia(
            **contacto_data,
            id_user=alumno.id
        )
        
        session.add(contacto)
        created_contactos.append(contacto)
        
        print(f"✓ Contacto {i}/3 creado:")
        print(f"  - Alumno: {alumno.correo_institucional}")
        print(f"  - Nombre (cifrado): {contacto_data['nombre_contacto']}")
        print(f"  - Teléfono (cifrado): {contacto_data['telefono_contacto']}")
    
    session.commit()
    print(f"\n✅ {len(created_contactos)} contactos creados exitosamente")
    
    return created_contactos


def create_test_cuestionario(session, users):
    """Crea un cuestionario de prueba con respuestas."""
    print_separator("CREANDO CUESTIONARIO DE PRUEBA")
    
    # Buscar coordinador
    coordinador = next((u for u in users if u.rol == "coordinador"), users[0])
    
    # Crear cuestionario
    cuestionario_id = str(uuid.uuid4())
    cuestionario = CuestionarioAdmin(
        id=cuestionario_id,
        titulo="Evaluación de Bienestar Psicológico",
        descripcion="Cuestionario para evaluar el estado emocional y psicológico de los estudiantes",
        fecha_inicio=datetime.now(),
        fecha_fin=datetime.now() + timedelta(days=30),
        estado=EstadoCuestionario.ACTIVO,
        creado_por=coordinador.id,
        instruccion_sistema="Analiza las respuestas y genera un reporte sobre el estado emocional del estudiante",
        modelo_ia="openai/gpt-3.5-turbo",
        max_tokens=4000,
        temperature=0.7
    )
    
    session.add(cuestionario)
    print(f"✓ Cuestionario creado: {cuestionario.titulo}")
    
    # Crear preguntas
    preguntas_data = [
        {
            "tipo": TipoPregunta.ESCALA_LIKERT,
            "texto": "¿Cómo te sientes emocionalmente en general?",
            "descripcion": "Escala del 1 (muy mal) al 10 (excelente)",
            "obligatoria": True,
            "orden": 1,
            "configuracion": {"min": 1, "max": 10}
        },
        {
            "tipo": TipoPregunta.ABIERTA,
            "texto": "Describe tu situación actual y cualquier preocupación que tengas",
            "descripcion": "Responde con sinceridad, esta información es confidencial",
            "obligatoria": True,
            "orden": 2,
            "configuracion": {}
        },
        {
            "tipo": TipoPregunta.CHECKBOX,
            "texto": "¿Qué aspectos te generan más estrés? (Selecciona todos los que apliquen)",
            "descripcion": None,
            "obligatoria": False,
            "orden": 3,
            "configuracion": {
                "opciones": ["Estudios", "Familia", "Economía", "Relaciones", "Salud", "Futuro"]
            }
        }
    ]
    
    preguntas = []
    for pregunta_data in preguntas_data:
        pregunta = Pregunta(
            id=str(uuid.uuid4()),
            cuestionario_id=cuestionario_id,
            **pregunta_data
        )
        session.add(pregunta)
        preguntas.append(pregunta)
    
    print(f"✓ {len(preguntas)} preguntas creadas")
    
    # Asignar a alumnos
    asignacion = AsignacionCuestionario(
        cuestionario_id=cuestionario_id,
        tipo_usuario=TipoUsuario.ALUMNO
    )
    session.add(asignacion)
    print(f"✓ Cuestionario asignado a: {TipoUsuario.ALUMNO}")
    
    session.commit()
    
    return cuestionario, preguntas


def create_test_respuestas(session, users, cuestionario, preguntas):
    """Crea respuestas de prueba con datos cifrados."""
    print_separator("CREANDO RESPUESTAS DE CUESTIONARIO")
    
    # Buscar alumnos
    alumnos = [u for u in users if u.rol == "alumno"][:2]  # Solo 2 alumnos
    
    respuestas_data = [
        {
            "usuario": alumnos[0],
            "respuestas": [
                {"pregunta_idx": 0, "valor": {"nivel": 7}},
                {
                    "pregunta_idx": 1,
                    "valor": {"texto": "Me siento un poco ansioso por los exámenes finales, pero en general estoy bien. Mi familia me apoya mucho."}
                },
                {"pregunta_idx": 2, "valor": {"seleccionados": ["Estudios", "Futuro"]}}
            ]
        },
        {
            "usuario": alumnos[1],
            "respuestas": [
                {"pregunta_idx": 0, "valor": {"nivel": 5}},
                {
                    "pregunta_idx": 1,
                    "valor": {"texto": "Últimamente me he sentido muy estresado. Tengo problemas para concentrarme y dormir bien. La situación económica en casa es difícil."}
                },
                {"pregunta_idx": 2, "valor": {"seleccionados": ["Estudios", "Economía", "Salud"]}}
            ]
        }
    ]
    
    created_respuestas = []
    
    for i, resp_data in enumerate(respuestas_data, 1):
        usuario = resp_data["usuario"]
        
        # Crear respuesta de cuestionario
        respuesta_cuestionario = RespuestaCuestionario(
            id=str(uuid.uuid4()),
            cuestionario_id=cuestionario.id,
            usuario_id=usuario.id,
            estado="completado",
            fecha_completado=datetime.now(),
            progreso=100
        )
        
        session.add(respuesta_cuestionario)
        session.flush()
        
        print(f"\n✓ Respuesta {i}/2 creada:")
        print(f"  - Alumno: {usuario.correo_institucional}")
        
        # Crear respuestas individuales
        for resp in resp_data["respuestas"]:
            pregunta = preguntas[resp["pregunta_idx"]]
            
            respuesta_pregunta = RespuestaPregunta(
                respuesta_cuestionario_id=respuesta_cuestionario.id,
                pregunta_id=pregunta.id,
                valor=resp["valor"]  # Se cifrará automáticamente
            )
            
            session.add(respuesta_pregunta)
            print(f"    - Pregunta {resp['pregunta_idx'] + 1}: Valor cifrado")
        
        # Crear reporte IA simulado
        reporte_contenido = f"""
REPORTE PSICOPEDAGÓGICO - {usuario.correo_institucional}

RESUMEN EJECUTIVO:
El estudiante presenta un nivel de bienestar emocional {'moderado-alto' if i == 1 else 'moderado-bajo'}.

ANÁLISIS DETALLADO:
- Estado emocional general: {'Positivo con áreas de mejora' if i == 1 else 'Requiere atención'}
- Principales preocupaciones: {'Académicas y futuro profesional' if i == 1 else 'Económicas y salud mental'}
- Factores de estrés identificados: {'Moderados' if i == 1 else 'Significativos'}

RECOMENDACIONES:
1. {'Continuar con seguimiento regular' if i == 1 else 'Programar sesión de apoyo psicológico urgente'}
2. {'Técnicas de manejo de estrés pre-exámenes' if i == 1 else 'Evaluar opciones de apoyo económico institucional'}
3. {'Mantener red de apoyo familiar' if i == 1 else 'Implementar técnicas de higiene del sueño'}

NIVEL DE PRIORIDAD: {'MEDIA' if i == 1 else 'ALTA'}
        """.strip()
        
        reporte = ReporteIA(
            id=str(uuid.uuid4()),
            respuesta_cuestionario_id=respuesta_cuestionario.id,
            contenido=reporte_contenido,  # Se cifrará automáticamente
            version=1,
            es_actual=True
        )
        
        session.add(reporte)
        print(f"    - Reporte IA generado (cifrado)")
        
        created_respuestas.append(respuesta_cuestionario)
    
    session.commit()
    print(f"\n✅ {len(created_respuestas)} respuestas completas creadas")
    
    return created_respuestas


def main():
    """Función principal."""
    print("\n" + "🔄" * 40)
    print("  RECREACIÓN DE BASE DE DATOS CON CIFRADO")
    print("  Sistema de Seguimiento Psicopedagógico (SSP)")
    print("🔄" * 40)
    
    try:
        # 1. Recrear base de datos
        engine = recreate_database()
        
        # 2. Crear sesión
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # 3. Crear datos de prueba
        users = create_test_users(session)
        contactos = create_test_contactos(session, users)
        cuestionario, preguntas = create_test_cuestionario(session, users)
        respuestas = create_test_respuestas(session, users, cuestionario, preguntas)
        
        # 4. Resumen final
        print_separator("RESUMEN FINAL")
        print(f"✅ Base de datos recreada exitosamente")
        print(f"✅ {len(users)} usuarios creados")
        print(f"✅ {len(contactos)} contactos de emergencia creados")
        print(f"✅ 1 cuestionario con {len(preguntas)} preguntas creado")
        print(f"✅ {len(respuestas)} respuestas completas creadas")
        print(f"\n🔐 TODOS LOS DATOS SENSIBLES ESTÁN CIFRADOS EN LA BD")
        
        print("\n📝 Credenciales de acceso:")
        print("  - Admin: admin@unam.mx / admin123")
        print("  - Coordinador: dra.martinez@unam.mx / coord123")
        print("  - Alumno 1: maria.garcia@unam.mx / maria123")
        print("  - Alumno 2: juan.perez@unam.mx / juan123")
        print("  - Alumno 3: alex.lopez@unam.mx / alex123")
        
        print("\n🎉 ¡Base de datos lista para usar!\n")
        
        session.close()
        
    except Exception as e:
        print(f"\n❌ Error durante la recreación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

