#!/usr/bin/env python3
"""
Script para probar diferentes contraseñas para Juan Pérez.
"""

import requests

def test_login_juan():
    """Probar login con diferentes contraseñas."""
    base_url = "http://localhost:8000/api/v1"
    
    # Diferentes contraseñas a probar
    passwords = [
        "estudiante123",
        "123456",
        "password",
        "juan123",
        "alumno123",
        "2025010001"  # Su matrícula
    ]
    
    for password in passwords:
        login_data = {
            "username": "juan.perez@estudiante.edu",
            "password": password
        }
        
        try:
            login_response = requests.post(
                f"{base_url}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"Contraseña '{password}': {login_response.status_code}")
            
            if login_response.status_code == 200:
                print(f"✅ ¡Login exitoso con contraseña: {password}!")
                token_data = login_response.json()
                print(f"Token obtenido: {token_data.get('access_token', 'N/A')[:50]}...")
                return password
            else:
                print(f"❌ Falló: {login_response.json().get('detail', 'Error desconocido')}")
                
        except Exception as e:
            print(f"Error con contraseña '{password}': {e}")
    
    print("\n❌ Ninguna contraseña funcionó")
    return None

def test_login_with_matricula():
    """Probar login con matrícula en lugar de email."""
    base_url = "http://localhost:8000/api/v1"
    
    passwords = ["estudiante123", "123456", "2025010001"]
    
    print("\n🔄 Probando login con matrícula...")
    
    for password in passwords:
        login_data = {
            "username": "2025010001",  # Matrícula
            "password": password
        }
        
        try:
            login_response = requests.post(
                f"{base_url}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"Matrícula + '{password}': {login_response.status_code}")
            
            if login_response.status_code == 200:
                print(f"✅ ¡Login exitoso con matrícula y contraseña: {password}!")
                return password
            else:
                print(f"❌ Falló: {login_response.json().get('detail', 'Error desconocido')}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return None

if __name__ == "__main__":
    print("🧪 PROBANDO LOGIN DE JUAN PÉREZ")
    print("=" * 50)
    
    print("\n1️⃣ Probando con email...")
    password_email = test_login_juan()
    
    if not password_email:
        password_matricula = test_login_with_matricula()
        
        if not password_matricula:
            print("\n❌ No se pudo hacer login con Juan Pérez")
            print("Posibles soluciones:")
            print("1. Verificar que el usuario existe")
            print("2. Resetear la contraseña en la base de datos")
            print("3. Crear el usuario nuevamente")
    
    print("\n🎉 PRUEBA COMPLETADA")
