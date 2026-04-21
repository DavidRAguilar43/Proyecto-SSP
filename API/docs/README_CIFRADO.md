# Sistema de Cifrado de Datos Sensibles - SSP

## 🔐 Descripción General

El Sistema de Seguimiento Psicopedagógico (SSP) implementa cifrado simétrico a nivel de campo para proteger datos sensibles de estudiantes, incluyendo:

- Respuestas a cuestionarios psicopedagógicos
- Reportes generados por IA
- Datos personales de contacto
- Información de contactos de emergencia

## 🎯 Características Principales

### Seguridad
- ✅ **Cifrado AES-256** mediante Fernet (cryptography library)
- ✅ **Cifrado autenticado** (AEAD) para prevenir manipulación
- ✅ **Rotación de llaves** sin interrupciones
- ✅ **Gestión segura** de llaves vía variables de entorno
- ✅ **Auditoría** de operaciones de cifrado/descifrado

### Transparencia
- ✅ **Cifrado automático** al guardar datos
- ✅ **Descifrado automático** al leer datos
- ✅ **Sin cambios** en lógica de negocio
- ✅ **Compatible** con código existente

### Rendimiento
- ✅ **< 1ms** por operación de cifrado/descifrado
- ✅ **Mínimo impacto** en tiempos de respuesta
- ✅ **Escalable** para miles de registros

## 📚 Documentación

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| [PLAN_CIFRADO_DATOS_SENSIBLES.md](PLAN_CIFRADO_DATOS_SENSIBLES.md) | Plan completo de implementación por fases |
| [INVENTARIO_DATOS_SENSIBLES.md](INVENTARIO_DATOS_SENSIBLES.md) | Catálogo de campos sensibles a cifrar |
| [GUIA_IMPLEMENTACION_CIFRADO.md](GUIA_IMPLEMENTACION_CIFRADO.md) | Guía paso a paso de implementación |
| Este documento | Referencia rápida y uso diario |

### Scripts Útiles

| Script | Propósito |
|--------|-----------|
| `scripts/generate_encryption_key.py` | Generar nuevas llaves de cifrado |
| `scripts/verify_encryption.py` | Verificar configuración de cifrado |
| `scripts/verify_env_config.py` | Verificar variables de entorno |

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Activar entorno virtual
cd API
source venv/bin/activate

# Instalar dependencias
pip install cryptography>=42.0.0
```

### 2. Generar Llave de Cifrado

```bash
python scripts/generate_encryption_key.py
```

Esto generará una llave como:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

### 3. Configurar Variables de Entorno

Editar `API/.env`:

```bash
# Cifrado de datos sensibles
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
KEY_ID_ACTUAL=key_v1_2024
ENCRYPTION_ENABLED=True
```

### 4. Verificar Configuración

```bash
python scripts/verify_encryption.py
```

Salida esperada:
```
✅ Todas las verificaciones pasaron correctamente!
```

## 💻 Uso en Código

### Cifrar/Descifrar Valores de Texto

```python
from app.security.encryption import encrypt_value, decrypt_value

# Cifrar
celular = "5551234567"
celular_cifrado = encrypt_value(celular)
# Resultado: "gAAAAABhkN3x...base64_data...|key_v1_2024"

# Descifrar
celular_original = decrypt_value(celular_cifrado)
# Resultado: "5551234567"
```

### Cifrar/Descifrar JSON

```python
from app.security.encryption import encrypt_json, decrypt_json

# Cifrar JSON
respuesta = {"pregunta_1": "Sí", "pregunta_2": "No"}
respuesta_cifrada = encrypt_json(respuesta)

# Descifrar JSON
respuesta_original = decrypt_json(respuesta_cifrada)
# Resultado: {"pregunta_1": "Sí", "pregunta_2": "No"}
```

### Manejo de Valores None/Vacíos

```python
# Los valores None y vacíos se manejan automáticamente
encrypt_value(None)  # Retorna None
encrypt_value("")    # Retorna ""
decrypt_value(None)  # Retorna None
decrypt_value("")    # Retorna ""
```

### Manejo de Errores

```python
from app.security.encryption import (
    encrypt_value,
    decrypt_value,
    EncryptionError,
    DecryptionError,
    KeyNotFoundError
)

try:
    encrypted = encrypt_value("datos sensibles")
except EncryptionError as e:
    logger.error(f"Error al cifrar: {e}")

try:
    decrypted = decrypt_value(encrypted)
except DecryptionError as e:
    logger.error(f"Error al descifrar: {e}")
except KeyNotFoundError as e:
    logger.error(f"Llave no encontrada: {e}")
```

## 🔄 Rotación de Llaves

### ¿Cuándo Rotar Llaves?

- ✅ Cada 6-12 meses (recomendado)
- ✅ Después de una brecha de seguridad
- ✅ Cuando un empleado con acceso deja la organización
- ✅ Como parte de auditorías de seguridad

### Proceso de Rotación

#### 1. Generar Nueva Llave

```bash
python scripts/generate_encryption_key.py
```

Guardar la nueva llave: `nueva_llave_aqui=`

#### 2. Actualizar Variables de Entorno

En `.env`:

```bash
# Nueva llave activa
ENCRYPTION_KEY=nueva_llave_aqui=
KEY_ID_ACTUAL=key_v2_2025

# Agregar llave antigua a rotación
ROTATION_KEYS=key_v1_2024:llave_antigua_aqui=
```

#### 3. Reiniciar API

```bash
# La API cargará las nuevas llaves
python start_api.py
```

#### 4. Migrar Datos Antiguos (Opcional)

```bash
# Script para re-cifrar datos con nueva llave
python scripts/migrations_scripts/rotate_encryption_keys.py
```

### Múltiples Llaves de Rotación

Para mantener múltiples llaves antiguas:

```bash
ROTATION_KEYS=key_v0_2023:llave_2023=,key_v1_2024:llave_2024=
```

## 🔍 Verificación y Debugging

### Verificar que un Campo Está Cifrado

```python
# Un campo cifrado tiene el formato: {data}|{key_id}
valor = user.celular
if "|" in valor:
    print("✅ Campo está cifrado")
    # Extraer key_id
    _, key_id = valor.rsplit("|", 1)
    print(f"   Key ID: {key_id}")
else:
    print("⚠️  Campo NO está cifrado")
```

### Verificar Configuración

```bash
# Verificación completa
python scripts/verify_encryption.py

# Solo variables de entorno
python scripts/verify_env_config.py

# Test rápido en Python
python -c "from app.security.encryption import encrypt_value, decrypt_value; \
           enc = encrypt_value('test'); \
           dec = decrypt_value(enc); \
           print('✅ OK' if dec == 'test' else '❌ ERROR')"
```

### Logs de Cifrado

Los eventos de cifrado se registran en logs:

```python
import logging

# Configurar nivel de log
logging.getLogger('app.security.encryption').setLevel(logging.DEBUG)

# Los logs mostrarán:
# - Valores cifrados exitosamente
# - Valores descifrados exitosamente
# - Errores de cifrado/descifrado
# - Key IDs utilizados
```

## ⚠️ Consideraciones Importantes

### Búsquedas en Campos Cifrados

**Problema**: No se puede buscar directamente en campos cifrados.

**Soluciones**:
1. Buscar por campos no cifrados (matrícula, correo institucional)
2. Descifrar en memoria y filtrar (solo para conjuntos pequeños)
3. Mantener índices hash separados (para implementación futura)

Ejemplo:
```python
# ❌ NO funciona: búsqueda directa en campo cifrado
users = db.query(User).filter(User.celular == "5551234567").all()

# ✅ SÍ funciona: buscar por campo no cifrado
user = db.query(User).filter(User.matricula == "12345").first()
# Luego descifrar el celular
celular = decrypt_value(user.celular)
```

### Rendimiento

**Impacto esperado**:
- Cifrado: ~0.1-0.5 ms por campo
- Descifrado: ~0.1-0.5 ms por campo
- Consulta con 100 registros: +50-100 ms total

**Optimizaciones**:
```python
# Usar paginación
users = db.query(User).limit(50).offset(0).all()

# Descifrar solo cuando sea necesario
for user in users:
    # Solo descifrar si se va a usar
    if need_phone_number:
        celular = decrypt_value(user.celular)
```

### Backups

**IMPORTANTE**: Los backups de base de datos contienen datos cifrados.

Para restaurar backups:
1. ✅ Asegurar que las llaves de cifrado estén disponibles
2. ✅ Configurar `ROTATION_KEYS` con llaves históricas si es necesario
3. ✅ Verificar que los datos se descifren correctamente

```bash
# Backup de base de datos
cp ssp.db ssp_backup_$(date +%Y%m%d).db

# Backup de llaves (GUARDAR EN LUGAR SEGURO)
echo "ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env)" > keys_backup_$(date +%Y%m%d).txt
```

## 🛡️ Mejores Prácticas de Seguridad

### ✅ Hacer

1. **Usar diferentes llaves por ambiente**
   ```bash
   # .env.development
   ENCRYPTION_KEY=dev_key_here=
   
   # .env.production
   ENCRYPTION_KEY=prod_key_here=
   ```

2. **Rotar llaves periódicamente**
   - Establecer calendario (cada 6-12 meses)
   - Documentar rotaciones en bitácora

3. **Mantener backups seguros de llaves**
   - Usar gestor de contraseñas (1Password, LastPass)
   - Usar gestor de secretos en producción (AWS Secrets Manager)

4. **Auditar acceso a datos sensibles**
   ```python
   logger.info(f"Usuario {user_id} accedió a datos sensibles de estudiante {student_id}")
   ```

5. **Limitar permisos de descifrado**
   ```python
   # Solo ciertos roles pueden ver datos descifrados
   if current_user.rol in ["admin", "coordinador"]:
       celular = decrypt_value(user.celular)
   else:
       celular = "***-***-****"  # Enmascarado
   ```

### ❌ No Hacer

1. ❌ Commitear llaves al repositorio Git
2. ❌ Compartir llaves por email o chat
3. ❌ Usar la misma llave en desarrollo y producción
4. ❌ Hardcodear llaves en código
5. ❌ Deshabilitar cifrado en producción
6. ❌ Ignorar errores de descifrado

## 📊 Monitoreo

### Métricas Clave

```python
# Ejemplo de métricas a monitorear
metrics = {
    "encryption_operations_total": 1000,
    "decryption_operations_total": 950,
    "encryption_errors_total": 0,
    "decryption_errors_total": 2,
    "avg_encryption_time_ms": 0.3,
    "avg_decryption_time_ms": 0.4,
}
```

### Alertas Recomendadas

- 🚨 Tasa de errores de descifrado > 1%
- 🚨 Tiempo de cifrado > 5ms
- 🚨 Llave de cifrado no configurada
- 🚨 Uso de llave antigua > 30 días después de rotación

## 🆘 Solución de Problemas

### Error: "ENCRYPTION_KEY no configurada"

**Solución**:
```bash
python scripts/generate_encryption_key.py
# Copiar llave generada a .env
```

### Error: "Datos cifrados corruptos"

**Posibles causas**:
1. Llave incorrecta
2. Datos modificados manualmente
3. Migración incompleta

**Solución**:
```bash
# Verificar llave
python scripts/verify_encryption.py

# Restaurar desde backup si es necesario
```

### Error: "KeyNotFoundError"

**Causa**: Intentando descifrar con una llave que no está en `ROTATION_KEYS`.

**Solución**:
```bash
# Agregar llave faltante a ROTATION_KEYS en .env
ROTATION_KEYS=key_missing:llave_aqui=,...
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Ejecutar `python scripts/verify_encryption.py`
3. Revisar logs de la aplicación
4. Consultar con el equipo de desarrollo

---

**Última actualización**: 2024-01-07  
**Versión**: 1.0  
**Mantenedor**: Equipo de Desarrollo SSP

