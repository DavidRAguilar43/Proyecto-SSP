#!/usr/bin/env python3
"""
Script de demostración del sistema de cifrado automático.

Este script muestra cómo funciona el cifrado/descifrado automático
de campos sensibles en los modelos.

Uso:
    python scripts/demo_encryption.py
"""

import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.persona import User
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.cuestionario_admin import RespuestaPregunta, ReporteIA, RespuestaCuestionario
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


def demo_user_encryption():
    """Demuestra el cifrado de campos en el modelo User."""
    print_separator("DEMOSTRACIÓN: Cifrado de Usuario")
    
    # Crear base de datos en memoria
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    setup_all_encryption_listeners()
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 1. Crear usuario con datos sensibles
        print("1️⃣  Creando usuario con datos sensibles...")
        user = User(
            sexo="masculino",
            genero="masculino",
            edad=25,
            estado_civil="soltero",
            lugar_trabajo="Universidad Nacional Autónoma de México",
            lugar_origen="Ciudad de México",
            colonia_residencia_actual="Colonia Del Valle",
            celular="5551234567",
            extension_telefonica="1234",
            correo_institucional="juan.perez@unam.mx",
            observaciones="Estudiante destacado en matemáticas",
            matricula="2024001",
            rol="alumno",
            hashed_password=get_password_hash("password123")
        )
        
        print(f"   ✓ Datos originales:")
        print(f"     - Celular: {user.celular}")
        print(f"     - Lugar de trabajo: {user.lugar_trabajo}")
        print(f"     - Colonia: {user.colonia_residencia_actual}")
        print(f"     - Observaciones: {user.observaciones}")
        
        # 2. Guardar en base de datos
        print("\n2️⃣  Guardando en base de datos...")
        session.add(user)
        session.commit()
        user_id = user.id
        print(f"   ✓ Usuario guardado con ID: {user_id}")
        
        # 3. Verificar datos cifrados en BD
        print("\n3️⃣  Verificando datos CIFRADOS en la base de datos...")
        result = session.execute(
            text("SELECT celular, lugar_trabajo, colonia_residencia_actual, observaciones FROM users WHERE id = :id"),
            {"id": user_id}
        ).fetchone()
        
        print(f"   ✓ Datos en BD (cifrados):")
        print(f"     - Celular: {result[0][:50]}...")
        print(f"     - Lugar de trabajo: {result[1][:50]}...")
        print(f"     - Colonia: {result[2][:50]}...")
        print(f"     - Observaciones: {result[3][:50]}...")
        
        # 4. Recargar usuario y verificar descifrado
        print("\n4️⃣  Recargando usuario desde BD...")
        session.expunge_all()
        loaded_user = session.query(User).filter(User.id == user_id).first()
        
        print(f"   ✓ Datos DESCIFRADOS automáticamente:")
        print(f"     - Celular: {loaded_user.celular}")
        print(f"     - Lugar de trabajo: {loaded_user.lugar_trabajo}")
        print(f"     - Colonia: {loaded_user.colonia_residencia_actual}")
        print(f"     - Observaciones: {loaded_user.observaciones}")
        
        # 5. Verificar que los datos coinciden
        print("\n5️⃣  Verificando integridad de datos...")
        assert loaded_user.celular == "5551234567"
        assert loaded_user.lugar_trabajo == "Universidad Nacional Autónoma de México"
        assert loaded_user.colonia_residencia_actual == "Colonia Del Valle"
        assert loaded_user.observaciones == "Estudiante destacado en matemáticas"
        print("   ✅ ¡Todos los datos coinciden perfectamente!")
        
    finally:
        session.close()


def demo_contacto_encryption():
    """Demuestra el cifrado de campos en el modelo ContactoEmergencia."""
    print_separator("DEMOSTRACIÓN: Cifrado de Contacto de Emergencia")
    
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    setup_all_encryption_listeners()
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Crear usuario primero
        user = User(
            sexo="femenino",
            genero="femenino",
            edad=22,
            estado_civil="soltera",
            lugar_origen="Guadalajara",
            colonia_residencia_actual="Roma Norte",
            celular="5559876543",
            correo_institucional="maria.garcia@unam.mx",
            matricula="2024002",
            rol="alumno",
            hashed_password=get_password_hash("password456")
        )
        session.add(user)
        session.commit()
        
        # Crear contacto de emergencia
        print("1️⃣  Creando contacto de emergencia...")
        contacto = ContactoEmergencia(
            nombre_contacto="Dr. Roberto García Martínez",
            telefono_contacto="5553334455",
            parentesco="Padre",
            id_user=user.id
        )
        
        print(f"   ✓ Datos originales:")
        print(f"     - Nombre: {contacto.nombre_contacto}")
        print(f"     - Teléfono: {contacto.telefono_contacto}")
        
        # Guardar
        print("\n2️⃣  Guardando en base de datos...")
        session.add(contacto)
        session.commit()
        contacto_id = contacto.id_contacto
        print(f"   ✓ Contacto guardado con ID: {contacto_id}")
        
        # Verificar cifrado en BD
        print("\n3️⃣  Verificando datos CIFRADOS en la base de datos...")
        result = session.execute(
            text("SELECT nombre_contacto, telefono_contacto FROM contacto_emergencia WHERE id_contacto = :id"),
            {"id": contacto_id}
        ).fetchone()
        
        print(f"   ✓ Datos en BD (cifrados):")
        print(f"     - Nombre: {result[0][:50]}...")
        print(f"     - Teléfono: {result[1][:50]}...")
        
        # Recargar y verificar descifrado
        print("\n4️⃣  Recargando contacto desde BD...")
        session.expunge_all()
        loaded_contacto = session.query(ContactoEmergencia).filter(
            ContactoEmergencia.id_contacto == contacto_id
        ).first()
        
        print(f"   ✓ Datos DESCIFRADOS automáticamente:")
        print(f"     - Nombre: {loaded_contacto.nombre_contacto}")
        print(f"     - Teléfono: {loaded_contacto.telefono_contacto}")
        
        # Verificar integridad
        print("\n5️⃣  Verificando integridad de datos...")
        assert loaded_contacto.nombre_contacto == "Dr. Roberto García Martínez"
        assert loaded_contacto.telefono_contacto == "5553334455"
        print("   ✅ ¡Todos los datos coinciden perfectamente!")
        
    finally:
        session.close()


def demo_respuesta_encryption():
    """Demuestra el cifrado de campos JSON en RespuestaPregunta."""
    print_separator("DEMOSTRACIÓN: Cifrado de Respuestas de Cuestionario")
    
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    setup_all_encryption_listeners()
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Crear usuario
        user = User(
            sexo="otro",
            genero="no_binario",
            edad=21,
            estado_civil="soltero",
            lugar_origen="Puebla",
            colonia_residencia_actual="Condesa",
            celular="5554444444",
            correo_institucional="alex.lopez@unam.mx",
            matricula="2024003",
            rol="alumno",
            hashed_password=get_password_hash("password789")
        )
        session.add(user)
        session.commit()
        
        # Crear respuesta de cuestionario
        respuesta_cuestionario = RespuestaCuestionario(
            id="resp-demo-001",
            usuario_id=user.id,
            estado="completado"
        )
        session.add(respuesta_cuestionario)
        session.commit()
        
        # Crear respuesta con datos sensibles
        print("1️⃣  Creando respuesta de cuestionario con datos sensibles...")
        respuesta_data = {
            "pregunta_1": "Me siento muy ansioso últimamente",
            "pregunta_2": "Tengo problemas para dormir",
            "nivel_ansiedad": 8,
            "detalles_personales": "Situación familiar complicada"
        }
        
        respuesta = RespuestaPregunta(
            respuesta_cuestionario_id="resp-demo-001",
            valor=respuesta_data,
            texto_otro="Información adicional muy sensible sobre mi situación"
        )
        
        print(f"   ✓ Datos originales (JSON):")
        print(f"     {respuesta.valor}")
        print(f"   ✓ Texto adicional:")
        print(f"     {respuesta.texto_otro}")
        
        # Guardar
        print("\n2️⃣  Guardando en base de datos...")
        session.add(respuesta)
        session.commit()
        respuesta_id = respuesta.id
        print(f"   ✓ Respuesta guardada con ID: {respuesta_id}")
        
        # Verificar cifrado en BD
        print("\n3️⃣  Verificando datos CIFRADOS en la base de datos...")
        result = session.execute(
            text("SELECT valor, texto_otro FROM respuestas_pregunta WHERE id = :id"),
            {"id": respuesta_id}
        ).fetchone()
        
        print(f"   ✓ Datos en BD (cifrados):")
        print(f"     - Valor (JSON): {result[0][:60]}...")
        print(f"     - Texto otro: {result[1][:60]}...")
        
        # Recargar y verificar descifrado
        print("\n4️⃣  Recargando respuesta desde BD...")
        session.expunge_all()
        loaded_respuesta = session.query(RespuestaPregunta).filter(
            RespuestaPregunta.id == respuesta_id
        ).first()
        
        print(f"   ✓ Datos DESCIFRADOS automáticamente:")
        print(f"     - Valor (JSON): {loaded_respuesta.valor}")
        print(f"     - Texto otro: {loaded_respuesta.texto_otro}")
        
        # Verificar integridad
        print("\n5️⃣  Verificando integridad de datos...")
        assert loaded_respuesta.valor == respuesta_data
        assert loaded_respuesta.texto_otro == "Información adicional muy sensible sobre mi situación"
        print("   ✅ ¡Todos los datos coinciden perfectamente!")
        
    finally:
        session.close()


def main():
    """Ejecuta todas las demostraciones."""
    print("\n" + "🔐" * 40)
    print("  DEMOSTRACIÓN DEL SISTEMA DE CIFRADO AUTOMÁTICO")
    print("  Sistema de Seguimiento Psicopedagógico (SSP)")
    print("🔐" * 40)
    
    try:
        demo_user_encryption()
        demo_contacto_encryption()
        demo_respuesta_encryption()
        
        print_separator("RESUMEN FINAL")
        print("✅ El sistema de cifrado funciona correctamente")
        print("✅ Los datos se cifran automáticamente al guardar")
        print("✅ Los datos se descifran automáticamente al leer")
        print("✅ El código de negocio trabaja con datos descifrados")
        print("✅ La base de datos almacena datos cifrados")
        print("\n🎉 ¡Sistema de cifrado completamente funcional!\n")
        
    except Exception as e:
        print(f"\n❌ Error durante la demostración: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

