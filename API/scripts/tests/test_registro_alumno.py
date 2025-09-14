#!/usr/bin/env python3
"""
Script para probar el registro de alumno.
"""

import requests
import json

def test_registro_alumno():
    """Probar el registro de un nuevo alumno."""
    base_url = "http://localhost:8000/api/v1"
    
    # Datos del nuevo alumno (con todos los campos requeridos)
    alumno_data = {
        "sexo": "masculino",
        "genero": "masculino",
        "edad": 19,
        "estado_civil": "soltero",
        "religion": "",
        "trabaja": False,
        "lugar_trabajo": "",
        "lugar_origen": "Ciudad de México",
        "colonia_residencia_actual": "Centro",
        "celular": "5551234567",
        "correo_institucional": "nuevo.alumno@estudiante.edu",
        "discapacidad": "",
        "observaciones": "",
        "matricula": "",
        "semestre": 1,
        "numero_hijos": 0,
        "grupo_etnico": "",
        "rol": "alumno",
        "cohorte_id": None,
        "password": "alumno123",
        "programas_ids": [],
        "grupos_ids": []
    }
    
    try:
        # Probar registro
        print("🧪 Probando registro de alumno...")
        print(f"URL: {base_url}/personas/registro-alumno/")
        print(f"Datos: {json.dumps(alumno_data, indent=2)}")
        
        response = requests.post(
            f"{base_url}/personas/registro-alumno/",
            json=alumno_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Registro exitoso!")
            print(f"ID: {resultado.get('id')}")
            print(f"Email: {resultado.get('correo_institucional')}")
            print(f"Rol: {resultado.get('rol')}")
            print(f"Matrícula: {resultado.get('matricula')}")
            
            # Probar login con el nuevo usuario
            print("\n🔐 Probando login con el nuevo usuario...")
            login_data = {
                "username": alumno_data["correo_institucional"],
                "password": alumno_data["password"]
            }
            
            login_response = requests.post(
                f"{base_url}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if login_response.status_code == 200:
                print("✅ Login exitoso con el nuevo usuario!")
                token_data = login_response.json()
                print(f"Token obtenido: {token_data.get('access_token', 'N/A')[:50]}...")
            else:
                print(f"❌ Error en login: {login_response.status_code}")
                print(login_response.text)
                
        elif response.status_code == 400:
            error_data = response.json()
            print(f"❌ Error 400 - Bad Request:")
            print(f"Detail: {error_data.get('detail', 'No detail provided')}")
            
            if 'validation_error' in str(error_data):
                print("Posibles problemas de validación:")
                print("- Correo ya existe")
                print("- Campos requeridos faltantes")
                print("- Formato de datos incorrecto")
                
        elif response.status_code == 405:
            print("❌ Error 405 - Method Not Allowed")
            print("El endpoint no acepta POST o no existe")
            print("Verificar:")
            print("- URL correcta")
            print("- Método HTTP correcto")
            print("- Endpoint registrado en el router")
            
        elif response.status_code == 422:
            error_data = response.json()
            print(f"❌ Error 422 - Validation Error:")
            print(json.dumps(error_data, indent=2))
            
        else:
            print(f"❌ Error {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión - ¿Está el servidor corriendo en puerto 8000?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_endpoint_exists():
    """Verificar si el endpoint existe."""
    base_url = "http://localhost:8000"
    
    try:
        # Probar si el servidor responde
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ Servidor funcionando - Documentación disponible en /docs")
        else:
            print(f"⚠️ Servidor responde pero /docs no disponible: {response.status_code}")
            
        # Probar endpoint específico con GET (debería dar 405)
        response = requests.get(f"{base_url}/api/v1/personas/registro-alumno/")
        print(f"GET /personas/registro-alumno/: {response.status_code}")
        
        # Probar endpoint sin barra final
        response = requests.get(f"{base_url}/api/v1/personas/registro-alumno")
        print(f"GET /personas/registro-alumno: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Error verificando endpoint: {e}")

if __name__ == "__main__":
    print("🧪 PRUEBA DE REGISTRO DE ALUMNO")
    print("=" * 50)
    
    print("\n1️⃣ Verificando servidor y endpoints...")
    test_endpoint_exists()
    
    print("\n2️⃣ Probando registro de alumno...")
    test_registro_alumno()
    
    print("\n🎉 PRUEBA COMPLETADA")
    print("=" * 50)
