#!/usr/bin/env python3
"""
Script para probar el login y funcionalidad del rol coordinador.
"""

import requests
import json

def test_coordinador_login():
    """Probar login como coordinador."""
    print("🔍 Probando login como coordinador...")
    
    login_data = {
        'username': 'coordinador@uabc.edu.mx',
        'password': '12345678'
    }

    try:
        # Login
        response = requests.post('http://localhost:8000/auth/login', data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            print('✅ Login exitoso como coordinador')
            print(f'Token: {token[:50]}...')
            
            # Obtener información del usuario actual
            headers = {'Authorization': f'Bearer {token}'}
            user_response = requests.get('http://localhost:8000/auth/me', headers=headers)
            if user_response.status_code == 200:
                user_data = user_response.json()
                print(f'✅ Usuario actual: {user_data["correo_institucional"]} - Rol: {user_data["rol"]}')
                
                # Probar acceso a endpoints administrativos
                test_admin_endpoints(headers)
                
                return token
            else:
                print(f'❌ Error obteniendo usuario: {user_response.status_code}')
        else:
            print(f'❌ Error en login: {response.status_code} - {response.text}')
            
    except Exception as e:
        print(f'❌ Error de conexión: {e}')
        print('Asegúrate de que el servidor API esté ejecutándose en http://localhost:8000')
    
    return None

def test_admin_endpoints(headers):
    """Probar acceso a endpoints administrativos."""
    print("\n🔍 Probando acceso a endpoints administrativos...")
    
    endpoints = [
        ('GET', '/personas/', 'Listar personas'),
        ('GET', '/catalogos/religiones', 'Listar religiones'),
        ('GET', '/programas-educativos/', 'Listar programas educativos'),
        ('GET', '/unidades/', 'Listar unidades'),
    ]
    
    for method, endpoint, description in endpoints:
        try:
            if method == 'GET':
                response = requests.get(f'http://localhost:8000{endpoint}', headers=headers)
            
            if response.status_code == 200:
                print(f'✅ {description}: Acceso permitido')
            elif response.status_code == 403:
                print(f'❌ {description}: Acceso denegado (403)')
            else:
                print(f'⚠️ {description}: Respuesta inesperada ({response.status_code})')
                
        except Exception as e:
            print(f'❌ {description}: Error - {e}')

def test_deletion_restriction(headers):
    """Probar que coordinador no puede eliminar."""
    print("\n🔍 Probando restricciones de eliminación...")
    
    # Intentar eliminar algo (esto debería fallar)
    try:
        # Primero obtener una lista para tener un ID válido
        response = requests.get('http://localhost:8000/catalogos/religiones', headers=headers)
        if response.status_code == 200:
            religiones = response.json()
            if religiones:
                religion_id = religiones[0]['id']
                
                # Intentar eliminar
                delete_response = requests.delete(f'http://localhost:8000/catalogos/religiones/{religion_id}', headers=headers)
                if delete_response.status_code == 403:
                    print('✅ Restricción de eliminación funcionando correctamente (403)')
                else:
                    print(f'❌ Restricción de eliminación NO funcionando: {delete_response.status_code}')
            else:
                print('⚠️ No hay religiones para probar eliminación')
        else:
            print(f'❌ No se pudo obtener lista de religiones: {response.status_code}')
            
    except Exception as e:
        print(f'❌ Error probando eliminación: {e}')

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 PRUEBAS DEL SISTEMA DE ROLES - COORDINADOR")
    print("=" * 60)
    
    token = test_coordinador_login()
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        test_deletion_restriction(headers)
    
    print("\n" + "=" * 60)
    print("🏁 Pruebas completadas")
    print("=" * 60)
