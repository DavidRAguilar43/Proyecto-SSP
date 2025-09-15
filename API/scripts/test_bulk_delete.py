#!/usr/bin/env python3
"""
Script para probar la funcionalidad de bulk delete en todos los endpoints.
"""

import sys
import os
import requests
import json
from typing import Dict, List

# Agregar el directorio padre al path para importar módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# URL base de la API
BASE_URL = "http://localhost:8000/api/v1"

def get_auth_token() -> str:
    """Obtener token de autenticación para usuario admin."""
    login_data = {
        "username": "admin@uabc.edu.mx",
        "password": "12345678"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Error al obtener token: {response.status_code} - {response.text}")

def test_bulk_delete_endpoint(endpoint: str, test_ids: List[int], token: str) -> Dict:
    """Probar un endpoint de bulk delete específico."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {"ids": test_ids}
    
    print(f"\n🧪 Probando endpoint: {endpoint}")
    print(f"   IDs a eliminar: {test_ids}")
    
    response = requests.post(
        f"{BASE_URL}{endpoint}",
        json=data,
        headers=headers
    )
    
    result = {
        "endpoint": endpoint,
        "status_code": response.status_code,
        "success": response.status_code in [200, 201],
        "response": None,
        "error": None
    }
    
    try:
        result["response"] = response.json()
    except:
        result["response"] = response.text
    
    if not result["success"]:
        result["error"] = f"HTTP {response.status_code}: {response.text}"
    
    return result

def main():
    """Función principal para ejecutar todas las pruebas."""
    print("🚀 Iniciando pruebas de bulk delete...")
    
    try:
        # Obtener token de autenticación
        print("🔐 Obteniendo token de autenticación...")
        token = get_auth_token()
        print("✅ Token obtenido exitosamente")
        
        # Definir endpoints a probar con IDs de prueba (usar IDs que no existan)
        endpoints_to_test = [
            ("/personas/bulk-delete", [9999, 9998]),
            ("/atenciones/bulk-delete", [9999, 9998]),
            ("/grupos/bulk-delete", [9999, 9998]),
            ("/programas-educativos/bulk-delete", [9999, 9998]),
            ("/unidades/bulk-delete/", [9999, 9998]),  # Nota: este endpoint usa DELETE
            ("/catalogos/religiones/bulk-delete", [9999, 9998]),
            ("/catalogos/grupos-etnicos/bulk-delete", [9999, 9998]),
            ("/catalogos/discapacidades/bulk-delete", [9999, 9998]),
            ("/citas/bulk-delete", [9999, 9998]),
        ]
        
        results = []
        
        # Probar cada endpoint
        for endpoint, test_ids in endpoints_to_test:
            result = test_bulk_delete_endpoint(endpoint, test_ids, token)
            results.append(result)
            
            if result["success"]:
                print(f"   ✅ Éxito: {result['response']}")
            else:
                print(f"   ❌ Error: {result['error']}")
        
        # Resumen de resultados
        print("\n" + "="*60)
        print("📊 RESUMEN DE PRUEBAS")
        print("="*60)
        
        successful = sum(1 for r in results if r["success"])
        total = len(results)
        
        print(f"Total de endpoints probados: {total}")
        print(f"Exitosos: {successful}")
        print(f"Fallidos: {total - successful}")
        
        if successful == total:
            print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
        else:
            print(f"\n⚠️  {total - successful} pruebas fallaron. Revisar implementación.")
            
            print("\n❌ ENDPOINTS FALLIDOS:")
            for result in results:
                if not result["success"]:
                    print(f"   - {result['endpoint']}: {result['error']}")
        
        # Guardar resultados detallados
        with open("bulk_delete_test_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📄 Resultados detallados guardados en: bulk_delete_test_results.json")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {str(e)}")
        return 1
    
    return 0 if successful == total else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
