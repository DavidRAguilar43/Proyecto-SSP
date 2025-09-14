#!/usr/bin/env python3
"""
Script para verificar qué usuarios existen en la base de datos.
"""

import requests
import json

def verificar_usuarios():
    """Verificar usuarios existentes."""
    base_url = "http://localhost:8000/api/v1"
    
    # Login como admin
    login_data = {
        "username": "admin@sistema.edu",
        "password": "admin123"
    }
    
    try:
        # Login
        login_response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code != 200:
            print(f"Error en login admin: {login_response.status_code}")
            print(login_response.text)
            return
        
        token_data = login_response.json()
        token = token_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ Login exitoso como Admin!")
        
        # Obtener todas las personas
        personas_response = requests.get(f"{base_url}/personas/", headers=headers)
        
        print(f"\n👥 Personas en la base de datos: {personas_response.status_code}")
        if personas_response.status_code == 200:
            personas = personas_response.json()
            print(f"Total de personas: {len(personas)}")
            
            print("\n📋 Lista de usuarios:")
            for persona in personas:
                print(f"- ID: {persona['id']}")
                print(f"  Email: {persona['correo_institucional']}")
                print(f"  Rol: {persona['rol']}")
                print(f"  Matrícula: {persona.get('matricula', 'N/A')}")
                print("-" * 40)
        else:
            print(f"❌ Error obteniendo personas: {personas_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verificar_usuarios()
