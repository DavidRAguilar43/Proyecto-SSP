#!/usr/bin/env python3
"""
Script para probar que los permisos de roles funcionen correctamente.
Verifica que solo admin pueda usar bulk delete y coordinador no pueda.
"""

import sys
import os
import requests
import json
from typing import Dict, List, Tuple

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# URL base de la API
BASE_URL = "http://localhost:8000/api/v1"

def get_auth_token(username: str, password: str) -> str:
    """Obtener token de autenticación para un usuario específico."""
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Error al obtener token para {username}: {response.status_code} - {response.text}")

def test_bulk_delete_permission(endpoint: str, token: str, expected_status: int, role: str) -> Dict:
    """Probar permisos de bulk delete para un rol específico."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {"ids": [9999]}  # ID que no existe para evitar eliminar datos reales
    
    print(f"   🧪 Probando {endpoint} con rol {role}")
    
    response = requests.post(
        f"{BASE_URL}{endpoint}",
        json=data,
        headers=headers
    )
    
    result = {
        "endpoint": endpoint,
        "role": role,
        "status_code": response.status_code,
        "expected_status": expected_status,
        "success": response.status_code == expected_status,
        "response": None,
        "error": None
    }
    
    try:
        result["response"] = response.json()
    except:
        result["response"] = response.text
    
    if not result["success"]:
        result["error"] = f"Esperado {expected_status}, obtuvo {response.status_code}"
    
    return result

def main():
    """Función principal para ejecutar todas las pruebas de permisos."""
    print("🔐 Iniciando pruebas de permisos de roles para bulk delete...")
    
    try:
        # Definir usuarios de prueba
        test_users = [
            ("admin@uabc.edu.mx", "12345678", "admin", 200),  # Admin debe poder eliminar
            # Nota: Necesitarías crear un usuario coordinador para esta prueba
            # ("coordinador@uabc.edu.mx", "12345678", "coordinador", 403),  # Coordinador NO debe poder eliminar
        ]
        
        # Endpoints de bulk delete a probar
        bulk_delete_endpoints = [
            "/personas/bulk-delete",
            "/atenciones/bulk-delete",
            "/grupos/bulk-delete",
            "/programas-educativos/bulk-delete",
            "/catalogos/religiones/bulk-delete",
            "/citas/bulk-delete",
        ]
        
        all_results = []
        
        for username, password, role, expected_status in test_users:
            print(f"\n👤 Probando permisos para rol: {role}")
            
            try:
                # Obtener token para el usuario
                token = get_auth_token(username, password)
                print(f"   ✅ Token obtenido para {username}")
                
                # Probar cada endpoint
                for endpoint in bulk_delete_endpoints:
                    result = test_bulk_delete_permission(endpoint, token, expected_status, role)
                    all_results.append(result)
                    
                    if result["success"]:
                        print(f"      ✅ {endpoint}: Permisos correctos")
                    else:
                        print(f"      ❌ {endpoint}: {result['error']}")
                        
            except Exception as e:
                print(f"   ❌ Error con usuario {username}: {str(e)}")
        
        # Resumen de resultados
        print("\n" + "="*60)
        print("📊 RESUMEN DE PRUEBAS DE PERMISOS")
        print("="*60)
        
        successful = sum(1 for r in all_results if r["success"])
        total = len(all_results)
        
        print(f"Total de pruebas de permisos: {total}")
        print(f"Exitosas: {successful}")
        print(f"Fallidas: {total - successful}")
        
        # Agrupar por rol
        roles = {}
        for result in all_results:
            role = result["role"]
            if role not in roles:
                roles[role] = {"total": 0, "success": 0}
            roles[role]["total"] += 1
            if result["success"]:
                roles[role]["success"] += 1
        
        print("\n📋 Resultados por rol:")
        for role, stats in roles.items():
            print(f"   {role}: {stats['success']}/{stats['total']} exitosas")
        
        if successful == total:
            print("\n🎉 ¡Todos los permisos funcionan correctamente!")
        else:
            print(f"\n⚠️  {total - successful} pruebas de permisos fallaron.")
            
            print("\n❌ PRUEBAS FALLIDAS:")
            for result in all_results:
                if not result["success"]:
                    print(f"   - {result['role']} en {result['endpoint']}: {result['error']}")
        
        # Guardar resultados detallados
        with open("role_permissions_test_results.json", "w") as f:
            json.dump(all_results, f, indent=2)
        
        print(f"\n📄 Resultados detallados guardados en: role_permissions_test_results.json")
        
        # Instrucciones adicionales
        print("\n📝 NOTAS:")
        print("   - Para probar completamente, crea un usuario coordinador en la base de datos")
        print("   - Verifica que coordinador tenga acceso a crear/editar pero NO a eliminar")
        print("   - Los endpoints deben retornar 403 (Forbidden) para coordinador en bulk delete")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {str(e)}")
        return 1
    
    return 0 if successful == total else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
