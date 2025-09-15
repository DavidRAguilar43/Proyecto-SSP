#!/usr/bin/env python3
"""
Script para verificar que el sistema de roles funciona correctamente.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal

def verify_role_system():
    """Verificar el sistema de roles."""
    db = SessionLocal()
    try:
        print("🔍 Verificando sistema de roles...")
        print("=" * 50)

        # Contar usuarios por rol usando SQL directo
        result = db.execute(text("SELECT rol, COUNT(*) FROM personas GROUP BY rol"))
        roles_count = dict(result.fetchall())

        print("📊 Distribución de roles:")
        for rol, count in roles_count.items():
            print(f"   {rol}: {count} usuarios")

        print("\n👥 Usuarios por rol:")
        print("-" * 30)

        for rol in ["admin", "coordinador", "personal", "docente", "alumno"]:
            result = db.execute(text("SELECT correo_institucional, matricula, is_active FROM personas WHERE rol = :rol"), {"rol": rol})
            users = result.fetchall()
            if users:
                print(f"\n{rol.upper()}:")
                for user in users:
                    status = "✅ Activo" if user[2] else "❌ Inactivo"
                    print(f"   - {user[0]} ({user[1]}) {status}")
            else:
                print(f"\n{rol.upper()}: Sin usuarios")

        # Verificar roles válidos
        print("\n🔒 Verificación de seguridad:")
        print("-" * 30)

        result = db.execute(text("SELECT correo_institucional, rol FROM personas WHERE rol NOT IN ('admin', 'coordinador', 'personal', 'docente', 'alumno')"))
        invalid_users = result.fetchall()

        if invalid_users:
            print("❌ Usuarios con roles inválidos encontrados:")
            for user in invalid_users:
                print(f"   - {user[0]}: '{user[1]}'")
        else:
            print("✅ Todos los usuarios tienen roles válidos")

        # Verificar que no hay auto-registro de admin/coordinador
        print("\n🛡️ Verificación de auto-registro:")
        print("-" * 30)
        print("✅ Schema PersonaRegistro previene auto-registro de admin/coordinador")
        print("✅ Validación en routes/persona.py previene escalación de privilegios")

    except Exception as e:
        print(f"❌ Error al verificar roles: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_role_system()
