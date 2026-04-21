#!/usr/bin/env python3
"""
Script para probar la conexión a la base de datos y ver las users registradas.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.persona import User

def main():
    """Función principal para probar la base de datos."""
    db: Session = SessionLocal()
    
    try:
        # Obtener todas las users
        users = db.query(User).all()
        
        print(f"Total de users en la base de datos: {len(users)}")
        print("-" * 50)
        
        for persona in users:
            print(f"ID: {persona.id}")
            print(f"Correo: {persona.correo_institucional}")
            print(f"Rol: {persona.rol}")
            print(f"Estado Civil: {persona.estado_civil}")
            print(f"Activo: {persona.is_active}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error al consultar la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
