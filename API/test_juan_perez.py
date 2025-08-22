#!/usr/bin/env python3
"""
Script para probar el cuestionario psicopedagógico con Juan Pérez.
"""

import requests
import json

def test_juan_perez_cuestionario():
    """Probar el cuestionario con Juan Pérez (estudiante)."""
    base_url = "http://localhost:8000/api/v1"
    
    # Login como Juan Pérez
    login_data = {
        "username": "juan.perez@estudiante.edu",
        "password": "alumno123"
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
        
        print("✅ Login exitoso como Juan Pérez!")
        
        # Obtener información del usuario actual
        headers = {"Authorization": f"Bearer {token}"}
        user_response = requests.get(f"{base_url}/auth/test-token", headers=headers)
        
        if user_response.status_code == 200:
            user_data = user_response.json()
            print(f"Usuario: {user_data['correo_institucional']}")
            print(f"Rol: {user_data['rol']}")
            print(f"ID: {user_data['id']}")
            user_id = user_data['id']
        else:
            print("Error obteniendo información del usuario")
            return
        
        # Verificar estado del cuestionario
        estado_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/estudiante/{user_id}", headers=headers)
        
        print(f"\n📋 Estado del cuestionario: {estado_response.status_code}")
        if estado_response.status_code == 200:
            estado = estado_response.json()
            print(f"Completado: {estado['completado']}")
        
        # Obtener preguntas
        preguntas_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/preguntas", headers=headers)
        
        print(f"\n❓ Preguntas: {preguntas_response.status_code}")
        if preguntas_response.status_code == 200:
            preguntas = preguntas_response.json()
            print("Preguntas disponibles:")
            for key, pregunta in preguntas.items():
                print(f"- {key}: {pregunta}")
        
        # Completar cuestionario
        respuestas_data = {
            "respuestas": {
                "pregunta_1": "Regular",
                "pregunta_2": "Tengo dificultades para concentrarme durante las clases virtuales y me cuesta organizar mi tiempo de estudio. También siento que no entiendo bien algunos conceptos matemáticos.",
                "pregunta_3": "Necesito apoyo en técnicas de estudio y manejo del tiempo. También me gustaría recibir tutorías en matemáticas y orientación sobre cómo mejorar mi concentración durante las clases en línea."
            },
            "id_persona": user_id
        }
        
        completar_response = requests.post(
            f"{base_url}/cuestionario-psicopedagogico/completar",
            json=respuestas_data,
            headers=headers
        )
        
        print(f"\n📝 Completar cuestionario: {completar_response.status_code}")
        
        if completar_response.status_code == 200:
            resultado = completar_response.json()
            print("✅ Cuestionario completado exitosamente!")
            print(f"ID Cuestionario: {resultado['id_cuestionario']}")
            print(f"Reporte generado: {'Sí' if resultado.get('reporte_ia') else 'No'}")
            if resultado.get('reporte_ia'):
                print(f"Reporte (primeros 200 caracteres): {resultado['reporte_ia'][:200]}...")
        else:
            print(f"❌ Error completando cuestionario: {completar_response.text}")
            
        # Verificar estado después de completar
        estado_response2 = requests.get(f"{base_url}/cuestionario-psicopedagogico/estudiante/{user_id}", headers=headers)
        
        print(f"\n📋 Estado después de completar: {estado_response2.status_code}")
        if estado_response2.status_code == 200:
            estado2 = estado_response2.json()
            print(f"Completado: {estado2['completado']}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

def test_admin_ver_reportes():
    """Probar que el admin puede ver los reportes."""
    base_url = "http://localhost:8000/api/v1"
    
    # Login como admin
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
            print(f"Error en login admin: {login_response.status_code}")
            return
        
        token_data = login_response.json()
        token = token_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\n👨‍💼 Login exitoso como Admin!")
        
        # Obtener estudiantes con cuestionarios
        estudiantes_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/estudiantes-con-cuestionarios", headers=headers)
        
        print(f"\n👥 Estudiantes con cuestionarios: {estudiantes_response.status_code}")
        if estudiantes_response.status_code == 200:
            estudiantes = estudiantes_response.json()
            print(f"Cantidad de estudiantes: {len(estudiantes)}")
            for estudiante in estudiantes:
                print(f"- {estudiante['nombre_completo']} ({estudiante['correo_institucional']})")
                print(f"  Completado: {estudiante['fecha_completado']}")
        
        # Obtener reporte específico de Juan Pérez (ID 2)
        reporte_response = requests.get(f"{base_url}/cuestionario-psicopedagogico/reporte/2", headers=headers)
        
        print(f"\n📊 Reporte de Juan Pérez: {reporte_response.status_code}")
        if reporte_response.status_code == 200:
            reporte = reporte_response.json()
            print("✅ Reporte obtenido exitosamente!")
            print(f"ID Cuestionario: {reporte['id_cuestionario']}")
            print(f"Fecha completado: {reporte['fecha_completado']}")
            print(f"Reporte IA (primeros 300 caracteres): {reporte['reporte_ia'][:300]}...")
        else:
            print(f"❌ Error obteniendo reporte: {reporte_response.text}")
            
    except Exception as e:
        print(f"Error en la petición admin: {e}")

if __name__ == "__main__":
    print("🧪 PRUEBA COMPLETA DEL SISTEMA DE CUESTIONARIO PSICOPEDAGÓGICO")
    print("=" * 70)
    
    print("\n1️⃣ PRUEBA COMO ESTUDIANTE (Juan Pérez)")
    print("-" * 50)
    test_juan_perez_cuestionario()
    
    print("\n2️⃣ PRUEBA COMO ADMIN")
    print("-" * 50)
    test_admin_ver_reportes()
    
    print("\n🎉 PRUEBAS COMPLETADAS")
    print("=" * 70)
