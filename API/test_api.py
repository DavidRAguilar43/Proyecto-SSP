#!/usr/bin/env python3
"""
Script para probar el endpoint de personas con autenticación.
"""

import requests
import json

def test_personas_endpoint():
    """Probar el endpoint de personas."""
    base_url = "http://localhost:8000/api/v1"
    
    # Primero hacer login
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
            print(f"Error en login: {login_response.status_code}")
            print(login_response.text)
            return
        
        token_data = login_response.json()
        token = token_data.get("access_token")
        
        if not token:
            print("No se pudo obtener el token")
            return
        
        print("Login exitoso!")
        
        # Ahora probar el endpoint de personas
        headers = {"Authorization": f"Bearer {token}"}
        personas_response = requests.get(f"{base_url}/personas/", headers=headers)
        
        print(f"Status code: {personas_response.status_code}")
        
        if personas_response.status_code == 200:
            personas = personas_response.json()
            print(f"Se obtuvieron {len(personas)} personas:")
            for persona in personas:
                print(f"- {persona.get('correo_institucional')} ({persona.get('rol')})")
        else:
            print(f"Error: {personas_response.text}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

if __name__ == "__main__":
    test_personas_endpoint()
