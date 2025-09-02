#!/usr/bin/env python3
"""
Script para probar el sistema completo de citas.
"""

import requests
import json

def test_citas_system():
    """Probar el sistema completo de citas."""
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Login como Juan Pérez (alumno)
    print("🔐 1. Login como Juan Pérez (alumno)...")
    login_data = {
        "username": "juan.perez@estudiante.edu",
        "password": "alumno123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            alumno_token = token_data["access_token"]
            print("✅ Login exitoso como alumno")
            
            # Headers para requests autenticados
            alumno_headers = {
                "Authorization": f"Bearer {alumno_token}",
                "Content-Type": "application/json"
            }
            
            # 2. Solicitar una cita como alumno
            print("\n📅 2. Solicitando cita como alumno...")
            cita_data = {
                "tipo_cita": "psicologica",
                "motivo": "Necesito apoyo para manejar el estrés académico y mejorar mi concentración en los estudios. He estado sintiendo mucha ansiedad últimamente.",
                "fecha_propuesta_alumno": "2025-08-25T14:00:00",
                "observaciones_alumno": "Prefiero horarios por la tarde después de las 2 PM. Tengo clases en la mañana."
            }
            
            response = requests.post(
                f"{base_url}/citas/solicitar",
                json=cita_data,
                headers=alumno_headers
            )
            
            if response.status_code == 200:
                cita_creada = response.json()
                print("✅ Cita solicitada exitosamente!")
                print(f"   ID de cita: {cita_creada['id_cita']}")
                print(f"   Tipo: {cita_creada['tipo_cita']}")
                print(f"   Estado: {cita_creada['estado']}")
                cita_id = cita_creada['id_cita']
            else:
                print(f"❌ Error solicitando cita: {response.status_code}")
                print(response.text)
                return
            
            # 3. Ver mis citas como alumno
            print("\n📋 3. Consultando mis citas como alumno...")
            response = requests.get(
                f"{base_url}/citas/mis-citas",
                headers=alumno_headers
            )
            
            if response.status_code == 200:
                mis_citas = response.json()
                print(f"✅ Tengo {len(mis_citas)} cita(s)")
                for cita in mis_citas:
                    print(f"   - Cita {cita['id_cita']}: {cita['tipo_cita']} ({cita['estado']})")
            else:
                print(f"❌ Error consultando mis citas: {response.status_code}")
                print(response.text)
            
            # 4. Login como admin
            print("\n🔐 4. Login como admin...")
            admin_login_data = {
                "username": "admin@sistema.edu",
                "password": "admin123"
            }
            
            response = requests.post(
                f"{base_url}/auth/login",
                data=admin_login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                admin_token_data = response.json()
                admin_token = admin_token_data["access_token"]
                print("✅ Login exitoso como admin")
                
                admin_headers = {
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                }
                
                # 5. Ver solicitudes de citas como admin
                print("\n📊 5. Consultando solicitudes de citas como admin...")
                response = requests.get(
                    f"{base_url}/citas/solicitudes",
                    headers=admin_headers
                )
                
                if response.status_code == 200:
                    solicitudes = response.json()
                    print(f"✅ Hay {len(solicitudes)} solicitud(es) de citas")
                    for solicitud in solicitudes:
                        print(f"   - Solicitud {solicitud['id_cita']}: {solicitud['alumno_nombre']} ({solicitud['estado']})")
                        print(f"     Tipo: {solicitud['tipo_cita']}")
                        print(f"     Motivo: {solicitud['motivo'][:50]}...")
                else:
                    print(f"❌ Error consultando solicitudes: {response.status_code}")
                    print(response.text)
                
                # 6. Confirmar la cita como admin
                print(f"\n✅ 6. Confirmando cita {cita_id} como admin...")
                confirmacion_data = {
                    "estado": "confirmada",
                    "fecha_confirmada": "2025-08-25T15:00:00",
                    "observaciones_personal": "Cita confirmada para apoyo psicológico. Favor de llegar 10 minutos antes.",
                    "ubicacion": "Oficina de Servicios Estudiantiles, Cubículo 3"
                }
                
                response = requests.put(
                    f"{base_url}/citas/{cita_id}/confirmar",
                    json=confirmacion_data,
                    headers=admin_headers
                )
                
                if response.status_code == 200:
                    cita_confirmada = response.json()
                    print("✅ Cita confirmada exitosamente!")
                    print(f"   Estado: {cita_confirmada['estado']}")
                    print(f"   Fecha confirmada: {cita_confirmada['fecha_confirmada']}")
                    print(f"   Ubicación: {cita_confirmada['ubicacion']}")
                else:
                    print(f"❌ Error confirmando cita: {response.status_code}")
                    print(response.text)
                
                # 7. Ver estadísticas como admin
                print("\n📈 7. Consultando estadísticas como admin...")
                response = requests.get(
                    f"{base_url}/citas/estadisticas",
                    headers=admin_headers
                )
                
                if response.status_code == 200:
                    stats = response.json()
                    print("✅ Estadísticas de citas:")
                    print(f"   Total: {stats['total_solicitudes']}")
                    print(f"   Pendientes: {stats['pendientes']}")
                    print(f"   Confirmadas: {stats['confirmadas']}")
                    print(f"   Por tipo: {stats['por_tipo']}")
                else:
                    print(f"❌ Error consultando estadísticas: {response.status_code}")
                    print(response.text)
            
            else:
                print(f"❌ Error en login admin: {response.status_code}")
                print(response.text)
                return
            
            # 8. Ver notificaciones como alumno
            print("\n🔔 8. Consultando notificaciones como alumno...")
            response = requests.get(
                f"{base_url}/citas/notificaciones",
                headers=alumno_headers
            )
            
            if response.status_code == 200:
                notificaciones = response.json()
                print(f"✅ Tienes {len(notificaciones)} notificación(es)")
                for notif in notificaciones:
                    print(f"   - {notif['tipo_notificacion']}: {notif['mensaje']}")
                    if notif['fecha_cita']:
                        print(f"     Fecha: {notif['fecha_cita']}")
                    if notif['ubicacion']:
                        print(f"     Ubicación: {notif['ubicacion']}")
            else:
                print(f"❌ Error consultando notificaciones: {response.status_code}")
                print(response.text)
        
        else:
            print(f"❌ Error en login alumno: {response.status_code}")
            print(response.text)
            return
    
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión - ¿Está el servidor corriendo en puerto 8000?")
        return
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return
    
    print("\n🎉 ¡PRUEBA DEL SISTEMA DE CITAS COMPLETADA!")
    print("=" * 60)
    print("✅ Funcionalidades probadas:")
    print("   1. Solicitar cita como alumno")
    print("   2. Ver mis citas como alumno")
    print("   3. Ver solicitudes como admin/personal")
    print("   4. Confirmar cita como admin/personal")
    print("   5. Ver estadísticas como admin/personal")
    print("   6. Ver notificaciones como alumno")

if __name__ == "__main__":
    print("🚀 PRUEBA DEL SISTEMA COMPLETO DE CITAS")
    print("=" * 60)
    test_citas_system()
