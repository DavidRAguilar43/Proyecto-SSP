# Fase 7 y 8: Testing & Observabilidad + Operación Continua

**Documento:** Plan de Implementación - Fases Finales  
**Fecha:** 2025-01-07  
**Estado:** Pendiente de Implementación

---

## 📋 Resumen Ejecutivo

Las Fases 7 y 8 completan el sistema de cifrado con testing exhaustivo, monitoreo en producción, y procedimientos operacionales para mantener la seguridad a largo plazo.

---

## 🧪 Fase 7: Testing y Observabilidad

**Duración Estimada:** 2-3 días  
**Objetivo:** Garantizar calidad, rendimiento y visibilidad del sistema de cifrado

### 7.1 Testing Exhaustivo

#### 7.1.1 Tests de Regresión en CI/CD

**Objetivo:** Asegurar que el cifrado no rompa funcionalidad existente

**Tareas:**

1. **Actualizar Pipeline de CI/CD**
   ```yaml
   # .github/workflows/tests.yml (ejemplo)
   name: Tests con Cifrado
   
   on: [push, pull_request]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Python
           uses: actions/setup-python@v2
           with:
             python-version: '3.11'
         
         - name: Install dependencies
           run: |
             pip install -r requirements.txt
         
         - name: Generate test encryption key
           run: |
             python scripts/generate_encryption_key.py > test_key.txt
             echo "ENCRYPTION_KEY=$(cat test_key.txt)" >> $GITHUB_ENV
         
         - name: Run encryption tests
           run: |
             pytest tests/test_encryption.py -v
             pytest tests/test_encryption_integration.py -v
         
         - name: Run all tests
           run: |
             pytest tests/ -v --cov=app --cov-report=html
   ```

2. **Tests de Endpoints con Cifrado**
   ```python
   # tests/test_api_encryption.py
   
   def test_create_user_encrypts_data(client, db):
       """Test que crear usuario cifra datos sensibles."""
       response = client.post("/api/v1/users", json={
           "celular": "5551234567",
           "lugar_trabajo": "UNAM",
           # ... otros campos
       })
       
       assert response.status_code == 201
       user_id = response.json()["id"]
       
       # Verificar en BD que está cifrado
       result = db.execute(
           text("SELECT celular FROM users WHERE id = :id"),
           {"id": user_id}
       ).fetchone()
       
       assert "|" in result[0]  # Formato cifrado
       assert result[0].startswith("gAAAAA")
   
   
   def test_get_user_decrypts_data(client, db):
       """Test que obtener usuario descifra datos."""
       # Crear usuario
       user = User(celular="5551234567", ...)
       db.add(user)
       db.commit()
       
       # Obtener vía API
       response = client.get(f"/api/v1/users/{user.id}")
       
       assert response.status_code == 200
       assert response.json()["celular"] == "5551234567"  # Descifrado
   ```

3. **Tests de Cuestionarios con Respuestas Cifradas**
   ```python
   def test_submit_questionnaire_encrypts_answers(client, db):
       """Test que enviar respuestas las cifra."""
       response = client.post("/api/v1/cuestionarios/responder", json={
           "cuestionario_id": "...",
           "respuestas": [
               {
                   "pregunta_id": "...",
                   "valor": {"texto": "Me siento ansioso"}
               }
           ]
       })
       
       assert response.status_code == 201
       
       # Verificar cifrado en BD
       result = db.execute(
           text("SELECT valor FROM respuestas_pregunta LIMIT 1")
       ).fetchone()
       
       assert "|" in result[0]
   ```

#### 7.1.2 Tests de Rendimiento

**Objetivo:** Verificar que el cifrado no degrada el rendimiento

**Tareas:**

1. **Benchmark de Operaciones de Cifrado**
   ```python
   # tests/test_encryption_performance.py
   import pytest
   from time import time
   
   def test_encryption_performance(benchmark):
       """Test de rendimiento de cifrado."""
       from app.security.encryption import encrypt_value
       
       def encrypt_operation():
           return encrypt_value("Datos de prueba sensibles")
       
       result = benchmark(encrypt_operation)
       
       # Verificar que toma menos de 5ms
       assert benchmark.stats['mean'] < 0.005  # 5ms
   
   
   def test_bulk_encryption_performance(db):
       """Test de cifrado masivo."""
       start = time()
       
       # Crear 1000 usuarios
       users = []
       for i in range(1000):
           user = User(
               celular=f"555{i:07d}",
               lugar_trabajo="UNAM",
               # ... otros campos
           )
           users.append(user)
       
       db.bulk_save_objects(users)
       db.commit()
       
       elapsed = time() - start
       
       # Debe completar en menos de 10 segundos
       assert elapsed < 10.0
       print(f"✅ 1000 usuarios cifrados en {elapsed:.2f}s")
   ```

2. **Monitoreo de Tiempo de Respuesta**
   ```python
   def test_api_response_time_with_encryption(client):
       """Test que endpoints mantienen buen rendimiento."""
       import time
       
       # Crear datos de prueba
       # ...
       
       # Medir tiempo de respuesta
       start = time.time()
       response = client.get("/api/v1/users?limit=100")
       elapsed = time.time() - start
       
       assert response.status_code == 200
       assert elapsed < 1.0  # Menos de 1 segundo
       print(f"✅ 100 usuarios descifrados en {elapsed:.3f}s")
   ```

#### 7.1.3 Tests de Rotación de Llaves

**Objetivo:** Verificar que la rotación de llaves funciona correctamente

**Tareas:**

1. **Test de Rotación Básica**
   ```python
   def test_key_rotation(db):
       """Test que rotación de llaves funciona."""
       from app.core.encryption_keys import key_manager
       from app.security.encryption import encrypt_value, decrypt_value
       
       # Cifrar con llave actual
       original_text = "Datos sensibles"
       encrypted_v1 = encrypt_value(original_text)
       
       assert "|key_v1_2025" in encrypted_v1
       
       # Simular rotación de llave
       # (En producción esto se hace vía .env)
       # ...
       
       # Verificar que datos antiguos se pueden descifrar
       decrypted = decrypt_value(encrypted_v1)
       assert decrypted == original_text
   ```

### 7.2 Observabilidad y Monitoreo

#### 7.2.1 Logging de Operaciones de Cifrado

**Objetivo:** Registrar eventos sin exponer datos sensibles

**Tareas:**

1. **Configurar Logging Estructurado**
   ```python
   # app/core/logging_config.py
   import logging
   import json
   from datetime import datetime
   
   class EncryptionLogger:
       """Logger especializado para operaciones de cifrado."""
       
       def __init__(self):
           self.logger = logging.getLogger("encryption")
           self.logger.setLevel(logging.INFO)
           
           # Handler para archivo
           handler = logging.FileHandler("logs/encryption.log")
           handler.setFormatter(
               logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
           )
           self.logger.addHandler(handler)
       
       def log_encryption(self, field_name: str, key_id: str, success: bool):
           """Registra operación de cifrado."""
           self.logger.info(json.dumps({
               "event": "encryption",
               "field": field_name,
               "key_id": key_id,
               "success": success,
               "timestamp": datetime.now().isoformat()
           }))
       
       def log_decryption(self, field_name: str, key_id: str, success: bool):
           """Registra operación de descifrado."""
           self.logger.info(json.dumps({
               "event": "decryption",
               "field": field_name,
               "key_id": key_id,
               "success": success,
               "timestamp": datetime.now().isoformat()
           }))
       
       def log_error(self, operation: str, error: str):
           """Registra error de cifrado/descifrado."""
           self.logger.error(json.dumps({
               "event": "encryption_error",
               "operation": operation,
               "error": error,
               "timestamp": datetime.now().isoformat()
           }))
   
   encryption_logger = EncryptionLogger()
   ```

2. **Integrar Logging en Mixin**
   ```python
   # Actualizar app/models/encryption_mixin.py
   
   from app.core.logging_config import encryption_logger
   
   def _encrypt_fields(self) -> None:
       """Cifra los campos con logging."""
       for field_name in self._get_encrypted_fields():
           try:
               # ... código de cifrado ...
               encryption_logger.log_encryption(
                   field_name=field_name,
                   key_id=settings.KEY_ID_ACTUAL,
                   success=True
               )
           except EncryptionError as e:
               encryption_logger.log_error("encryption", str(e))
   ```

#### 7.2.2 Métricas y Alertas

**Objetivo:** Monitorear salud del sistema de cifrado

**Tareas:**

1. **Definir Métricas Clave**
   ```python
   # app/core/metrics.py
   from dataclasses import dataclass
   from typing import Dict
   import time
   
   @dataclass
   class EncryptionMetrics:
       """Métricas del sistema de cifrado."""
       
       encryption_operations_total: int = 0
       decryption_operations_total: int = 0
       encryption_errors_total: int = 0
       decryption_errors_total: int = 0
       encryption_time_ms: list = None
       decryption_time_ms: list = None
       
       def __post_init__(self):
           if self.encryption_time_ms is None:
               self.encryption_time_ms = []
           if self.decryption_time_ms is None:
               self.decryption_time_ms = []
       
       def record_encryption(self, duration_ms: float, success: bool):
           """Registra operación de cifrado."""
           self.encryption_operations_total += 1
           if success:
               self.encryption_time_ms.append(duration_ms)
           else:
               self.encryption_errors_total += 1
       
       def record_decryption(self, duration_ms: float, success: bool):
           """Registra operación de descifrado."""
           self.decryption_operations_total += 1
           if success:
               self.decryption_time_ms.append(duration_ms)
           else:
               self.decryption_errors_total += 1
       
       def get_stats(self) -> Dict:
           """Obtiene estadísticas."""
           return {
               "total_operations": self.encryption_operations_total + self.decryption_operations_total,
               "encryption_operations": self.encryption_operations_total,
               "decryption_operations": self.decryption_operations_total,
               "total_errors": self.encryption_errors_total + self.decryption_errors_total,
               "error_rate": self._calculate_error_rate(),
               "avg_encryption_time_ms": self._avg(self.encryption_time_ms),
               "avg_decryption_time_ms": self._avg(self.decryption_time_ms),
           }
       
       def _calculate_error_rate(self) -> float:
           """Calcula tasa de error."""
           total = self.encryption_operations_total + self.decryption_operations_total
           if total == 0:
               return 0.0
           errors = self.encryption_errors_total + self.decryption_errors_total
           return (errors / total) * 100
       
       def _avg(self, values: list) -> float:
           """Calcula promedio."""
           return sum(values) / len(values) if values else 0.0
   
   # Instancia global
   encryption_metrics = EncryptionMetrics()
   ```

2. **Endpoint de Métricas**
   ```python
   # app/routes/monitoring.py
   from fastapi import APIRouter, Depends
   from app.core.metrics import encryption_metrics
   from app.core.security import get_current_admin_user
   
   router = APIRouter(prefix="/monitoring", tags=["monitoring"])
   
   @router.get("/encryption/metrics")
   def get_encryption_metrics(current_user = Depends(get_current_admin_user)):
       """Obtiene métricas del sistema de cifrado (solo admin)."""
       return encryption_metrics.get_stats()
   ```

3. **Alertas Automáticas**
   ```python
   # app/core/alerts.py
   from app.core.metrics import encryption_metrics
   import logging
   
   logger = logging.getLogger(__name__)
   
   def check_encryption_health():
       """Verifica salud del sistema de cifrado."""
       stats = encryption_metrics.get_stats()
       
       # Alerta: Tasa de errores > 1%
       if stats["error_rate"] > 1.0:
           logger.error(
               f"🚨 ALERTA: Tasa de errores de cifrado alta: {stats['error_rate']:.2f}%"
           )
       
       # Alerta: Tiempo de cifrado > 5ms
       if stats["avg_encryption_time_ms"] > 5.0:
           logger.warning(
               f"⚠️  ADVERTENCIA: Tiempo de cifrado elevado: {stats['avg_encryption_time_ms']:.2f}ms"
           )
       
       # Alerta: Tiempo de descifrado > 5ms
       if stats["avg_decryption_time_ms"] > 5.0:
           logger.warning(
               f"⚠️  ADVERTENCIA: Tiempo de descifrado elevado: {stats['avg_decryption_time_ms']:.2f}ms"
           )
   ```

---

## 🔄 Fase 8: Operación Continua

**Duración Estimada:** 1-2 días (implementación) + Continuo (operación)  
**Objetivo:** Establecer procedimientos para mantener la seguridad a largo plazo

### 8.1 Procedimiento de Rotación de Llaves

**Objetivo:** Rotar llaves de cifrado de forma segura y sin interrupciones

#### 8.1.1 Cuándo Rotar Llaves

- ✅ **Cada 6-12 meses** (recomendación estándar)
- ✅ **Después de una brecha de seguridad**
- ✅ **Cuando un empleado con acceso deja la organización**
- ✅ **Como parte de auditorías de seguridad**

#### 8.1.2 Procedimiento Paso a Paso

**Tareas:**

1. **Crear Script de Rotación**
   ```python
   # scripts/rotate_encryption_key.py
   #!/usr/bin/env python3
   """
   Script para rotar llaves de cifrado.
   
   Este script:
   1. Genera una nueva llave
   2. Actualiza .env con la nueva llave
   3. Mueve la llave antigua a ROTATION_KEYS
   4. Opcionalmente re-cifra datos existentes
   """
   
   import sys
   import os
   from pathlib import Path
   from cryptography.fernet import Fernet
   from datetime import datetime
   
   def generate_new_key():
       """Genera una nueva llave de cifrado."""
       key = Fernet.generate_key()
       return key.decode()
   
   def backup_env_file():
       """Crea backup del archivo .env."""
       env_path = Path(".env")
       if env_path.exists():
           backup_path = Path(f".env.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}")
           env_path.rename(backup_path)
           print(f"✅ Backup creado: {backup_path}")
           return backup_path
       return None
   
   def update_env_file(new_key: str, new_key_id: str, old_key: str, old_key_id: str):
       """Actualiza archivo .env con nueva llave."""
       # Leer .env actual
       with open(".env", "r") as f:
           lines = f.readlines()
       
       # Actualizar líneas
       updated_lines = []
       for line in lines:
           if line.startswith("ENCRYPTION_KEY="):
               updated_lines.append(f"ENCRYPTION_KEY={new_key}\n")
           elif line.startswith("KEY_ID_ACTUAL="):
               updated_lines.append(f"KEY_ID_ACTUAL={new_key_id}\n")
           elif line.startswith("ROTATION_KEYS="):
               # Agregar llave antigua a rotación
               existing = line.split("=", 1)[1].strip()
               if existing:
                   updated_lines.append(f"ROTATION_KEYS={existing},{old_key_id}:{old_key}\n")
               else:
                   updated_lines.append(f"ROTATION_KEYS={old_key_id}:{old_key}\n")
           else:
               updated_lines.append(line)
       
       # Escribir .env actualizado
       with open(".env", "w") as f:
           f.writelines(updated_lines)
       
       print("✅ Archivo .env actualizado")
   
   def main():
       print("🔄 ROTACIÓN DE LLAVES DE CIFRADO")
       print("=" * 80)
       
       # 1. Generar nueva llave
       print("\n1️⃣  Generando nueva llave...")
       new_key = generate_new_key()
       new_key_id = f"key_v{datetime.now().strftime('%Y%m')}"
       print(f"   Nueva llave ID: {new_key_id}")
       
       # 2. Leer llave actual
       print("\n2️⃣  Leyendo llave actual...")
       # ... código para leer .env ...
       
       # 3. Crear backup
       print("\n3️⃣  Creando backup...")
       backup_env_file()
       
       # 4. Actualizar .env
       print("\n4️⃣  Actualizando .env...")
       # update_env_file(new_key, new_key_id, old_key, old_key_id)
       
       # 5. Instrucciones finales
       print("\n✅ ROTACIÓN COMPLETADA")
       print("\n📋 Próximos pasos:")
       print("   1. Reiniciar la API para cargar nuevas llaves")
       print("   2. Verificar que la API funciona correctamente")
       print("   3. Opcionalmente, re-cifrar datos antiguos con:")
       print("      python scripts/recrypt_with_new_key.py")
       
   if __name__ == "__main__":
       main()
   ```

2. **Script de Re-Cifrado (Opcional)**
   ```python
   # scripts/recrypt_with_new_key.py
   """
   Re-cifra datos existentes con la nueva llave.
   
   ADVERTENCIA: Este proceso puede tomar tiempo en bases de datos grandes.
   Ejecutar en ventana de mantenimiento.
   """
   
   def recrypt_user_data(db):
       """Re-cifra datos de usuarios."""
       users = db.query(User).all()
       
       for user in users:
           # Descifrar con llave antigua (automático)
           # Modificar campo para forzar re-cifrado
           if user.celular:
               celular_descifrado = user.celular
               user.celular = celular_descifrado  # Se cifrará con nueva llave
       
       db.commit()
   ```

### 8.2 Políticas de Backups Cifrados

**Objetivo:** Proteger backups de la base de datos

**Tareas:**

1. **Script de Backup Automático**
   ```bash
   # scripts/backup_database.sh
   #!/bin/bash
   
   # Configuración
   DB_FILE="ssp.db"
   BACKUP_DIR="backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="$BACKUP_DIR/ssp_backup_$DATE.db"
   
   # Crear directorio de backups
   mkdir -p $BACKUP_DIR
   
   # Crear backup
   echo "📦 Creando backup de base de datos..."
   cp $DB_FILE $BACKUP_FILE
   
   # Comprimir
   echo "🗜️  Comprimiendo backup..."
   gzip $BACKUP_FILE
   
   # Eliminar backups antiguos (mantener últimos 30 días)
   find $BACKUP_DIR -name "ssp_backup_*.db.gz" -mtime +30 -delete
   
   echo "✅ Backup completado: $BACKUP_FILE.gz"
   ```

2. **Cron Job para Backups Automáticos**
   ```bash
   # Agregar a crontab
   # Backup diario a las 2 AM
   0 2 * * * /path/to/API/scripts/backup_database.sh
   ```

### 8.3 Revisión de Accesos y Permisos

**Objetivo:** Auditar quién tiene acceso a datos cifrados

**Tareas:**

1. **Documentar Accesos**
   ```markdown
   # docs/ACCESOS_CIFRADO.md
   
   ## Acceso a Llaves de Cifrado
   
   ### Producción
   - **Administrador de Sistema**: Acceso completo a .env
   - **DevOps Lead**: Acceso de solo lectura
   - **Desarrolladores**: Sin acceso directo
   
   ### Desarrollo
   - **Todos los desarrolladores**: Acceso a .env.example
   - **Llaves de desarrollo**: Diferentes a producción
   
   ## Procedimiento de Revocación
   
   1. Generar nueva llave
   2. Actualizar .env en servidor
   3. Reiniciar API
   4. Notificar al equipo
   ```

2. **Auditoría Trimestral**
   - Revisar quién tiene acceso a llaves
   - Verificar que llaves de dev/prod son diferentes
   - Rotar llaves si es necesario

### 8.4 Documentación Operacional

**Objetivo:** Capacitar al equipo en gestión de llaves

**Tareas:**

1. **Manual de Operaciones**
   ```markdown
   # docs/MANUAL_OPERACIONES_CIFRADO.md
   
   ## Procedimientos Operacionales
   
   ### Rotación de Llaves (Cada 6 meses)
   1. Ejecutar `python scripts/rotate_encryption_key.py`
   2. Reiniciar API
   3. Verificar funcionamiento
   4. Documentar en bitácora
   
   ### Recuperación ante Desastres
   1. Restaurar backup de BD
   2. Restaurar backup de .env
   3. Verificar llaves
   4. Reiniciar API
   
   ### Troubleshooting
   - Error de descifrado → Verificar ROTATION_KEYS
   - Llave no encontrada → Agregar a ROTATION_KEYS
   - Rendimiento lento → Revisar métricas
   ```

2. **Capacitación del Equipo**
   - Sesión de training sobre gestión de llaves
   - Simulacro de rotación de llaves
   - Documentar lecciones aprendidas

---

## ✅ Checklist de Implementación

### Fase 7: Testing y Observabilidad
- [ ] Configurar tests de regresión en CI/CD
- [ ] Crear tests de endpoints con cifrado
- [ ] Implementar tests de rendimiento
- [ ] Configurar logging estructurado
- [ ] Implementar métricas de cifrado
- [ ] Crear endpoint de monitoreo
- [ ] Configurar alertas automáticas

### Fase 8: Operación Continua
- [ ] Crear script de rotación de llaves
- [ ] Documentar procedimiento de rotación
- [ ] Implementar backups automáticos
- [ ] Configurar cron jobs
- [ ] Documentar accesos y permisos
- [ ] Crear manual de operaciones
- [ ] Capacitar al equipo

---

## 📊 Métricas de Éxito

### Técnicas
- ✅ Cobertura de tests > 90%
- ✅ Tiempo de respuesta < 50ms adicional
- ✅ Tasa de errores < 0.1%
- ✅ Backups automáticos funcionando

### Operacionales
- ✅ Procedimiento de rotación documentado y probado
- ✅ Equipo capacitado en gestión de llaves
- ✅ Alertas configuradas y funcionando
- ✅ Auditorías trimestrales programadas

---

**Última actualización**: 2025-01-07  
**Versión**: 1.0

