#!/usr/bin/env python3
"""
Script para crear o actualizar el usuario administrador principal del sistema.

Uso:
    python scripts/create_admin_user.py
"""

import os
import sys

from sqlalchemy.exc import SQLAlchemyError

# Agregar el directorio raíz del proyecto al PYTHONPATH para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal  # noqa: E402
from app.models.persona import Persona  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402

ADMIN_EMAIL = "admin@uabc.edu.mx"
ADMIN_PASSWORD = "admin123"


def create_or_update_admin():
    """Crea el usuario admin si no existe o actualiza su contraseña."""
    db = SessionLocal()
    try:
        admin_user = (
            db.query(Persona)
            .filter(Persona.correo_institucional == ADMIN_EMAIL)
            .first()
        )

        if admin_user:
            admin_user.hashed_password = get_password_hash(ADMIN_PASSWORD)
            admin_user.rol = "admin"
            admin_user.is_active = True
            db.commit()

            print("ℹ️  El usuario administrador ya existía; contraseña actualizada.")
            print(f"    Email: {ADMIN_EMAIL}")
            print(f"    Nueva contraseña: {ADMIN_PASSWORD}")
            return

        admin_user = Persona(
            sexo="no_decir",
            genero="no_decir",
            edad=30,
            estado_civil="no_decir",
            religion=None,
            trabaja=False,
            lugar_trabajo=None,
            lugar_origen="Tijuana, BC",
            colonia_residencia_actual="Campus UABC",
            celular="6640000000",
            correo_institucional=ADMIN_EMAIL,
            discapacidad=None,
            observaciones="Usuario administrador creado por script",
            matricula="ADMIN001",
            semestre=None,
            numero_hijos=0,
            grupo_etnico=None,
            rol="admin",
            is_active=True,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            cohorte_ano=None,
            cohorte_periodo=1,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("✅ Usuario administrador creado correctamente.")
        print(f"    ID: {admin_user.id}")
        print(f"    Email: {ADMIN_EMAIL}")
        print(f"    Contraseña: {ADMIN_PASSWORD}")
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"❌ Error al crear/actualizar el usuario admin: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    create_or_update_admin()
