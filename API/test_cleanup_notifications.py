#!/usr/bin/env python3
"""
Script de prueba para limpiar notificaciones obsoletas.
Este script debe ejecutarse después de los cambios para resolver problemas de integridad.
"""

import requests
import sys

def test_cleanup_notifications():
    """Probar el endpoint de limpieza de notificaciones."""
    
    base_url = 'http://localhost:8000/api/v1'
    
    # Datos de login del admin
    login_data = {
        'username': 'admin@uabc.edu.mx',
        'password': '12345678'
    }

    try:
        # Login first
        print("🔐 Logging in as admin...")
        response = requests.post(f'{base_url}/auth/login', data=login_data)
        if response.status_code == 200:
            token = response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            print("✅ Admin login successful")
            
            print("\n🧹 Testing notification cleanup...")
            # Llamar al endpoint de limpieza
            response = requests.post(f'{base_url}/personas/limpiar-notificaciones-obsoletas', 
                                   headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Cleanup successful!")
                print(f"   Message: {result['message']}")
                print(f"   Notifications deleted: {result['notificaciones_eliminadas']}")
            else:
                print(f"❌ Cleanup failed with status: {response.status_code}")
                print(f"   Response: {response.text}")
                
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("   Make sure the server is running on http://localhost:8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🧪 Testing notification cleanup endpoint...")
    test_cleanup_notifications()
    print("\n✅ Test completed!")
