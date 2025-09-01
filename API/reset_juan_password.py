#!/usr/bin/env python3
"""
Script para resetear la contraseña de Juan Pérez.
"""

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.persona import Persona
from app.core.security import get_password_hash

def reset_juan_password():
    """Resetear la contraseña de Juan Pérez."""
    db: Session = SessionLocal()
    
    try:
        # Buscar a Juan Pérez
        juan = db.query(Persona).filter(
            Persona.correo_institucional == "juan.perez@estudiante.edu"
        ).first()
        
        if not juan:
            print("❌ Juan Pérez no encontrado")
            return
        
        print(f"✅ Juan Pérez encontrado - ID: {juan.id}")
        print(f"Email: {juan.correo_institucional}")
        print(f"Rol: {juan.rol}")
        
        # Resetear contraseña
        nueva_password = "estudiante123"
        juan.hashed_password = get_password_hash(nueva_password)
        
        db.commit()
        
        print(f"✅ Contraseña reseteada exitosamente!")
        print(f"Nueva contraseña: {nueva_password}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_juan_password()
