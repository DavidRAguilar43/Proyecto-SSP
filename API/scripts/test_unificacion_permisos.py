#!/usr/bin/env python3
"""
Script de pruebas para validar la unificación de permisos de usuarios finales.

Este script verifica que docentes y personal tengan exactamente los mismos
permisos que alumnos, y que solo admin/coordinador tengan privilegios administrativos.
"""

import requests
import json
from typing import Dict, Any, List

# Configuración
BASE_URL = "http://localhost:8000"
TEST_USERS = {
    "admin": {"email": "admin@uabc.edu.mx", "password": "12345678"},
    "coordinador": {"email": "coordinador@uabc.edu.mx", "password": "12345678"},
    "personal": {"email": "personal@uabc.edu.mx", "password": "12345678"},
    "docente": {"email": "docente@uabc.edu.mx", "password": "12345678"},
    "alumno": {"email": "alumno@uabc.edu.mx", "password": "12345678"}
}

class PermissionTester:
    def __init__(self):
        self.tokens = {}
        self.results = []
    
    def login_user(self, role: str) -> str:
        """Obtener token de autenticación para un usuario."""
        user_data = TEST_USERS[role]
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": user_data["email"],
                "password": user_data["password"]
            }
        )
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            self.tokens[role] = token
            return token
        else:
            raise Exception(f"No se pudo autenticar como {role}: {response.text}")
    
    def make_request(self, role: str, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Hacer una petición HTTP autenticada."""
        if role not in self.tokens:
            self.login_user(role)
        
        headers = {"Authorization": f"Bearer {self.tokens[role]}"}
        
        if method.upper() == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        elif method.upper() == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data)
        elif method.upper() == "PUT":
            response = requests.put(f"{BASE_URL}{endpoint}", headers=headers, json=data)
        else:
            raise ValueError(f"Método HTTP no soportado: {method}")
        
        return {
            "status_code": response.status_code,
            "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
    
    def test_endpoint_access(self, endpoint: str, method: str = "GET", expected_access: Dict[str, bool] = None, data: Dict = None):
        """Probar acceso a un endpoint para todos los roles."""
        print(f"\n🔍 Probando {method} {endpoint}")
        
        for role in TEST_USERS.keys():
            try:
                result = self.make_request(role, method, endpoint, data)
                status = result["status_code"]
                
                # Determinar si el acceso fue exitoso
                access_granted = status in [200, 201, 204]
                
                # Verificar si coincide con lo esperado
                if expected_access and role in expected_access:
                    expected = expected_access[role]
                    status_icon = "✅" if access_granted == expected else "❌"
                else:
                    status_icon = "ℹ️"
                
                print(f"  {status_icon} {role.upper()}: {status} - {'Acceso permitido' if access_granted else 'Acceso denegado'}")
                
                self.results.append({
                    "endpoint": endpoint,
                    "method": method,
                    "role": role,
                    "status_code": status,
                    "access_granted": access_granted,
                    "expected": expected_access.get(role) if expected_access else None
                })
                
            except Exception as e:
                print(f"  ❌ {role.upper()}: Error - {str(e)}")
                self.results.append({
                    "endpoint": endpoint,
                    "method": method,
                    "role": role,
                    "error": str(e),
                    "access_granted": False
                })
    
    def run_tests(self):
        """Ejecutar todas las pruebas de permisos."""
        print("🚀 Iniciando pruebas de unificación de permisos")
        print("=" * 60)
        
        # 1. Probar acceso a perfil propio (todos deberían tener acceso)
        self.test_endpoint_access(
            "/personas/mi-perfil",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": True,
                "docente": True,
                "alumno": True
            }
        )
        
        # 2. Probar acceso a reportes psicopedagógicos (solo admin/coordinador)
        self.test_endpoint_access(
            "/cuestionario-psicopedagogico/reportes",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": False,  # Ya no debe tener acceso
                "docente": False,
                "alumno": False
            }
        )
        
        # 3. Probar acceso a estudiantes con cuestionarios (solo admin/coordinador)
        self.test_endpoint_access(
            "/cuestionario-psicopedagogico/estudiantes-con-cuestionarios",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": False,  # Ya no debe tener acceso
                "docente": False,
                "alumno": False
            }
        )
        
        # 4. Probar acceso a solicitudes de citas (solo admin/coordinador)
        self.test_endpoint_access(
            "/citas/solicitudes",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": False,  # Ya no debe tener acceso
                "docente": False,
                "alumno": False
            }
        )
        
        # 5. Probar acceso a estadísticas de citas (solo admin/coordinador)
        self.test_endpoint_access(
            "/citas/estadisticas",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": False,  # Ya no debe tener acceso
                "docente": False,
                "alumno": False
            }
        )
        
        # 6. Probar acceso a cuestionarios (usuarios finales)
        self.test_endpoint_access(
            "/cuestionario/activos",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": True,  # Debe tener acceso como usuario final
                "docente": True,   # Debe tener acceso como usuario final
                "alumno": True     # Debe tener acceso como usuario final
            }
        )
        
        # 7. Probar acceso a grupos (usuarios finales)
        self.test_endpoint_access(
            "/grupo/activos",
            expected_access={
                "admin": True,
                "coordinador": True,
                "personal": True,  # Debe tener acceso como usuario final
                "docente": True,   # Debe tener acceso como usuario final
                "alumno": True     # Debe tener acceso como usuario final
            }
        )
    
    def generate_report(self):
        """Generar reporte de resultados."""
        print("\n" + "=" * 60)
        print("📊 REPORTE DE RESULTADOS")
        print("=" * 60)
        
        # Contar éxitos y fallos
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r.get("expected") is None or r.get("access_granted") == r.get("expected"))
        failed_tests = total_tests - successful_tests
        
        print(f"Total de pruebas: {total_tests}")
        print(f"Exitosas: {successful_tests}")
        print(f"Fallidas: {failed_tests}")
        
        if failed_tests > 0:
            print("\n❌ PRUEBAS FALLIDAS:")
            for result in self.results:
                if result.get("expected") is not None and result.get("access_granted") != result.get("expected"):
                    print(f"  - {result['role'].upper()} en {result['endpoint']}: "
                          f"Esperado {result['expected']}, obtuvo {result['access_granted']}")
        
        # Verificar unificación de usuarios finales
        print("\n🔍 VERIFICACIÓN DE UNIFICACIÓN:")
        end_user_roles = ["personal", "docente", "alumno"]
        
        for endpoint in set(r["endpoint"] for r in self.results):
            endpoint_results = [r for r in self.results if r["endpoint"] == endpoint]
            end_user_results = [r for r in endpoint_results if r["role"] in end_user_roles]
            
            if len(end_user_results) >= 2:
                access_levels = [r.get("access_granted", False) for r in end_user_results]
                if len(set(access_levels)) == 1:
                    print(f"  ✅ {endpoint}: Usuarios finales tienen permisos unificados")
                else:
                    print(f"  ❌ {endpoint}: Usuarios finales tienen permisos diferentes")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = PermissionTester()
    
    try:
        tester.run_tests()
        success = tester.generate_report()
        
        if success:
            print("\n🎉 ¡Todas las pruebas pasaron! La unificación de permisos fue exitosa.")
        else:
            print("\n⚠️  Algunas pruebas fallaron. Revisar la implementación.")
            
    except Exception as e:
        print(f"\n💥 Error durante las pruebas: {str(e)}")
        print("Asegúrate de que el servidor esté ejecutándose y los usuarios de prueba existan.")
