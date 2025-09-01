#!/usr/bin/env python3
"""
Script rápido para probar las rutas específicas.
"""

import requests

def test_routes():
    """Probar rutas sin autenticación primero"""
    base_url = "http://localhost:8000/api/v1"
    
    print("🧪 Probando rutas...")
    
    # Probar ruta de cohortes activas (debería dar 401/403, no 422)
    try:
        response = requests.get(f"{base_url}/cohortes/activas")
        print(f"GET /cohortes/activas: {response.status_code}")
        if response.status_code == 422:
            print("❌ ERROR: Aún hay conflicto de rutas en cohortes")
        elif response.status_code in [401, 403]:
            print("✅ OK: Ruta encontrada (falta autenticación)")
    except Exception as e:
        print(f"Error: {e}")
    
    # Probar ruta de mi perfil (debería dar 401/403, no 422)
    try:
        response = requests.get(f"{base_url}/personas/mi-perfil")
        print(f"GET /personas/mi-perfil: {response.status_code}")
        if response.status_code == 422:
            print("❌ ERROR: Aún hay conflicto de rutas en personas")
        elif response.status_code in [401, 403]:
            print("✅ OK: Ruta encontrada (falta autenticación)")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_routes()
