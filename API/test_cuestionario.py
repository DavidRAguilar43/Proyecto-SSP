#!/usr/bin/env python3
"""
Script para probar el endpoint del cuestionario psicopedagógico.
"""

import requests
import json

def test_cuestionario_endpoint():
    """Probar el endpoint del cuestionario psicopedagógico."""
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
        
        # Probar endpoint de preguntas
        headers = {"Authorization": f"Bearer {token}"}
        preguntas_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/preguntas", headers=headers)
        
        print(f"Status code preguntas: {preguntas_response.status_code}")
        
        if preguntas_response.status_code == 200:
            preguntas = preguntas_response.json()
            print("Preguntas del cuestionario:")
            for key, pregunta in preguntas.items():
                print(f"- {key}: {pregunta}")
        else:
            print(f"Error obteniendo preguntas: {preguntas_response.text}")
            
        # Probar completar cuestionario (como Juan Pérez - ID 2)
        respuestas_data = {
            "respuestas": {
                "pregunta_1": "Regular",
                "pregunta_2": "Tengo dificultades para concentrarme durante las clases y me cuesta organizar mi tiempo de estudio.",
                "pregunta_3": "Necesito apoyo en técnicas de estudio y manejo del tiempo. También me gustaría recibir orientación sobre cómo mejorar mi concentración."
            },
            "id_persona": 2  # Juan Pérez
        }
        
        completar_response = requests.post(
            f"{base_url}/cuestionario-psicopedagogico/completar",
            json=respuestas_data,
            headers=headers
        )
        
        print(f"\nStatus code completar: {completar_response.status_code}")
        
        if completar_response.status_code == 200:
            resultado = completar_response.json()
            print("Cuestionario completado exitosamente:")
            print(json.dumps(resultado, indent=2))
        else:
            print(f"Error completando cuestionario: {completar_response.text}")
            
        # Probar obtener reporte (solo admin/personal)
        reporte_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/reporte/2", headers=headers)
        
        print(f"\nStatus code reporte: {reporte_response.status_code}")
        
        if reporte_response.status_code == 200:
            reporte = reporte_response.json()
            print("Reporte obtenido exitosamente:")
            print(f"ID Cuestionario: {reporte['id_cuestionario']}")
            print(f"Fecha completado: {reporte['fecha_completado']}")
            print(f"Reporte IA (primeros 200 caracteres): {reporte['reporte_ia'][:200]}...")
        else:
            print(f"Error obteniendo reporte: {reporte_response.text}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

if __name__ == "__main__":
    test_cuestionario_endpoint()
