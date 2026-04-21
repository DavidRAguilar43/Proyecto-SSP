"""
Gestor de llaves de cifrado.

Este módulo maneja la carga y gestión de llaves de cifrado desde variables de entorno,
incluyendo soporte para rotación de llaves.

Reason: Centralizar la gestión de llaves de cifrado y permitir rotación sin interrupciones.
"""

import logging
from typing import Dict, Tuple, Optional
from cryptography.fernet import Fernet

from app.core.config import settings

logger = logging.getLogger(__name__)


class KeyManager:
    """
    Gestor de llaves de cifrado con soporte para rotación.
    
    Carga la llave activa y las llaves de rotación desde variables de entorno.
    Permite descifrar datos cifrados con llaves antiguas mientras se cifran
    nuevos datos con la llave activa.
    
    Attributes:
        active_key (bytes): Llave de cifrado activa.
        active_key_id (str): Identificador de la llave activa.
        rotation_keys (Dict[str, bytes]): Diccionario de llaves de rotación.
    """
    
    def __init__(self):
        """
        Inicializa el gestor de llaves.
        
        Carga la llave activa y las llaves de rotación desde settings.
        
        Raises:
            ValueError: Si ENCRYPTION_ENABLED es True pero ENCRYPTION_KEY no está configurada.
            ValueError: Si alguna llave tiene formato inválido.
        """
        self.active_key: Optional[bytes] = None
        self.active_key_id: str = settings.KEY_ID_ACTUAL
        self.rotation_keys: Dict[str, bytes] = {}
        
        # Cargar llave activa
        if settings.ENCRYPTION_ENABLED:
            if not settings.ENCRYPTION_KEY:
                raise ValueError(
                    "ENCRYPTION_ENABLED es True pero ENCRYPTION_KEY no está configurada. "
                    "Por favor, genera una llave con: python scripts/generate_encryption_key.py"
                )
            
            try:
                self.active_key = settings.ENCRYPTION_KEY.encode('utf-8')
                # Validar que la llave sea válida
                Fernet(self.active_key)
                logger.info(f"Llave de cifrado activa cargada: {self.active_key_id}")
            except Exception as e:
                raise ValueError(f"ENCRYPTION_KEY tiene formato inválido: {e}")
        
        # Cargar llaves de rotación
        if settings.ROTATION_KEYS:
            self._load_rotation_keys()
    
    def _load_rotation_keys(self) -> None:
        """
        Carga las llaves de rotación desde ROTATION_KEYS.
        
        Formato esperado: "key_id_1:key_1,key_id_2:key_2,..."
        
        Raises:
            ValueError: Si el formato de ROTATION_KEYS es inválido.
        """
        try:
            # Dividir por comas para obtener cada par key_id:key
            pairs = settings.ROTATION_KEYS.split(',')
            
            for pair in pairs:
                pair = pair.strip()
                if not pair:
                    continue
                
                # Dividir por : para obtener key_id y key
                if ':' not in pair:
                    logger.warning(f"Par de rotación inválido (falta ':'): {pair}")
                    continue
                
                key_id, key = pair.split(':', 1)
                key_id = key_id.strip()
                key = key.strip()
                
                if not key_id or not key:
                    logger.warning(f"Par de rotación inválido (vacío): {pair}")
                    continue
                
                # Validar que la llave sea válida
                try:
                    key_bytes = key.encode('utf-8')
                    Fernet(key_bytes)
                    self.rotation_keys[key_id] = key_bytes
                    logger.info(f"Llave de rotación cargada: {key_id}")
                except Exception as e:
                    logger.error(f"Llave de rotación inválida para {key_id}: {e}")
                    continue
            
            logger.info(f"Total de llaves de rotación cargadas: {len(self.rotation_keys)}")
            
        except Exception as e:
            logger.error(f"Error al cargar llaves de rotación: {e}")
            raise ValueError(f"Formato inválido en ROTATION_KEYS: {e}")
    
    def get_active_key(self) -> Tuple[bytes, str]:
        """
        Obtiene la llave de cifrado activa y su ID.
        
        Returns:
            Tuple[bytes, str]: Tupla con (llave_activa, key_id_activo).
        
        Raises:
            ValueError: Si el cifrado está deshabilitado o la llave no está configurada.
        """
        if not settings.ENCRYPTION_ENABLED:
            raise ValueError("El cifrado está deshabilitado (ENCRYPTION_ENABLED=False)")
        
        if not self.active_key:
            raise ValueError("Llave de cifrado activa no configurada")
        
        return self.active_key, self.active_key_id
    
    def get_key_by_id(self, key_id: str) -> bytes:
        """
        Obtiene una llave de cifrado por su ID.
        
        Busca primero en la llave activa, luego en las llaves de rotación.
        
        Args:
            key_id (str): Identificador de la llave.
        
        Returns:
            bytes: Llave de cifrado.
        
        Raises:
            KeyError: Si no se encuentra la llave con el ID especificado.
        """
        # Verificar si es la llave activa
        if key_id == self.active_key_id:
            if not self.active_key:
                raise KeyError(f"Llave activa '{key_id}' no está configurada")
            return self.active_key
        
        # Buscar en llaves de rotación
        if key_id in self.rotation_keys:
            return self.rotation_keys[key_id]
        
        # No se encontró la llave
        available_keys = [self.active_key_id] + list(self.rotation_keys.keys())
        raise KeyError(
            f"No se encontró la llave con ID '{key_id}'. "
            f"Llaves disponibles: {', '.join(available_keys)}"
        )
    
    def is_encryption_enabled(self) -> bool:
        """
        Verifica si el cifrado está habilitado.
        
        Returns:
            bool: True si el cifrado está habilitado, False en caso contrario.
        """
        return settings.ENCRYPTION_ENABLED and self.active_key is not None
    
    def get_all_key_ids(self) -> list:
        """
        Obtiene una lista de todos los IDs de llaves disponibles.
        
        Returns:
            list: Lista de IDs de llaves (activa + rotación).
        """
        key_ids = []
        
        if self.active_key:
            key_ids.append(self.active_key_id)
        
        key_ids.extend(self.rotation_keys.keys())
        
        return key_ids
    
    def validate_all_keys(self) -> Dict[str, bool]:
        """
        Valida todas las llaves cargadas.
        
        Returns:
            Dict[str, bool]: Diccionario con key_id como clave y resultado de validación como valor.
        """
        results = {}
        
        # Validar llave activa
        if self.active_key:
            try:
                Fernet(self.active_key)
                results[self.active_key_id] = True
            except Exception:
                results[self.active_key_id] = False
        
        # Validar llaves de rotación
        for key_id, key in self.rotation_keys.items():
            try:
                Fernet(key)
                results[key_id] = True
            except Exception:
                results[key_id] = False
        
        return results


# Instancia global del gestor de llaves
# Se inicializa al importar el módulo
try:
    key_manager = KeyManager()
    logger.info("KeyManager inicializado correctamente")
except Exception as e:
    logger.error(f"Error al inicializar KeyManager: {e}")
    # Crear instancia vacía para evitar errores de importación
    key_manager = KeyManager.__new__(KeyManager)
    key_manager.active_key = None
    key_manager.active_key_id = "none"
    key_manager.rotation_keys = {}

