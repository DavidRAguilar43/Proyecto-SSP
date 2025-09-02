#!/usr/bin/env python3
"""
Script para probar los endpoints que están fallando con 422.
"""

import requests
import json
import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:8000/api/v1"

def test_login():
    """Probar el login para obtener un token"""
    login_data = {
        "username": "admin@sistema.edu",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error en login: {e}")
        return None

def test_cohortes_activas(token):
    """Probar el endpoint de cohortes activas"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/cohortes/activas", headers=headers)
        print(f"\nCohortes activas status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Cohortes encontradas: {len(data)}")
            for cohorte in data:
                print(f"  - {cohorte.get('nombre', 'Sin nombre')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error en cohortes activas: {e}")

def test_mi_perfil_get(token):
    """Probar obtener mi perfil"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/personas/mi-perfil", headers=headers)
        print(f"\nMi perfil GET status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Perfil obtenido: {data.get('correo_institucional', 'Sin correo')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error en mi perfil GET: {e}")

def test_mi_perfil_put(token):
    """Probar actualizar mi perfil con datos mínimos"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Datos mínimos para actualizar
    update_data = {
        "edad": 25
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/personas/mi-perfil", 
            headers=headers,
            json=update_data
        )
        print(f"\nMi perfil PUT status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Perfil actualizado: {data.get('correo_institucional', 'Sin correo')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error en mi perfil PUT: {e}")

def main():
    """Función principal"""
    print("🧪 Probando endpoints con errores 422...")
    
    # Obtener token
    token = test_login()
    if not token:
        print("❌ No se pudo obtener token. Verifica que la API esté corriendo.")
        return
    
    print(f"✅ Token obtenido: {token[:20]}...")
    
    # Probar endpoints
    test_cohortes_activas(token)
    test_mi_perfil_get(token)
    test_mi_perfil_put(token)

if __name__ == "__main__":
    main()
