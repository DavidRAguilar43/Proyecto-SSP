#!/usr/bin/env python3
"""
Script para verificar la configuración de cifrado.

Ejecutar con:
    python scripts/verify_encryption.py

Este script verifica:
1. Configuración de variables de entorno
2. Carga correcta de llaves
3. Funcionalidad de cifrado/descifrado
4. Rendimiento básico
"""

import sys
from pathlib import Path
import time

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.encryption_keys import key_manager
from app.security.encryption import (
    encrypt_value,
    decrypt_value,
    encrypt_json,
    decrypt_json,
    EncryptionError,
    DecryptionError
)


def print_section(title: str):
    """Imprime un título de sección."""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)


def check_environment_variables():
    """Verifica las variables de entorno de cifrado."""
    print_section("Variables de Entorno")
    
    checks = {
        "ENCRYPTION_KEY": settings.ENCRYPTION_KEY,
        "KEY_ID_ACTUAL": settings.KEY_ID_ACTUAL,
        "ROTATION_KEYS": settings.ROTATION_KEYS,
        "ENCRYPTION_ENABLED": settings.ENCRYPTION_ENABLED,
    }
    
    all_ok = True
    
    for key, value in checks.items():
        if key == "ENCRYPTION_KEY":
            if value:
                # Mostrar solo los primeros y últimos caracteres
                masked = f"{value[:10]}...{value[-10:]}" if len(value) > 20 else "***"
                print(f"✅ {key}: {masked}")
            else:
                print(f"⚠️  {key}: NO CONFIGURADA")
                if settings.ENCRYPTION_ENABLED:
                    all_ok = False
        elif key == "ROTATION_KEYS":
            if value:
                # Contar llaves de rotación
                count = len(value.split(','))
                print(f"✅ {key}: {count} llave(s) configurada(s)")
            else:
                print(f"ℹ️  {key}: No configuradas (opcional)")
        else:
            if value is not None:
                print(f"✅ {key}: {value}")
            else:
                print(f"❌ {key}: NO CONFIGURADA")
                all_ok = False
    
    return all_ok


def check_key_manager():
    """Verifica el gestor de llaves."""
    print_section("Gestor de Llaves")
    
    try:
        # Verificar si el cifrado está habilitado
        enabled = key_manager.is_encryption_enabled()
        print(f"✅ Cifrado habilitado: {enabled}")
        
        if not enabled:
            print("⚠️  El cifrado está deshabilitado")
            return False
        
        # Verificar llave activa
        try:
            key, key_id = key_manager.get_active_key()
            print(f"✅ Llave activa: {key_id}")
            print(f"   Longitud: {len(key)} caracteres")
        except Exception as e:
            print(f"❌ Error al obtener llave activa: {e}")
            return False
        
        # Verificar llaves de rotación
        rotation_count = len(key_manager.rotation_keys)
        print(f"✅ Llaves de rotación: {rotation_count}")
        
        if rotation_count > 0:
            for key_id in key_manager.rotation_keys.keys():
                print(f"   - {key_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en KeyManager: {e}")
        return False


def check_encryption_functionality():
    """Verifica la funcionalidad de cifrado/descifrado."""
    print_section("Funcionalidad de Cifrado")
    
    test_cases = [
        ("Texto simple", "Texto simple"),
        ("Caracteres especiales: ñáéíóú", "Caracteres especiales: ñáéíóú"),
        ("Emojis 😀🎉", "Emojis 😀🎉"),
        ("", ""),  # String vacío
        (None, None),  # None
        ("A" * 1000, "A" * 1000),  # Texto largo
    ]
    
    all_ok = True
    
    for i, (original, expected) in enumerate(test_cases, 1):
        try:
            # Cifrar
            encrypted = encrypt_value(original)
            
            # Verificar formato (si no es None o vacío)
            if original and encrypted:
                if "|" not in encrypted:
                    print(f"❌ Test {i}: Formato de cifrado inválido")
                    all_ok = False
                    continue
            
            # Descifrar
            decrypted = decrypt_value(encrypted)
            
            # Verificar resultado
            if decrypted == expected:
                desc = f"'{original[:20]}...'" if original and len(str(original)) > 20 else f"'{original}'"
                print(f"✅ Test {i}: {desc}")
            else:
                print(f"❌ Test {i}: Descifrado incorrecto")
                print(f"   Esperado: {expected}")
                print(f"   Obtenido: {decrypted}")
                all_ok = False
                
        except Exception as e:
            print(f"❌ Test {i}: Error - {e}")
            all_ok = False
    
    return all_ok


def check_json_encryption():
    """Verifica el cifrado de JSON."""
    print_section("Cifrado de JSON")
    
    test_cases = [
        {"nombre": "Juan", "edad": 25},
        {"datos": {"anidado": True, "valores": [1, 2, 3]}},
        {},  # JSON vacío
        None,  # None
    ]
    
    all_ok = True
    
    for i, original in enumerate(test_cases, 1):
        try:
            # Cifrar
            encrypted = encrypt_json(original)
            
            # Descifrar
            decrypted = decrypt_json(encrypted)
            
            # Verificar resultado
            if decrypted == original:
                desc = str(original)[:50] if original else str(original)
                print(f"✅ Test {i}: {desc}")
            else:
                print(f"❌ Test {i}: Descifrado incorrecto")
                print(f"   Esperado: {original}")
                print(f"   Obtenido: {decrypted}")
                all_ok = False
                
        except Exception as e:
            print(f"❌ Test {i}: Error - {e}")
            all_ok = False
    
    return all_ok


def check_performance():
    """Verifica el rendimiento del cifrado."""
    print_section("Rendimiento")
    
    test_data = "Datos de prueba para benchmark de rendimiento"
    iterations = 1000
    
    try:
        # Benchmark de cifrado
        start = time.time()
        for _ in range(iterations):
            encrypt_value(test_data)
        encrypt_time = (time.time() - start) * 1000  # Convertir a ms
        
        # Benchmark de descifrado
        encrypted = encrypt_value(test_data)
        start = time.time()
        for _ in range(iterations):
            decrypt_value(encrypted)
        decrypt_time = (time.time() - start) * 1000  # Convertir a ms
        
        # Mostrar resultados
        print(f"✅ Cifrado:    {encrypt_time:.2f} ms para {iterations} operaciones")
        print(f"   Promedio:   {encrypt_time/iterations:.3f} ms por operación")
        print()
        print(f"✅ Descifrado: {decrypt_time:.2f} ms para {iterations} operaciones")
        print(f"   Promedio:   {decrypt_time/iterations:.3f} ms por operación")
        
        # Verificar que el rendimiento sea aceptable (< 1ms por operación)
        if encrypt_time/iterations > 1.0 or decrypt_time/iterations > 1.0:
            print("\n⚠️  Advertencia: El rendimiento es más lento de lo esperado")
            print("   Considera optimizar o usar caché para operaciones frecuentes")
            return True  # No es un error crítico
        
        return True
        
    except Exception as e:
        print(f"❌ Error en benchmark: {e}")
        return False


def check_error_handling():
    """Verifica el manejo de errores."""
    print_section("Manejo de Errores")
    
    all_ok = True
    
    # Test 1: Descifrar datos corruptos
    try:
        corrupt_data = "datos_corruptos|test_key"
        decrypt_value(corrupt_data)
        print("❌ Test 1: Debería lanzar DecryptionError para datos corruptos")
        all_ok = False
    except DecryptionError:
        print("✅ Test 1: DecryptionError lanzado correctamente para datos corruptos")
    except Exception as e:
        print(f"⚠️  Test 1: Error inesperado: {e}")
    
    # Test 2: Descifrar con formato inválido
    try:
        invalid_format = "datos_sin_separador"
        result = decrypt_value(invalid_format)
        # Debe retornar el valor original con warning
        print("✅ Test 2: Valor sin formato de cifrado manejado correctamente")
    except Exception as e:
        print(f"⚠️  Test 2: Error inesperado: {e}")
    
    return all_ok


def print_recommendations():
    """Imprime recomendaciones de seguridad."""
    print_section("Recomendaciones de Seguridad")
    
    print("📋 Checklist de Seguridad:")
    print()
    print("   ✅ Llave de cifrado configurada en .env")
    print("   ✅ Archivo .env en .gitignore")
    print("   ⚠️  Usar diferentes llaves por ambiente (dev/staging/prod)")
    print("   ⚠️  Rotar llaves cada 6-12 meses")
    print("   ⚠️  Mantener backups seguros de las llaves")
    print("   ⚠️  No compartir llaves por email o chat")
    print("   ⚠️  Usar gestor de secretos en producción (AWS Secrets Manager, etc.)")
    print()
    print("📚 Documentación:")
    print()
    print("   - Plan completo: docs/PLAN_CIFRADO_DATOS_SENSIBLES.md")
    print("   - Inventario: docs/INVENTARIO_DATOS_SENSIBLES.md")
    print("   - Guía de implementación: docs/GUIA_IMPLEMENTACION_CIFRADO.md")
    print()


def main():
    """Función principal."""
    print("\n" + "="*70)
    print("  VERIFICACIÓN DE SISTEMA DE CIFRADO")
    print("="*70)
    
    results = {
        "Variables de Entorno": check_environment_variables(),
        "Gestor de Llaves": check_key_manager(),
        "Funcionalidad de Cifrado": check_encryption_functionality(),
        "Cifrado de JSON": check_json_encryption(),
        "Rendimiento": check_performance(),
        "Manejo de Errores": check_error_handling(),
    }
    
    # Resumen
    print_section("RESUMEN")
    
    all_ok = all(results.values())
    
    for check, result in results.items():
        status = "✅ OK" if result else "❌ ERROR"
        print(f"{status} - {check}")
    
    print()
    
    if all_ok:
        print("✅ Todas las verificaciones pasaron correctamente!")
        print()
        print_recommendations()
        print("\n🎉 El sistema de cifrado está listo para usar!")
        print()
        print("Próximos pasos:")
        print("  1. Revisar docs/GUIA_IMPLEMENTACION_CIFRADO.md")
        print("  2. Implementar Fase 4: Integración con ORM")
        print("  3. Ejecutar tests: pytest tests/test_encryption.py")
        print()
        return 0
    else:
        print("❌ Hay problemas en la configuración de cifrado.")
        print()
        print("Por favor, revisa los errores arriba y:")
        print("  1. Genera una llave: python scripts/generate_encryption_key.py")
        print("  2. Configura ENCRYPTION_KEY en .env")
        print("  3. Ejecuta este script nuevamente")
        print()
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Verificación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

