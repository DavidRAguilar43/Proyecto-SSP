# Guía de Implementación: Sistema de Cifrado de Datos Sensibles

## 🎯 Objetivo

Esta guía proporciona instrucciones paso a paso para implementar el sistema de cifrado de datos sensibles en el Sistema SSP.

---

## 📋 Pre-requisitos

### Conocimientos Necesarios
- ✅ Python 3.9+
- ✅ SQLAlchemy ORM
- ✅ FastAPI
- ✅ Conceptos básicos de criptografía

### Herramientas Requeridas
- ✅ Python con `venv` activado
- ✅ Acceso a base de datos (SQLite/PostgreSQL)
- ✅ Editor de código
- ✅ Terminal/CLI

### Documentos de Referencia
- 📄 `PLAN_CIFRADO_DATOS_SENSIBLES.md` - Plan completo
- 📄 `INVENTARIO_DATOS_SENSIBLES.md` - Campos a cifrar
- 📄 `Planning.md` - Contexto del proyecto

---

## 🚀 Inicio Rápido

### Paso 1: Instalar Dependencias

```bash
# Activar entorno virtual
cd API
source venv/bin/activate  # En macOS/Linux
# venv\Scripts\activate   # En Windows

# Instalar cryptography
pip install cryptography>=42.0.0

# Actualizar requirements.txt
pip freeze > requirements.txt
```

### Paso 2: Generar Llave de Cifrado

```bash
# Ejecutar generador de llaves
python scripts/generate_encryption_key.py
```

**Salida esperada**:
```
🔐 Generador de Llaves de Cifrado Fernet

⏳ Probando llave generada...
✅ Llave probada exitosamente

======================================================================
  LLAVE DE CIFRADO GENERADA EXITOSAMENTE
======================================================================

📋 INFORMACIÓN DE LA LLAVE:
   Key ID: key_v1_2024
   Llave:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=

======================================================================
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar .env.example si no existe .env
cp .env.example .env

# Editar .env y agregar la llave generada
nano .env
```

Agregar:
```bash
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
KEY_ID_ACTUAL=key_v1_2024
ENCRYPTION_ENABLED=True
```

### Paso 4: Verificar Configuración

```bash
python scripts/verify_env_config.py
```

**Salida esperada**:
```
✅ Todas las verificaciones pasaron correctamente!
```

---

## 📝 Implementación Detallada por Fase

### **FASE 1: Análisis e Inventario** ✅ Completada

**Documentos generados**:
- ✅ `docs/INVENTARIO_DATOS_SENSIBLES.md`
- ✅ `docs/PLAN_CIFRADO_DATOS_SENSIBLES.md`

**Campos identificados para cifrado**:
- User: 5 campos
- RespuestaPregunta: 2 campos
- ReporteIA: 1 campo
- ContactoEmergencia: 2 campos

**Total**: 10 campos sensibles

---

### **FASE 2: Infraestructura de Cifrado**

#### 2.1. Actualizar `app/core/config.py`

**Archivo**: `API/app/core/config.py`

```python
from pydantic_settings import BaseSettings, ConfigDict
from typing import Optional
import secrets


class Settings(BaseSettings):
    """Configuración centralizada de la aplicación."""
    
    # ... campos existentes ...
    
    # ============================================
    # Configuración de Cifrado de Datos
    # ============================================
    ENCRYPTION_KEY: Optional[str] = None
    KEY_ID_ACTUAL: str = "key_v1_2024"
    ROTATION_KEYS: Optional[str] = None
    ENCRYPTION_ENABLED: bool = True
    
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()
```

**Validación**:
```bash
python -c "from app.core.config import settings; print(f'Encryption enabled: {settings.ENCRYPTION_ENABLED}')"
```

#### 2.2. Crear Gestor de Llaves

**Archivo**: `API/app/core/encryption_keys.py`

```python
"""
Gestor de llaves de cifrado.

Este módulo maneja la carga y gestión de llaves de cifrado,
incluyendo rotación de llaves.
"""

from typing import Dict, Tuple, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class KeyManager:
    """
    Gestor de llaves de cifrado.
    
    Maneja la llave activa y las llaves de rotación para
    permitir descifrado de datos antiguos.
    """
    
    def __init__(self):
        """Inicializa el gestor de llaves."""
        self.active_key = settings.ENCRYPTION_KEY
        self.active_key_id = settings.KEY_ID_ACTUAL
        self.rotation_keys = self._load_rotation_keys()
        
        # Validar configuración
        if settings.ENCRYPTION_ENABLED and not self.active_key:
            raise ValueError(
                "ENCRYPTION_ENABLED=True pero ENCRYPTION_KEY no está configurada. "
                "Genera una llave con: python scripts/generate_encryption_key.py"
            )
        
        logger.info(f"KeyManager inicializado con key_id: {self.active_key_id}")
        logger.info(f"Llaves de rotación disponibles: {len(self.rotation_keys)}")
    
    def _load_rotation_keys(self) -> Dict[str, str]:
        """
        Carga llaves de rotación desde ROTATION_KEYS.
        
        Formato esperado: key_id:base64_key,key_id2:base64_key2
        
        Returns:
            Dict[str, str]: Diccionario {key_id: key}
        """
        if not settings.ROTATION_KEYS:
            return {}
        
        rotation_keys = {}
        try:
            pairs = settings.ROTATION_KEYS.split(',')
            for pair in pairs:
                if ':' not in pair:
                    logger.warning(f"Formato inválido en ROTATION_KEYS: {pair}")
                    continue
                
                key_id, key = pair.split(':', 1)
                rotation_keys[key_id.strip()] = key.strip()
            
            logger.info(f"Cargadas {len(rotation_keys)} llaves de rotación")
        except Exception as e:
            logger.error(f"Error al cargar ROTATION_KEYS: {e}")
        
        return rotation_keys
    
    def get_active_key(self) -> Tuple[str, str]:
        """
        Obtiene la llave activa para cifrado.
        
        Returns:
            Tuple[str, str]: (key, key_id)
            
        Raises:
            ValueError: Si no hay llave activa configurada
        """
        if not self.active_key:
            raise ValueError("No hay llave de cifrado activa configurada")
        
        return (self.active_key, self.active_key_id)
    
    def get_key_by_id(self, key_id: str) -> Optional[str]:
        """
        Obtiene una llave por su ID.
        
        Busca primero en la llave activa, luego en llaves de rotación.
        
        Args:
            key_id: ID de la llave a buscar
            
        Returns:
            Optional[str]: Llave si se encuentra, None en caso contrario
        """
        # Verificar si es la llave activa
        if key_id == self.active_key_id:
            return self.active_key
        
        # Buscar en llaves de rotación
        return self.rotation_keys.get(key_id)
    
    def is_encryption_enabled(self) -> bool:
        """
        Verifica si el cifrado está habilitado.
        
        Returns:
            bool: True si está habilitado, False en caso contrario
        """
        return settings.ENCRYPTION_ENABLED and self.active_key is not None


# Instancia global del gestor de llaves
key_manager = KeyManager()
```

**Validación**:
```bash
python -c "from app.core.encryption_keys import key_manager; print(f'Encryption enabled: {key_manager.is_encryption_enabled()}')"
```

---

### **FASE 3: Utilidades de Cifrado**

#### 3.1. Crear Módulo de Cifrado

**Directorio**: `API/app/security/`

```bash
mkdir -p app/security
touch app/security/__init__.py
```

**Archivo**: `API/app/security/encryption.py`

```python
"""
Utilidades de cifrado de campos.

Este módulo proporciona funciones para cifrar y descifrar
campos individuales de la base de datos.
"""

from cryptography.fernet import Fernet, InvalidToken
from typing import Optional
import logging
import json

from app.core.encryption_keys import key_manager

logger = logging.getLogger(__name__)


class EncryptionError(Exception):
    """Error al cifrar datos."""
    pass


class DecryptionError(Exception):
    """Error al descifrar datos."""
    pass


class KeyNotFoundError(Exception):
    """Llave de cifrado no encontrada."""
    pass


class FieldEncryption:
    """
    Clase para cifrado/descifrado de campos.
    
    Formato de datos cifrados: {encrypted_data}|{key_id}
    """
    
    SEPARATOR = "|"
    
    def __init__(self):
        """Inicializa el cifrador."""
        self.key_manager = key_manager
    
    def encrypt_value(self, value: Optional[str]) -> Optional[str]:
        """
        Cifra un valor de texto.
        
        Args:
            value: Texto plano a cifrar (puede ser None)
            
        Returns:
            Optional[str]: Valor cifrado en formato {data}|{key_id}, o None
            
        Raises:
            EncryptionError: Si hay un error al cifrar
        """
        # Manejar valores None o vacíos
        if value is None or value == "":
            return value
        
        # Si el cifrado está deshabilitado, retornar valor original
        if not self.key_manager.is_encryption_enabled():
            logger.warning("Cifrado deshabilitado, retornando valor sin cifrar")
            return value
        
        try:
            # Obtener llave activa
            key, key_id = self.key_manager.get_active_key()
            
            # Crear cifrador Fernet
            f = Fernet(key.encode())
            
            # Cifrar valor
            encrypted_bytes = f.encrypt(value.encode('utf-8'))
            encrypted_str = encrypted_bytes.decode('utf-8')
            
            # Agregar key_id
            result = f"{encrypted_str}{self.SEPARATOR}{key_id}"
            
            logger.debug(f"Valor cifrado exitosamente con key_id: {key_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error al cifrar valor: {e}")
            raise EncryptionError(f"Error al cifrar: {e}")
    
    def decrypt_value(self, encrypted_value: Optional[str]) -> Optional[str]:
        """
        Descifra un valor cifrado.
        
        Args:
            encrypted_value: Valor en formato {data}|{key_id} (puede ser None)
            
        Returns:
            Optional[str]: Texto plano descifrado, o None
            
        Raises:
            DecryptionError: Si hay un error al descifrar
            KeyNotFoundError: Si no se encuentra la llave
        """
        # Manejar valores None o vacíos
        if encrypted_value is None or encrypted_value == "":
            return encrypted_value
        
        # Si no contiene separador, asumir que no está cifrado
        if self.SEPARATOR not in encrypted_value:
            logger.warning("Valor sin formato de cifrado, retornando original")
            return encrypted_value
        
        try:
            # Separar datos cifrados y key_id
            parts = encrypted_value.rsplit(self.SEPARATOR, 1)
            if len(parts) != 2:
                raise DecryptionError("Formato de valor cifrado inválido")
            
            encrypted_str, key_id = parts
            
            # Obtener llave por ID
            key = self.key_manager.get_key_by_id(key_id)
            if not key:
                raise KeyNotFoundError(f"Llave no encontrada: {key_id}")
            
            # Crear cifrador Fernet
            f = Fernet(key.encode())
            
            # Descifrar valor
            decrypted_bytes = f.decrypt(encrypted_str.encode('utf-8'))
            decrypted_str = decrypted_bytes.decode('utf-8')
            
            logger.debug(f"Valor descifrado exitosamente con key_id: {key_id}")
            return decrypted_str
            
        except InvalidToken:
            logger.error("Token de cifrado inválido")
            raise DecryptionError("Datos cifrados corruptos o llave incorrecta")
        except KeyNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error al descifrar valor: {e}")
            raise DecryptionError(f"Error al descifrar: {e}")
    
    def encrypt_json(self, value: Optional[dict]) -> Optional[str]:
        """
        Cifra un valor JSON.
        
        Args:
            value: Diccionario a cifrar
            
        Returns:
            Optional[str]: JSON cifrado
        """
        if value is None:
            return None
        
        json_str = json.dumps(value, ensure_ascii=False)
        return self.encrypt_value(json_str)
    
    def decrypt_json(self, encrypted_value: Optional[str]) -> Optional[dict]:
        """
        Descifra un valor JSON.
        
        Args:
            encrypted_value: JSON cifrado
            
        Returns:
            Optional[dict]: Diccionario descifrado
        """
        if encrypted_value is None:
            return None
        
        decrypted_str = self.decrypt_value(encrypted_value)
        if decrypted_str is None:
            return None
        
        return json.loads(decrypted_str)


# Instancia global del cifrador
field_encryption = FieldEncryption()


# Funciones de conveniencia
def encrypt_value(value: Optional[str]) -> Optional[str]:
    """Cifra un valor de texto."""
    return field_encryption.encrypt_value(value)


def decrypt_value(encrypted_value: Optional[str]) -> Optional[str]:
    """Descifra un valor de texto."""
    return field_encryption.decrypt_value(encrypted_value)


def encrypt_json(value: Optional[dict]) -> Optional[str]:
    """Cifra un valor JSON."""
    return field_encryption.encrypt_json(value)


def decrypt_json(encrypted_value: Optional[str]) -> Optional[dict]:
    """Descifra un valor JSON."""
    return field_encryption.decrypt_json(encrypted_value)
```

---

## ✅ Checklist de Implementación

### Fase 2: Infraestructura
- [ ] Actualizar `requirements.txt` con `cryptography`
- [ ] Instalar dependencias: `pip install -r requirements.txt`
- [ ] Generar llave de cifrado: `python scripts/generate_encryption_key.py`
- [ ] Configurar `.env` con `ENCRYPTION_KEY`
- [ ] Actualizar `app/core/config.py`
- [ ] Crear `app/core/encryption_keys.py`
- [ ] Verificar configuración: `python scripts/verify_env_config.py`

### Fase 3: Utilidades
- [ ] Crear directorio `app/security/`
- [ ] Crear `app/security/__init__.py`
- [ ] Crear `app/security/encryption.py`
- [ ] Crear tests unitarios
- [ ] Ejecutar tests: `pytest tests/test_encryption.py`

---

## 🧪 Testing

### Prueba Manual Rápida

```python
# En Python REPL
from app.security.encryption import encrypt_value, decrypt_value

# Cifrar
encrypted = encrypt_value("Datos sensibles")
print(f"Cifrado: {encrypted}")

# Descifrar
decrypted = decrypt_value(encrypted)
print(f"Descifrado: {decrypted}")

# Verificar
assert decrypted == "Datos sensibles"
print("✅ Test exitoso!")
```

---

## 📚 Próximos Pasos

Después de completar Fase 2 y 3:
1. Continuar con **Fase 4: Integración con ORM**
2. Revisar `PLAN_CIFRADO_DATOS_SENSIBLES.md` para detalles
3. Actualizar `Tasks.md` con progreso

---

**Última actualización**: 2024-01-07  
**Versión**: 1.0

