#!/usr/bin/env python3
"""
Script para agregar un usuario coordinador de prueba.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.core.security import get_password_hash

def add_coordinador_user():
    """Agregar un usuario coordinador de prueba."""
    db = SessionLocal()
    try:
        # Verificar si ya existe un coordinador usando SQL directo
        result = db.execute(text("SELECT correo_institucional FROM personas WHERE rol = 'coordinador' LIMIT 1"))
        existing = result.fetchone()
        if existing:
            print(f"Ya existe un coordinador: {existing[0]}")
            return

        # Crear usuario coordinador usando SQL directo
        hashed_password = get_password_hash("12345678")

        insert_sql = text("""
            INSERT INTO personas (
                sexo, genero, edad, estado_civil, trabaja, lugar_origen,
                colonia_residencia_actual, celular, correo_institucional,
                matricula, rol, is_active, hashed_password
            ) VALUES (
                :sexo, :genero, :edad, :estado_civil, :trabaja, :lugar_origen,
                :colonia_residencia_actual, :celular, :correo_institucional,
                :matricula, :rol, :is_active, :hashed_password
            )
        """)

        db.execute(insert_sql, {
            "sexo": "no_decir",
            "genero": "no_decir",
            "edad": 35,
            "estado_civil": "soltero",
            "trabaja": True,
            "lugar_origen": "Tijuana",
            "colonia_residencia_actual": "Centro",
            "celular": "6641234567",
            "correo_institucional": "coordinador@uabc.edu.mx",
            "matricula": "COORD001",
            "rol": "coordinador",
            "is_active": True,
            "hashed_password": hashed_password
        })

        db.commit()

        print(f"✅ Usuario coordinador creado exitosamente:")
        print(f"   Email: coordinador@uabc.edu.mx")
        print(f"   Matrícula: COORD001")
        print(f"   Contraseña: 12345678")
        print(f"   Rol: coordinador")

    except Exception as e:
        print(f"❌ Error al crear coordinador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_coordinador_user()
