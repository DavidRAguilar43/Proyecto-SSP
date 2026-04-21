"""
Módulo de cifrado de datos sensibles.

Proporciona funciones para cifrar y descifrar valores de texto y JSON,
con soporte para rotación de llaves.

Reason: Proteger datos sensibles mediante cifrado simétrico AES-256 (Fernet).
"""

import json
import logging
from typing import Optional, Any, Dict
from cryptography.fernet import Fernet, InvalidToken

from app.core.encryption_keys import key_manager

logger = logging.getLogger(__name__)


# ============================================
# Excepciones Personalizadas
# ============================================

class EncryptionError(Exception):
    """Excepción lanzada cuando falla el cifrado de datos."""
    pass


class DecryptionError(Exception):
    """Excepción lanzada cuando falla el descifrado de datos."""
    pass


class KeyNotFoundError(Exception):
    """Excepción lanzada cuando no se encuentra una llave de cifrado."""
    pass


# ============================================
# Clase Principal de Cifrado
# ============================================

class FieldEncryption:
    """
    Clase para cifrado y descifrado de campos.
    
    Implementa cifrado simétrico usando Fernet (AES-128-CBC + HMAC-SHA256).
    Los datos cifrados incluyen el ID de la llave usada para permitir rotación.
    
    Formato de datos cifrados: {encrypted_data}|{key_id}
    """
    
    SEPARATOR = "|"
    
    def __init__(self):
        """Inicializa el cifrador de campos."""
        self.key_manager = key_manager
    
    def encrypt_value(self, value: Optional[str]) -> Optional[str]:
        """
        Cifra un valor de texto.
        
        Args:
            value (Optional[str]): Valor a cifrar. Puede ser None o string vacío.
        
        Returns:
            Optional[str]: Valor cifrado en formato "{encrypted_data}|{key_id}",
                          o None/vacío si el valor de entrada es None/vacío.
        
        Raises:
            EncryptionError: Si falla el cifrado.
        
        Examples:
            >>> enc = FieldEncryption()
            >>> encrypted = enc.encrypt_value("datos sensibles")
            >>> print(encrypted)
            'gAAAAABhkN3x...base64_data...|key_v1_2024'
        """
        # Manejar valores None o vacíos
        if value is None or value == "":
            return value
        
        # Verificar que el cifrado esté habilitado
        if not self.key_manager.is_encryption_enabled():
            logger.warning("Cifrado deshabilitado, retornando valor sin cifrar")
            return value
        
        try:
            # Obtener llave activa
            key, key_id = self.key_manager.get_active_key()
            
            # Crear instancia de Fernet
            fernet = Fernet(key)
            
            # Cifrar el valor
            value_bytes = value.encode('utf-8')
            encrypted_bytes = fernet.encrypt(value_bytes)
            encrypted_str = encrypted_bytes.decode('utf-8')
            
            # Agregar key_id al final
            result = f"{encrypted_str}{self.SEPARATOR}{key_id}"
            
            logger.debug(f"Valor cifrado exitosamente con llave {key_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error al cifrar valor: {e}")
            raise EncryptionError(f"Error al cifrar valor: {e}")
    
    def decrypt_value(self, value: Optional[str]) -> Optional[str]:
        """
        Descifra un valor de texto.
        
        Args:
            value (Optional[str]): Valor cifrado en formato "{encrypted_data}|{key_id}".
        
        Returns:
            Optional[str]: Valor descifrado, o None/vacío si el valor de entrada es None/vacío.
        
        Raises:
            DecryptionError: Si falla el descifrado.
            KeyNotFoundError: Si no se encuentra la llave especificada.
        
        Examples:
            >>> enc = FieldEncryption()
            >>> decrypted = enc.decrypt_value("gAAAAABhkN3x...base64...|key_v1_2024")
            >>> print(decrypted)
            'datos sensibles'
        """
        # Manejar valores None o vacíos
        if value is None or value == "":
            return value
        
        # Verificar que el cifrado esté habilitado
        if not self.key_manager.is_encryption_enabled():
            logger.warning("Cifrado deshabilitado, retornando valor sin descifrar")
            return value
        
        try:
            # Verificar si el valor tiene el formato de cifrado
            if self.SEPARATOR not in value:
                logger.warning(
                    f"Valor no tiene formato de cifrado (falta '{self.SEPARATOR}'). "
                    "Retornando valor original. Esto puede indicar datos no cifrados."
                )
                return value
            
            # Separar datos cifrados y key_id
            encrypted_str, key_id = value.rsplit(self.SEPARATOR, 1)
            
            # Obtener la llave correspondiente
            try:
                key = self.key_manager.get_key_by_id(key_id)
            except KeyError as e:
                logger.error(f"Llave no encontrada: {key_id}")
                raise KeyNotFoundError(f"No se encontró la llave '{key_id}': {e}")
            
            # Crear instancia de Fernet
            fernet = Fernet(key)
            
            # Descifrar el valor
            encrypted_bytes = encrypted_str.encode('utf-8')
            decrypted_bytes = fernet.decrypt(encrypted_bytes)
            decrypted_str = decrypted_bytes.decode('utf-8')
            
            logger.debug(f"Valor descifrado exitosamente con llave {key_id}")
            return decrypted_str
            
        except InvalidToken:
            logger.error("Token de cifrado inválido o datos corruptos")
            raise DecryptionError("Datos cifrados corruptos o llave incorrecta")
        except KeyNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error al descifrar valor: {e}")
            raise DecryptionError(f"Error al descifrar valor: {e}")
    
    def encrypt_json(self, value: Optional[Dict[str, Any]]) -> Optional[str]:
        """
        Cifra un objeto JSON.
        
        Convierte el objeto a string JSON y luego lo cifra.
        
        Args:
            value (Optional[Dict[str, Any]]): Objeto JSON a cifrar.
        
        Returns:
            Optional[str]: JSON cifrado en formato "{encrypted_data}|{key_id}",
                          o None si el valor de entrada es None.
        
        Raises:
            EncryptionError: Si falla el cifrado o la serialización JSON.
        
        Examples:
            >>> enc = FieldEncryption()
            >>> data = {"pregunta_1": "Sí", "pregunta_2": "No"}
            >>> encrypted = enc.encrypt_json(data)
        """
        if value is None:
            return None
        
        try:
            # Convertir a JSON string
            json_str = json.dumps(value, ensure_ascii=False)
            
            # Cifrar el string
            return self.encrypt_value(json_str)
            
        except (TypeError, ValueError) as e:
            logger.error(f"Error al serializar JSON: {e}")
            raise EncryptionError(f"Error al serializar JSON: {e}")
        except Exception as e:
            logger.error(f"Error al cifrar JSON: {e}")
            raise EncryptionError(f"Error al cifrar JSON: {e}")
    
    def decrypt_json(self, value: Optional[str]) -> Optional[Dict[str, Any]]:
        """
        Descifra un objeto JSON.
        
        Descifra el string y luego lo convierte a objeto JSON.
        
        Args:
            value (Optional[str]): JSON cifrado en formato "{encrypted_data}|{key_id}".
        
        Returns:
            Optional[Dict[str, Any]]: Objeto JSON descifrado, o None si el valor es None.
        
        Raises:
            DecryptionError: Si falla el descifrado o el parsing JSON.
            KeyNotFoundError: Si no se encuentra la llave especificada.
        
        Examples:
            >>> enc = FieldEncryption()
            >>> decrypted = enc.decrypt_json("gAAAAABhkN3x...base64...|key_v1_2024")
            >>> print(decrypted)
            {'pregunta_1': 'Sí', 'pregunta_2': 'No'}
        """
        if value is None:
            return None
        
        try:
            # Descifrar el string
            json_str = self.decrypt_value(value)
            
            if json_str is None:
                return None
            
            # Convertir de JSON string a objeto
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.error(f"Error al parsear JSON descifrado: {e}")
            raise DecryptionError(f"Error al parsear JSON descifrado: {e}")
        except Exception as e:
            logger.error(f"Error al descifrar JSON: {e}")
            raise DecryptionError(f"Error al descifrar JSON: {e}")


# ============================================
# Instancia Global y Funciones de Conveniencia
# ============================================

# Instancia global del cifrador
_field_encryption = FieldEncryption()


def encrypt_value(value: Optional[str]) -> Optional[str]:
    """
    Cifra un valor de texto.
    
    Función de conveniencia que usa la instancia global de FieldEncryption.
    
    Args:
        value (Optional[str]): Valor a cifrar.
    
    Returns:
        Optional[str]: Valor cifrado.
    
    Raises:
        EncryptionError: Si falla el cifrado.
    """
    return _field_encryption.encrypt_value(value)


def decrypt_value(value: Optional[str]) -> Optional[str]:
    """
    Descifra un valor de texto.
    
    Función de conveniencia que usa la instancia global de FieldEncryption.
    
    Args:
        value (Optional[str]): Valor cifrado.
    
    Returns:
        Optional[str]: Valor descifrado.
    
    Raises:
        DecryptionError: Si falla el descifrado.
        KeyNotFoundError: Si no se encuentra la llave.
    """
    return _field_encryption.decrypt_value(value)


def encrypt_json(value: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Cifra un objeto JSON.
    
    Función de conveniencia que usa la instancia global de FieldEncryption.
    
    Args:
        value (Optional[Dict[str, Any]]): Objeto JSON a cifrar.
    
    Returns:
        Optional[str]: JSON cifrado.
    
    Raises:
        EncryptionError: Si falla el cifrado.
    """
    return _field_encryption.encrypt_json(value)


def decrypt_json(value: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Descifra un objeto JSON.
    
    Función de conveniencia que usa la instancia global de FieldEncryption.
    
    Args:
        value (Optional[str]): JSON cifrado.
    
    Returns:
        Optional[Dict[str, Any]]: Objeto JSON descifrado.
    
    Raises:
        DecryptionError: Si falla el descifrado.
        KeyNotFoundError: Si no se encuentra la llave.
    """
    return _field_encryption.decrypt_json(value)

