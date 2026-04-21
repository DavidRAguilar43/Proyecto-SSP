# Plan de Implementación: Sistema de Cifrado de Datos Sensibles

## 📋 Resumen Ejecutivo

Este documento detalla el plan de implementación de un sistema de cifrado simétrico por campo para proteger datos sensibles en el Sistema de Seguimiento Psicopedagógico (SSP).

### Objetivos
- ✅ Proteger datos sensibles mediante cifrado AES-256-GCM/Fernet
- ✅ Implementar gestión segura de llaves maestras vía variables de entorno
- ✅ Habilitar rotación de llaves sin interrupciones
- ✅ Garantizar cifrado transparente en capas de servicio
- ✅ Mantener auditoría y trazabilidad

### Alcance de Datos Sensibles

#### Datos a Cifrar
1. **Respuestas de Cuestionarios** (`RespuestaPregunta.valor`, `RespuestaPregunta.texto_otro`)
2. **Reportes de IA** (`ReporteIA.contenido`)
3. **Datos Personales de Usuarios**:
   - `User.celular`
   - `User.extension_telefonica`
   - `User.lugar_trabajo`
   - `User.colonia_residencia_actual`
   - `User.observaciones`
4. **Contactos de Emergencia**:
   - `ContactoEmergencia.nombre_contacto`
   - `ContactoEmergencia.telefono_contacto`

#### Datos NO Cifrados (por diseño)
- Correos institucionales (necesarios para autenticación)
- Matrículas (identificadores únicos)
- Datos demográficos agregados (para análisis estadístico)
- Metadatos de sistema (fechas, IDs, estados)

---

## 🏗️ Arquitectura Técnica

### Tecnología de Cifrado

**Librería**: `cryptography` (PyCA)
- **Algoritmo**: Fernet (AES-128-CBC + HMAC-SHA256) o AES-256-GCM
- **Modo**: Cifrado autenticado (AEAD)
- **Formato de salida**: Base64 + metadata de llave

### Estructura de Datos Cifrados

```
{encrypted_data}|{key_id}
```

Ejemplo:
```
gAAAAABhkN3x...base64_encrypted_data...|key_v1_2024
```

### Gestión de Llaves

#### Variables de Entorno (.env)
```bash
# Llave activa para nuevos cifrados
ENCRYPTION_KEY=<base64_encoded_key>
KEY_ID_ACTUAL=key_v1_2024

# Llaves de rotación (para descifrar datos antiguos)
ROTATION_KEYS=key_v0_2023:<base64_key>,key_v1_2024:<base64_key>
```

#### Generación de Llaves
```python
from cryptography.fernet import Fernet

# Generar nueva llave
key = Fernet.generate_key()
print(key.decode())  # Guardar en .env
```

---

## 📅 Plan de Implementación por Fases

### **Fase 1: Análisis e Inventario** ⏱️ 1-2 días

#### Objetivos
- Inventariar todos los campos sensibles en modelos SQLAlchemy
- Documentar flujos de lectura/escritura de datos sensibles
- Definir formato de almacenamiento cifrado

#### Tareas
1. **Inventario de Modelos**
   - [ ] Revisar `app/models/` y listar campos sensibles
   - [ ] Documentar tipos de datos y longitudes actuales
   - [ ] Estimar impacto en tamaño de almacenamiento (cifrado aumenta ~33%)

2. **Análisis de Flujos**
   - [ ] Mapear endpoints que leen/escriben datos sensibles
   - [ ] Identificar servicios que procesan datos sensibles
   - [ ] Documentar casos de uso de reportes IA

3. **Definición de Formato**
   - [ ] Especificar formato: `{encrypted_data}|{key_id}`
   - [ ] Definir longitud máxima de campos cifrados
   - [ ] Planificar cambios de esquema de BD

#### Entregables
- `docs/INVENTARIO_DATOS_SENSIBLES.md`
- `docs/FLUJOS_DATOS_SENSIBLES.md`
- Diagrama de arquitectura de cifrado

---

### **Fase 2: Infraestructura de Cifrado** ⏱️ 2-3 días

#### Objetivos
- Configurar variables de entorno para llaves
- Crear utilidades de carga y validación de llaves
- Ajustar `settings.py` para gestión de llaves

#### Tareas
1. **Actualizar Variables de Entorno**
   - [ ] Agregar variables a `.env.example`:
     ```bash
     # ============================================
     # Configuración de Cifrado de Datos
     # ============================================
     # Llave maestra activa (generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
     ENCRYPTION_KEY=
     
     # ID de la llave activa
     KEY_ID_ACTUAL=key_v1_2024
     
     # Llaves de rotación (formato: key_id:base64_key,key_id2:base64_key2)
     ROTATION_KEYS=
     
     # Habilitar cifrado (True/False)
     ENCRYPTION_ENABLED=True
     ```

2. **Actualizar `app/core/config.py`**
   - [ ] Agregar campos de configuración:
     ```python
     class Settings(BaseSettings):
         # ... campos existentes ...
         
         # Cifrado de datos
         ENCRYPTION_KEY: Optional[str] = None
         KEY_ID_ACTUAL: str = "key_v1_2024"
         ROTATION_KEYS: Optional[str] = None
         ENCRYPTION_ENABLED: bool = True
     ```

3. **Crear Utilidad de Carga de Llaves**
   - [ ] Crear `app/core/encryption_keys.py`:
     ```python
     from typing import Dict
     from app.core.config import settings
     
     class KeyManager:
         def __init__(self):
             self.active_key = settings.ENCRYPTION_KEY
             self.active_key_id = settings.KEY_ID_ACTUAL
             self.rotation_keys = self._load_rotation_keys()
         
         def _load_rotation_keys(self) -> Dict[str, str]:
             # Parsear ROTATION_KEYS
             pass
         
         def get_active_key(self) -> tuple[str, str]:
             # Retornar (key, key_id)
             pass
         
         def get_key_by_id(self, key_id: str) -> str:
             # Retornar llave por ID
             pass
     ```

4. **Validación de Configuración**
   - [ ] Actualizar `scripts/verify_env_config.py` para validar llaves
   - [ ] Agregar tests para fallback seguro en tests

#### Entregables
- `.env.example` actualizado
- `app/core/config.py` con campos de cifrado
- `app/core/encryption_keys.py`
- Script de validación actualizado

---

### **Fase 3: Utilidades de Cifrado** ⏱️ 3-4 días

#### Objetivos
- Crear módulo de cifrado/descifrado
- Implementar manejo de rotación de llaves
- Desarrollar pruebas unitarias completas

#### Tareas
1. **Crear Módulo de Cifrado**
   - [ ] Crear `app/security/encryption.py`:
     ```python
     from cryptography.fernet import Fernet
     from typing import Optional
     from app.core.encryption_keys import KeyManager
     
     class FieldEncryption:
         def __init__(self, key_manager: KeyManager):
             self.key_manager = key_manager
         
         def encrypt_value(self, value: str) -> str:
             """
             Cifra un valor y agrega key_id.
             
             Args:
                 value: Texto plano a cifrar
             
             Returns:
                 Formato: {encrypted_data}|{key_id}
             """
             pass
         
         def decrypt_value(self, encrypted_value: str) -> str:
             """
             Descifra un valor usando la llave apropiada.
             
             Args:
                 encrypted_value: Formato {encrypted_data}|{key_id}
             
             Returns:
                 Texto plano descifrado
             """
             pass
     ```

2. **Manejo de Errores**
   - [ ] Crear excepciones personalizadas:
     ```python
     class EncryptionError(Exception):
         pass
     
     class DecryptionError(Exception):
         pass
     
     class KeyNotFoundError(Exception):
         pass
     ```

3. **Pruebas Unitarias**
   - [ ] Crear `tests/test_encryption.py`:
     - Test de cifrado/descifrado básico
     - Test de rotación de llaves
     - Test de manejo de errores
     - Test de valores None/vacíos
     - Test de rendimiento

#### Entregables
- `app/security/encryption.py`
- `app/security/exceptions.py`
- `tests/test_encryption.py`
- Documentación de API de cifrado

---

### **Fase 4: Integración con ORM** ⏱️ 4-5 días

#### Objetivos
- Adaptar modelos SQLAlchemy para cifrado transparente
- Crear decoradores/mixins para repositorios
- Aplicar migraciones de esquema

#### Tareas
1. **Crear Mixin de Cifrado**
   - [ ] Crear `app/models/mixins/encrypted_field.py`:
     ```python
     from sqlalchemy import event
     from sqlalchemy.orm import declarative_mixin
     
     @declarative_mixin
     class EncryptedFieldMixin:
         @classmethod
         def __declare_last__(cls):
             # Registrar eventos de before_insert/before_update
             pass
     ```

2. **Adaptar Modelos**
   - [ ] Modificar `User` para cifrar campos sensibles
   - [ ] Modificar `RespuestaPregunta` para cifrar respuestas
   - [ ] Modificar `ReporteIA` para cifrar contenido
   - [ ] Modificar `ContactoEmergencia` para cifrar datos

3. **Migraciones de Base de Datos**
   - [ ] Crear migración Alembic para aumentar longitud de campos:
     ```python
     # Ejemplo: RespuestaPregunta.valor (JSON -> Text cifrado)
     op.alter_column('respuestas_pregunta', 'valor',
                     type_=sa.Text(),
                     existing_type=sa.JSON())
     ```

4. **Decoradores para Repositorios**
   - [ ] Crear `app/utils/encryption_decorators.py`:
     ```python
     def encrypt_on_save(fields: list[str]):
         def decorator(func):
             @wraps(func)
             def wrapper(*args, **kwargs):
                 # Cifrar campos antes de guardar
                 pass
             return wrapper
         return decorator
     ```

#### Entregables
- Mixins de cifrado
- Modelos actualizados
- Migraciones Alembic
- Decoradores de repositorio

---

### **Fase 5: Servicios y Endpoints** ⏱️ 2-3 días

#### Objetivos
- Revisar serializadores Pydantic
- Actualizar lógica de negocio
- Garantizar que datos cifrados no se expongan

#### Tareas
1. **Revisar Schemas Pydantic**
   - [ ] Verificar que `UserOut` no exponga datos cifrados
   - [ ] Actualizar `RespuestaPreguntaOut` para descifrado automático
   - [ ] Revisar `ReporteIAOut` para manejo de contenido cifrado

2. **Actualizar Servicios**
   - [ ] Modificar `app/services/cuestionario_service.py` para cifrado
   - [ ] Actualizar `app/services/reporte_ia_service.py`
   - [ ] Revisar `app/services/user_service.py`

3. **Testing de Endpoints**
   - [ ] Verificar que POST/PUT cifren datos
   - [ ] Verificar que GET descifren datos
   - [ ] Probar casos de error (llave inválida, datos corruptos)

#### Entregables
- Schemas actualizados
- Servicios con cifrado integrado
- Tests de integración

---

### **Fase 6: Migración de Datos** ⏱️ 3-4 días

#### Objetivos
- Cifrar datos existentes en base de datos
- Ejecutar migración con respaldo previo
- Validar integridad post-migración

#### Tareas
1. **Diseñar Script de Migración**
   - [ ] Crear `scripts/migrations_scripts/encrypt_existing_data.py`:
     ```python
     def migrate_user_data(db: Session):
         users = db.query(User).all()
         for user in users:
             if user.celular and not is_encrypted(user.celular):
                 user.celular = encrypt_value(user.celular)
             # ... otros campos
         db.commit()
     ```

2. **Backup de Base de Datos**
   - [ ] Crear script de backup automático
   - [ ] Documentar procedimiento de rollback

3. **Ejecución Controlada**
   - [ ] Ejecutar en entorno de desarrollo
   - [ ] Validar datos cifrados
   - [ ] Ejecutar en staging
   - [ ] Ejecutar en producción (con ventana de mantenimiento)

4. **Validación Post-Migración**
   - [ ] Verificar que todos los campos sensibles estén cifrados
   - [ ] Probar descifrado de datos migrados
   - [ ] Verificar integridad de reportes IA

#### Entregables
- Script de migración
- Procedimiento de backup/rollback
- Reporte de validación

---

## 🔐 Consideraciones de Seguridad

### Protección de Llaves
- ✅ Llaves NUNCA en repositorio Git
- ✅ Llaves cargadas solo al inicio de la API
- ✅ Llaves en memoria protegida (no logs)
- ✅ Rotación periódica de llaves (cada 6-12 meses)

### Auditoría
- ✅ Registrar eventos de cifrado/descifrado (sin datos sensibles)
- ✅ Alertas de errores de descifrado
- ✅ Monitoreo de uso de llaves antiguas

### Acceso a Datos
- ✅ Descifrado solo en capas de servicio autorizadas
- ✅ Scopes de ORM para limitar acceso
- ✅ Rate limiting en endpoints sensibles

---

## 📊 Métricas de Éxito

### Técnicas
- [ ] 100% de campos sensibles cifrados
- [ ] 0 errores de descifrado en producción
- [ ] Tiempo de respuesta < 50ms adicional por operación
- [ ] Cobertura de tests > 90%

### Operacionales
- [ ] Procedimiento de rotación documentado y probado
- [ ] Backups cifrados funcionando
- [ ] Alertas de seguridad configuradas
- [ ] Equipo capacitado en gestión de llaves

---

## 📚 Referencias

- [Cryptography Library](https://cryptography.io/en/latest/)
- [Fernet Specification](https://github.com/fernet/spec/)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

---

## 🆘 Contacto y Soporte

Para dudas sobre implementación:
- Revisar `docs/GUIA_CIFRADO.md` (a crear)
- Ejecutar `python scripts/verify_encryption.py` (a crear)
- Consultar logs en `logs/encryption.log`

