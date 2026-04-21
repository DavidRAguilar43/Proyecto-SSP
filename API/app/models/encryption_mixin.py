"""
Mixin para cifrado automático de campos en modelos SQLAlchemy.

Este módulo proporciona un mixin que permite cifrar y descifrar automáticamente
campos específicos de modelos SQLAlchemy usando eventos de SQLAlchemy.

Reason: Hacer el cifrado transparente para la lógica de negocio, cifrando al
guardar y descifrando al leer.
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from app.security.encryption import (
    encrypt_value,
    decrypt_value,
    encrypt_json,
    decrypt_json,
    EncryptionError,
    DecryptionError,
    KeyNotFoundError,
)

logger = logging.getLogger(__name__)


class EncryptedFieldsMixin:
    """
    Mixin para modelos SQLAlchemy que necesitan cifrado de campos.
    
    Para usar este mixin:
    1. Heredar de EncryptedFieldsMixin en tu modelo
    2. Definir el atributo de clase __encrypted_fields__ con la lista de campos a cifrar
    3. Opcionalmente definir __encrypted_json_fields__ para campos JSON
    
    Ejemplo:
        class User(Base, EncryptedFieldsMixin):
            __tablename__ = "users"
            __encrypted_fields__ = ["celular", "lugar_trabajo"]
            
            id = Column(Integer, primary_key=True)
            celular = Column(String)
            lugar_trabajo = Column(String)
    
    El cifrado/descifrado se realiza automáticamente:
    - Al insertar/actualizar: los campos se cifran antes de guardar en BD
    - Al leer: los campos se descifran después de cargar desde BD
    """
    
    # Lista de campos de texto a cifrar (debe ser definida en la clase hija)
    __encrypted_fields__: List[str] = []
    
    # Lista de campos JSON a cifrar (debe ser definida en la clase hija)
    __encrypted_json_fields__: List[str] = []
    
    # Flag interno para evitar cifrado recursivo
    _encryption_in_progress: bool = False
    
    @classmethod
    def _get_encrypted_fields(cls) -> List[str]:
        """
        Obtiene la lista de campos de texto a cifrar.
        
        Returns:
            List[str]: Lista de nombres de campos.
        """
        return getattr(cls, '__encrypted_fields__', [])
    
    @classmethod
    def _get_encrypted_json_fields(cls) -> List[str]:
        """
        Obtiene la lista de campos JSON a cifrar.
        
        Returns:
            List[str]: Lista de nombres de campos JSON.
        """
        return getattr(cls, '__encrypted_json_fields__', [])
    
    def _encrypt_fields(self) -> None:
        """
        Cifra los campos especificados en __encrypted_fields__ y __encrypted_json_fields__.
        
        Este método se llama automáticamente antes de insertar o actualizar.
        """
        if self._encryption_in_progress:
            return
        
        self._encryption_in_progress = True
        
        try:
            # Cifrar campos de texto
            for field_name in self._get_encrypted_fields():
                value = getattr(self, field_name, None)
                
                # Solo cifrar si el valor no está None y no está ya cifrado
                if value is not None and value != "":
                    # Verificar si ya está cifrado (tiene el formato {data}|{key_id})
                    if isinstance(value, str) and "|" in value:
                        # Posiblemente ya está cifrado, no volver a cifrar
                        logger.debug(f"Campo {field_name} parece estar ya cifrado, omitiendo")
                        continue
                    
                    try:
                        encrypted_value = encrypt_value(value)
                        setattr(self, field_name, encrypted_value)
                        logger.debug(f"Campo {field_name} cifrado exitosamente")
                    except EncryptionError as e:
                        logger.error(f"Error al cifrar campo {field_name}: {e}")
                        # No lanzar excepción para no interrumpir la operación
            
            # Cifrar campos JSON
            for field_name in self._get_encrypted_json_fields():
                value = getattr(self, field_name, None)
                
                # Solo cifrar si el valor no está None
                if value is not None:
                    # Si es string, verificar si ya está cifrado
                    if isinstance(value, str) and "|" in value:
                        logger.debug(f"Campo JSON {field_name} parece estar ya cifrado, omitiendo")
                        continue
                    
                    # Si es dict, cifrar
                    if isinstance(value, dict):
                        try:
                            encrypted_value = encrypt_json(value)
                            setattr(self, field_name, encrypted_value)
                            logger.debug(f"Campo JSON {field_name} cifrado exitosamente")
                        except EncryptionError as e:
                            logger.error(f"Error al cifrar campo JSON {field_name}: {e}")
        
        finally:
            self._encryption_in_progress = False
    
    def _decrypt_fields(self) -> None:
        """
        Descifra los campos especificados en __encrypted_fields__ y __encrypted_json_fields__.
        
        Este método se llama automáticamente después de cargar desde la BD.
        """
        if self._encryption_in_progress:
            return
        
        self._encryption_in_progress = True
        
        try:
            # Descifrar campos de texto
            for field_name in self._get_encrypted_fields():
                value = getattr(self, field_name, None)
                
                # Solo descifrar si el valor no está None y parece estar cifrado
                if value is not None and value != "":
                    if isinstance(value, str) and "|" in value:
                        try:
                            decrypted_value = decrypt_value(value)
                            setattr(self, field_name, decrypted_value)
                            logger.debug(f"Campo {field_name} descifrado exitosamente")
                        except (DecryptionError, KeyNotFoundError) as e:
                            logger.error(f"Error al descifrar campo {field_name}: {e}")
                            # Mantener el valor cifrado en caso de error
            
            # Descifrar campos JSON
            for field_name in self._get_encrypted_json_fields():
                value = getattr(self, field_name, None)
                
                # Solo descifrar si el valor es string y parece estar cifrado
                if value is not None and isinstance(value, str) and "|" in value:
                    try:
                        decrypted_value = decrypt_json(value)
                        setattr(self, field_name, decrypted_value)
                        logger.debug(f"Campo JSON {field_name} descifrado exitosamente")
                    except (DecryptionError, KeyNotFoundError) as e:
                        logger.error(f"Error al descifrar campo JSON {field_name}: {e}")
                        # Mantener el valor cifrado en caso de error
        
        finally:
            self._encryption_in_progress = False


def setup_encryption_listeners(model_class):
    """
    Configura los listeners de SQLAlchemy para cifrado/descifrado automático.

    Esta función debe ser llamada para cada modelo que use EncryptedFieldsMixin.

    Args:
        model_class: Clase del modelo que hereda de EncryptedFieldsMixin.

    Example:
        setup_encryption_listeners(User)
        setup_encryption_listeners(ContactoEmergencia)
    """

    @event.listens_for(model_class, 'before_insert')
    def encrypt_before_insert(mapper, connection, target):
        """Cifra los campos antes de insertar en la BD."""
        if isinstance(target, EncryptedFieldsMixin):
            target._encrypt_fields()

    @event.listens_for(model_class, 'before_update')
    def encrypt_before_update(mapper, connection, target):
        """Cifra los campos antes de actualizar en la BD."""
        if isinstance(target, EncryptedFieldsMixin):
            target._encrypt_fields()

    @event.listens_for(model_class, 'after_insert')
    def decrypt_after_insert(mapper, connection, target):
        """Descifra los campos después de insertar en la BD."""
        if isinstance(target, EncryptedFieldsMixin):
            target._decrypt_fields()

    @event.listens_for(model_class, 'after_update')
    def decrypt_after_update(mapper, connection, target):
        """Descifra los campos después de actualizar en la BD."""
        if isinstance(target, EncryptedFieldsMixin):
            target._decrypt_fields()

    @event.listens_for(model_class, 'load')
    def decrypt_after_load(target, context):
        """Descifra los campos después de cargar desde la BD."""
        if isinstance(target, EncryptedFieldsMixin):
            target._decrypt_fields()

    logger.info(f"Listeners de cifrado configurados para {model_class.__name__}")


def setup_all_encryption_listeners():
    """
    Configura los listeners de cifrado para todos los modelos que usan EncryptedFieldsMixin.
    
    Esta función debe ser llamada una vez al iniciar la aplicación, después de
    importar todos los modelos.
    
    Example:
        # En app/main.py o app/__init__.py
        from app.models.encryption_mixin import setup_all_encryption_listeners
        setup_all_encryption_listeners()
    """
    from app.models.persona import User
    from app.models.contacto_emergencia import ContactoEmergencia
    from app.models.cuestionario_admin import RespuestaPregunta, ReporteIA
    
    # Configurar listeners para cada modelo
    models_with_encryption = [
        User,
        ContactoEmergencia,
        RespuestaPregunta,
        ReporteIA,
    ]
    
    for model in models_with_encryption:
        if hasattr(model, '__encrypted_fields__') or hasattr(model, '__encrypted_json_fields__'):
            setup_encryption_listeners(model)
            logger.info(f"Cifrado habilitado para modelo: {model.__name__}")
        else:
            logger.warning(
                f"Modelo {model.__name__} no tiene __encrypted_fields__ ni "
                f"__encrypted_json_fields__ definidos"
            )
    
    logger.info("Configuración de cifrado completada para todos los modelos")

