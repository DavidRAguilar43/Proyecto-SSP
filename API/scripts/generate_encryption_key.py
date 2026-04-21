#!/usr/bin/env python3
"""
Script para generar llaves de cifrado Fernet.

Uso:
    python scripts/generate_encryption_key.py

Este script genera una nueva llave de cifrado Fernet que puede ser usada
en la variable de entorno ENCRYPTION_KEY.

IMPORTANTE:
- Guarda la llave generada en un lugar seguro
- NUNCA commitees la llave al repositorio
- Usa diferentes llaves para desarrollo, staging y producción
"""

import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from cryptography.fernet import Fernet
from datetime import datetime


def generate_key():
    """
    Genera una nueva llave de cifrado Fernet.
    
    Returns:
        str: Llave en formato base64
    """
    key = Fernet.generate_key()
    return key.decode()


def generate_key_id():
    """
    Genera un ID único para la llave basado en la fecha.
    
    Returns:
        str: ID de llave en formato key_vN_YYYY
    """
    year = datetime.now().year
    return f"key_v1_{year}"


def print_instructions(key: str, key_id: str):
    """
    Imprime instrucciones para usar la llave generada.
    
    Args:
        key: Llave generada
        key_id: ID de la llave
    """
    print("\n" + "="*70)
    print("  LLAVE DE CIFRADO GENERADA EXITOSAMENTE")
    print("="*70)
    print()
    print("📋 INFORMACIÓN DE LA LLAVE:")
    print(f"   Key ID: {key_id}")
    print(f"   Llave:  {key}")
    print()
    print("="*70)
    print()
    print("📝 INSTRUCCIONES DE USO:")
    print()
    print("1. Copia la llave generada arriba")
    print()
    print("2. Agrégala a tu archivo .env:")
    print()
    print("   # En API/.env")
    print(f"   ENCRYPTION_KEY={key}")
    print(f"   KEY_ID_ACTUAL={key_id}")
    print()
    print("3. Si estás rotando llaves, agrega la llave anterior a ROTATION_KEYS:")
    print()
    print("   # Formato: key_id:llave,key_id2:llave2")
    print(f"   ROTATION_KEYS=key_v0_2023:OLD_KEY_HERE,{key_id}:{key}")
    print()
    print("="*70)
    print()
    print("⚠️  ADVERTENCIAS DE SEGURIDAD:")
    print()
    print("   ❌ NUNCA commitees esta llave al repositorio Git")
    print("   ❌ NUNCA compartas esta llave por email o chat")
    print("   ❌ NUNCA uses la misma llave en desarrollo y producción")
    print()
    print("   ✅ Guarda la llave en un gestor de contraseñas")
    print("   ✅ Usa diferentes llaves por ambiente")
    print("   ✅ Rota las llaves cada 6-12 meses")
    print("   ✅ Mantén backups seguros de las llaves")
    print()
    print("="*70)
    print()
    print("🔍 VERIFICACIÓN:")
    print()
    print("   Después de configurar, ejecuta:")
    print("   python scripts/verify_env_config.py")
    print()
    print("="*70)
    print()


def test_key(key: str):
    """
    Prueba que la llave funcione correctamente.
    
    Args:
        key: Llave a probar
        
    Returns:
        bool: True si la llave funciona, False en caso contrario
    """
    try:
        f = Fernet(key.encode())
        test_message = b"Test message for encryption"
        encrypted = f.encrypt(test_message)
        decrypted = f.decrypt(encrypted)
        return decrypted == test_message
    except Exception as e:
        print(f"❌ Error al probar la llave: {e}")
        return False


def main():
    """Función principal."""
    print("\n🔐 Generador de Llaves de Cifrado Fernet\n")
    
    # Generar llave
    key = generate_key()
    key_id = generate_key_id()
    
    # Probar llave
    print("⏳ Probando llave generada...")
    if not test_key(key):
        print("❌ Error: La llave generada no funciona correctamente")
        return 1
    
    print("✅ Llave probada exitosamente")
    
    # Imprimir instrucciones
    print_instructions(key, key_id)
    
    # Preguntar si desea generar otra llave
    print("¿Deseas generar otra llave? (s/n): ", end="")
    try:
        response = input().strip().lower()
        if response in ['s', 'si', 'sí', 'y', 'yes']:
            print()
            return main()
    except (KeyboardInterrupt, EOFError):
        print("\n\n👋 Saliendo...")
    
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Operación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

