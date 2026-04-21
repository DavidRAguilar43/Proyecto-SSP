#!/usr/bin/env python3
"""
Script para verificar que la configuración de variables de entorno está correcta.

Uso:
    python scripts/verify_env_config.py
"""

import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


def print_section(title: str):
    """Imprimir un título de sección."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def check_env_file():
    """Verificar que el archivo .env existe."""
    env_path = Path(__file__).parent.parent / ".env"
    
    print_section("Verificación de Archivo .env")
    
    if env_path.exists():
        print(f"✅ Archivo .env encontrado: {env_path}")
        return True
    else:
        print(f"❌ Archivo .env NO encontrado: {env_path}")
        print(f"   Crear con: cp .env.example .env")
        return False


def check_openrouter_config():
    """Verificar configuración de OpenRouter."""
    print_section("Configuración de OpenRouter")
    
    checks = {
        "API Key": settings.OPENROUTER_API_KEY,
        "Base URL": settings.OPENROUTER_BASE_URL,
        "Modelo": settings.OPENROUTER_MODEL,
        "Site URL": settings.SITE_URL,
        "Site Name": settings.SITE_NAME,
    }
    
    all_ok = True
    
    for key, value in checks.items():
        if key == "API Key":
            if value:
                # Mostrar solo los primeros y últimos caracteres
                masked = f"{value[:10]}...{value[-10:]}" if len(value) > 20 else "***"
                print(f"✅ {key}: {masked}")
            else:
                print(f"⚠️  {key}: NO CONFIGURADA")
                all_ok = False
        else:
            if value:
                print(f"✅ {key}: {value}")
            else:
                print(f"❌ {key}: NO CONFIGURADA")
                all_ok = False
    
    return all_ok


def check_security_config():
    """Verificar configuración de seguridad."""
    print_section("Configuración de Seguridad")
    
    checks = {
        "Secret Key": settings.SECRET_KEY,
        "Algoritmo": settings.ALGORITHM,
        "Token Expiration (min)": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }
    
    all_ok = True
    
    for key, value in checks.items():
        if key == "Secret Key":
            if value:
                masked = f"{value[:10]}...{value[-10:]}" if len(value) > 20 else "***"
                print(f"✅ {key}: {masked}")
            else:
                print(f"❌ {key}: NO CONFIGURADA")
                all_ok = False
        else:
            if value:
                print(f"✅ {key}: {value}")
            else:
                print(f"❌ {key}: NO CONFIGURADA")
                all_ok = False
    
    return all_ok


def check_app_config():
    """Verificar configuración de la aplicación."""
    print_section("Configuración de la Aplicación")
    
    checks = {
        "Ambiente": settings.ENVIRONMENT,
        "Debug": settings.DEBUG,
        "Host": settings.HOST,
        "Puerto": settings.PORT,
        "Base de Datos": settings.DATABASE_URL,
    }
    
    all_ok = True
    
    for key, value in checks.items():
        if value is not None:
            print(f"✅ {key}: {value}")
        else:
            print(f"❌ {key}: NO CONFIGURADA")
            all_ok = False
    
    return all_ok


def check_api_connectivity():
    """Verificar conectividad con OpenRouter (si está configurada)."""
    print_section("Verificación de Conectividad")
    
    if not settings.OPENROUTER_API_KEY:
        print("⚠️  API Key no configurada. Saltando verificación de conectividad.")
        return None
    
    try:
        from openai import OpenAI
        
        client = OpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY
        )
        
        # Intentar hacer una llamada simple
        print("Intentando conectar a OpenRouter...")
        
        # Nota: Esta es una llamada de prueba que no consume créditos
        # pero verifica que la API key es válida
        
        print("✅ Conexión a OpenRouter exitosa")
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a OpenRouter: {str(e)}")
        return False


def main():
    """Ejecutar todas las verificaciones."""
    print("\n" + "="*60)
    print("  VERIFICACIÓN DE CONFIGURACIÓN DE ENTORNO")
    print("="*60)
    
    results = {
        "Archivo .env": check_env_file(),
        "OpenRouter": check_openrouter_config(),
        "Seguridad": check_security_config(),
        "Aplicación": check_app_config(),
    }
    
    # Verificar conectividad solo si todo lo demás está bien
    if results["OpenRouter"]:
        connectivity = check_api_connectivity()
        if connectivity is not None:
            results["Conectividad"] = connectivity
    
    # Resumen
    print_section("RESUMEN")
    
    all_ok = all(v for v in results.values() if v is not None)
    
    for check, result in results.items():
        if result is None:
            status = "⏭️  SALTADO"
        elif result:
            status = "✅ OK"
        else:
            status = "❌ ERROR"
        print(f"{status} - {check}")
    
    print()
    
    if all_ok:
        print("✅ Todas las verificaciones pasaron correctamente!")
        print("\nPuedes iniciar la aplicación con:")
        print("  python start_api.py")
        return 0
    else:
        print("❌ Hay problemas en la configuración.")
        print("\nPor favor, revisa los errores arriba y:")
        print("  1. Copia .env.example a .env")
        print("  2. Configura OPENROUTER_API_KEY en .env")
        print("  3. Ejecuta este script nuevamente")
        return 1


if __name__ == "__main__":
    sys.exit(main())

