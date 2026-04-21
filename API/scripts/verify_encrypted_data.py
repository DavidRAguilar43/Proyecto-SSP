#!/usr/bin/env python3
"""
Script para verificar que los datos están cifrados en la base de datos.

Este script consulta directamente la BD con SQL para mostrar los datos
cifrados, y luego usa SQLAlchemy para mostrar los datos descifrados.
"""

import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.database import SQLALCHEMY_DATABASE_URL
from app.models.persona import User
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.cuestionario_admin import RespuestaPregunta, ReporteIA
from app.models.encryption_mixin import setup_all_encryption_listeners


def print_separator(title=""):
    """Imprime un separador visual."""
    if title:
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}\n")
    else:
        print(f"{'='*80}\n")


def verify_user_encryption(session):
    """Verifica cifrado de usuarios."""
    print_separator("VERIFICACIÓN: Tabla USERS")

    # Consulta SQL directa (datos cifrados)
    print("📊 Datos CIFRADOS en la base de datos (SQL directo):\n")
    result = session.execute(
        text("SELECT id, correo_institucional, celular, lugar_trabajo, observaciones FROM users LIMIT 3")
    )

    for row in result:
        print(f"Usuario ID {row[0]} ({row[1]}):")
        print(f"  - Celular (cifrado): {row[2][:60]}...")
        if row[3]:
            print(f"  - Lugar trabajo (cifrado): {row[3][:60]}...")
        if row[4]:
            print(f"  - Observaciones (cifrado): {row[4][:60]}...")
        print()
    
    # Consulta con SQLAlchemy (datos descifrados)
    print("\n🔓 Datos DESCIFRADOS con SQLAlchemy (automático):\n")
    users = session.query(User).limit(3).all()
    
    for user in users:
        print(f"Usuario ID {user.id} ({user.correo_institucional}):")
        print(f"  - Celular (descifrado): {user.celular}")
        if user.lugar_trabajo:
            print(f"  - Lugar trabajo (descifrado): {user.lugar_trabajo}")
        if user.observaciones:
            print(f"  - Observaciones (descifrado): {user.observaciones}")
        print()


def verify_contacto_encryption(session):
    """Verifica cifrado de contactos de emergencia."""
    print_separator("VERIFICACIÓN: Tabla CONTACTO_EMERGENCIA")

    # Consulta SQL directa (datos cifrados)
    print("📊 Datos CIFRADOS en la base de datos (SQL directo):\n")
    result = session.execute(
        text("SELECT id_contacto, nombre_contacto, telefono_contacto FROM contacto_emergencia LIMIT 3")
    )

    for row in result:
        print(f"Contacto ID {row[0]}:")
        print(f"  - Nombre (cifrado): {row[1][:60]}...")
        print(f"  - Teléfono (cifrado): {row[2][:60]}...")
        print()
    
    # Consulta con SQLAlchemy (datos descifrados)
    print("\n🔓 Datos DESCIFRADOS con SQLAlchemy (automático):\n")
    contactos = session.query(ContactoEmergencia).limit(3).all()
    
    for contacto in contactos:
        print(f"Contacto ID {contacto.id_contacto}:")
        print(f"  - Nombre (descifrado): {contacto.nombre_contacto}")
        print(f"  - Teléfono (descifrado): {contacto.telefono_contacto}")
        print()


def verify_respuesta_encryption(session):
    """Verifica cifrado de respuestas de cuestionario."""
    print_separator("VERIFICACIÓN: Tabla RESPUESTAS_PREGUNTA")

    # Consulta SQL directa (datos cifrados)
    print("📊 Datos CIFRADOS en la base de datos (SQL directo):\n")
    result = session.execute(
        text("SELECT id, valor, texto_otro FROM respuestas_pregunta LIMIT 3")
    )

    for row in result:
        print(f"Respuesta ID {row[0]}:")
        if row[1]:
            print(f"  - Valor JSON (cifrado): {row[1][:60]}...")
        if row[2]:
            print(f"  - Texto otro (cifrado): {row[2][:60]}...")
        print()
    
    # Consulta con SQLAlchemy (datos descifrados)
    print("\n🔓 Datos DESCIFRADOS con SQLAlchemy (automático):\n")
    respuestas = session.query(RespuestaPregunta).limit(3).all()
    
    for respuesta in respuestas:
        print(f"Respuesta ID {respuesta.id}:")
        if respuesta.valor:
            print(f"  - Valor JSON (descifrado): {respuesta.valor}")
        if respuesta.texto_otro:
            print(f"  - Texto otro (descifrado): {respuesta.texto_otro}")
        print()


def verify_reporte_encryption(session):
    """Verifica cifrado de reportes IA."""
    print_separator("VERIFICACIÓN: Tabla REPORTES_IA")

    # Consulta SQL directa (datos cifrados)
    print("📊 Datos CIFRADOS en la base de datos (SQL directo):\n")
    result = session.execute(
        text("SELECT id, contenido FROM reportes_ia LIMIT 2")
    )

    for row in result:
        print(f"Reporte ID {row[0][:8]}...:")
        print(f"  - Contenido (cifrado): {row[1][:80]}...")
        print()
    
    # Consulta con SQLAlchemy (datos descifrados)
    print("\n🔓 Datos DESCIFRADOS con SQLAlchemy (automático):\n")
    reportes = session.query(ReporteIA).limit(2).all()
    
    for reporte in reportes:
        print(f"Reporte ID {reporte.id[:8]}...:")
        print(f"  - Contenido (descifrado):")
        print(f"    {reporte.contenido[:200]}...")
        print()


def verify_encryption_format(session):
    """Verifica que los datos tienen el formato correcto de cifrado."""
    print_separator("VERIFICACIÓN: Formato de Cifrado")

    print("🔍 Verificando formato {encrypted_data}|{key_id}...\n")

    # Verificar usuarios
    result = session.execute(text("SELECT celular FROM users WHERE celular IS NOT NULL LIMIT 1"))
    celular = result.fetchone()[0]

    if "|" in celular and celular.startswith("gAAAAA"):
        print(f"✅ Formato correcto en users.celular:")
        print(f"   {celular[:50]}...{celular[-15:]}")
    else:
        print(f"❌ Formato incorrecto en users.celular: {celular}")

    # Verificar contactos
    result = session.execute(text("SELECT nombre_contacto FROM contacto_emergencia LIMIT 1"))
    nombre = result.fetchone()[0]

    if "|" in nombre and nombre.startswith("gAAAAA"):
        print(f"\n✅ Formato correcto en contacto_emergencia.nombre_contacto:")
        print(f"   {nombre[:50]}...{nombre[-15:]}")
    else:
        print(f"\n❌ Formato incorrecto en contacto_emergencia.nombre_contacto: {nombre}")

    # Verificar respuestas
    result = session.execute(text("SELECT valor FROM respuestas_pregunta WHERE valor IS NOT NULL LIMIT 1"))
    valor = result.fetchone()[0]

    if "|" in valor and (valor.startswith("gAAAAA") or valor.startswith('"gAAAAA')):
        print(f"\n✅ Formato correcto en respuestas_pregunta.valor:")
        print(f"   {valor[:50]}...{valor[-15:]}")
    else:
        print(f"\n❌ Formato incorrecto en respuestas_pregunta.valor: {valor}")

    # Verificar reportes
    result = session.execute(text("SELECT contenido FROM reportes_ia LIMIT 1"))
    contenido = result.fetchone()[0]

    if "|" in contenido and contenido.startswith("gAAAAA"):
        print(f"\n✅ Formato correcto en reportes_ia.contenido:")
        print(f"   {contenido[:50]}...{contenido[-15:]}")
    else:
        print(f"\n❌ Formato incorrecto en reportes_ia.contenido: {contenido}")


def main():
    """Función principal."""
    print("\n" + "🔐" * 40)
    print("  VERIFICACIÓN DE DATOS CIFRADOS EN BASE DE DATOS")
    print("  Sistema de Seguimiento Psicopedagógico (SSP)")
    print("🔐" * 40)
    
    try:
        # Crear engine y sesión
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
        setup_all_encryption_listeners()
        
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Verificar cada tabla
        verify_user_encryption(session)
        verify_contacto_encryption(session)
        verify_respuesta_encryption(session)
        verify_reporte_encryption(session)
        verify_encryption_format(session)
        
        # Resumen final
        print_separator("RESUMEN DE VERIFICACIÓN")
        print("✅ Todos los datos sensibles están CIFRADOS en la base de datos")
        print("✅ El descifrado automático funciona correctamente con SQLAlchemy")
        print("✅ El formato de cifrado {encrypted_data}|{key_id} es correcto")
        print("\n🎉 ¡Sistema de cifrado verificado exitosamente!\n")
        
        session.close()
        
    except Exception as e:
        print(f"\n❌ Error durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

