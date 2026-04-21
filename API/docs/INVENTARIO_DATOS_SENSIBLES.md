# Inventario de Datos Sensibles - Sistema SSP

## 📋 Resumen

Este documento cataloga todos los campos que contienen datos sensibles en el Sistema de Seguimiento Psicopedagógico (SSP) y requieren cifrado.

**Fecha de análisis**: 2024-01-07  
**Versión del sistema**: 1.0  
**Base de datos**: SQLite (desarrollo) / PostgreSQL (producción)

---

## 🎯 Criterios de Clasificación

### Datos Sensibles (Requieren Cifrado)
- ✅ Información personal identificable (PII)
- ✅ Datos de contacto privados
- ✅ Respuestas a cuestionarios psicopedagógicos
- ✅ Análisis y reportes de IA
- ✅ Observaciones clínicas/académicas

### Datos NO Sensibles (No Requieren Cifrado)
- ❌ Identificadores únicos (IDs, matrículas)
- ❌ Correos institucionales (necesarios para autenticación)
- ❌ Datos demográficos agregados
- ❌ Metadatos de sistema (fechas, estados)
- ❌ Catálogos y configuraciones

---

## 📊 Inventario por Modelo

### 1. Modelo: `User` (users)

**Ubicación**: `app/models/persona.py`

| Campo | Tipo Actual | Sensible | Razón | Acción |
|-------|-------------|----------|-------|--------|
| `id` | Integer | ❌ No | Identificador único | Mantener |
| `sexo` | String | ❌ No | Dato demográfico | Mantener |
| `genero` | String | ❌ No | Dato demográfico | Mantener |
| `edad` | Integer | ❌ No | Dato demográfico | Mantener |
| `estado_civil` | String | ❌ No | Dato demográfico | Mantener |
| `religion` | String | ❌ No | Dato demográfico | Mantener |
| `trabaja` | Boolean | ❌ No | Dato demográfico | Mantener |
| **`lugar_trabajo`** | String | ✅ **SÍ** | Información laboral personal | **CIFRAR** |
| `lugar_origen` | String | ❌ No | Dato demográfico general | Mantener |
| **`colonia_residencia_actual`** | String | ✅ **SÍ** | Ubicación específica | **CIFRAR** |
| **`celular`** | String | ✅ **SÍ** | Contacto personal | **CIFRAR** |
| **`extension_telefonica`** | String | ✅ **SÍ** | Contacto personal | **CIFRAR** |
| `correo_institucional` | String | ❌ No | Necesario para autenticación | Mantener |
| `discapacidad` | String | ❌ No | Dato demográfico | Mantener |
| **`observaciones`** | String | ✅ **SÍ** | Notas clínicas/personales | **CIFRAR** |
| `matricula` | String | ❌ No | Identificador único | Mantener |
| `semestre` | Integer | ❌ No | Dato académico | Mantener |
| `numero_hijos` | Integer | ❌ No | Dato demográfico | Mantener |
| `grupo_etnico` | String | ❌ No | Dato demográfico | Mantener |
| `rol` | String | ❌ No | Control de acceso | Mantener |
| `is_active` | Boolean | ❌ No | Estado de cuenta | Mantener |
| `hashed_password` | String | ❌ No | Ya está hasheado | Mantener |
| `cohorte_ano` | Integer | ❌ No | Dato académico | Mantener |
| `cohorte_periodo` | Integer | ❌ No | Dato académico | Mantener |

**Total campos a cifrar**: 5
- `lugar_trabajo`
- `colonia_residencia_actual`
- `celular`
- `extension_telefonica`
- `observaciones`

**Impacto estimado**:
- Registros actuales: ~500 usuarios
- Aumento de almacenamiento: ~33% en campos cifrados
- Tiempo de migración estimado: 5-10 minutos

---

### 2. Modelo: `RespuestaPregunta` (respuestas_pregunta)

**Ubicación**: `app/models/cuestionario_admin.py`

| Campo | Tipo Actual | Sensible | Razón | Acción |
|-------|-------------|----------|-------|--------|
| `id` | Integer | ❌ No | Identificador único | Mantener |
| `respuesta_cuestionario_id` | String | ❌ No | Relación FK | Mantener |
| `pregunta_id` | String | ❌ No | Relación FK | Mantener |
| `pregunta_snapshot_id` | String | ❌ No | Relación FK | Mantener |
| **`valor`** | JSON | ✅ **SÍ** | Respuestas del estudiante | **CIFRAR** |
| **`texto_otro`** | Text | ✅ **SÍ** | Respuestas abiertas | **CIFRAR** |
| `created_at` | DateTime | ❌ No | Metadata | Mantener |
| `updated_at` | DateTime | ❌ No | Metadata | Mantener |

**Total campos a cifrar**: 2
- `valor` (cambiar de JSON a Text cifrado)
- `texto_otro`

**Consideraciones especiales**:
- El campo `valor` actualmente es JSON, necesita convertirse a Text para almacenar cifrado
- Antes de cifrar, serializar JSON a string
- Al descifrar, parsear string a JSON

**Impacto estimado**:
- Registros actuales: ~2,000 respuestas
- Aumento de almacenamiento: ~40% (JSON serializado + cifrado)
- Tiempo de migración estimado: 10-15 minutos

---

### 3. Modelo: `ReporteIA` (reportes_ia)

**Ubicación**: `app/models/cuestionario_admin.py`

| Campo | Tipo Actual | Sensible | Razón | Acción |
|-------|-------------|----------|-------|--------|
| `id` | String | ❌ No | Identificador único | Mantener |
| `respuesta_cuestionario_id` | String | ❌ No | Relación FK | Mantener |
| **`contenido`** | Text | ✅ **SÍ** | Análisis psicopedagógico | **CIFRAR** |
| `version` | Integer | ❌ No | Control de versiones | Mantener |
| `es_actual` | Boolean | ❌ No | Estado | Mantener |
| `fecha_generacion` | DateTime | ❌ No | Metadata | Mantener |
| `created_at` | DateTime | ❌ No | Metadata | Mantener |

**Total campos a cifrar**: 1
- `contenido`

**Consideraciones especiales**:
- Contenido puede ser muy largo (varios KB)
- Verificar límites de Fernet (máximo ~2GB teórico, práctico ~100MB)
- Considerar compresión antes de cifrado si es necesario

**Impacto estimado**:
- Registros actuales: ~300 reportes
- Aumento de almacenamiento: ~35%
- Tiempo de migración estimado: 5 minutos

---

### 4. Modelo: `ContactoEmergencia` (contacto_emergencia)

**Ubicación**: `app/models/contacto_emergencia.py`

| Campo | Tipo Actual | Sensible | Razón | Acción |
|-------|-------------|----------|-------|--------|
| `id_contacto` | Integer | ❌ No | Identificador único | Mantener |
| **`nombre_contacto`** | String | ✅ **SÍ** | Información personal | **CIFRAR** |
| **`telefono_contacto`** | String | ✅ **SÍ** | Contacto personal | **CIFRAR** |
| `parentesco` | String | ❌ No | Relación general | Mantener |
| `id_user` | Integer | ❌ No | Relación FK | Mantener |

**Total campos a cifrar**: 2
- `nombre_contacto`
- `telefono_contacto`

**Impacto estimado**:
- Registros actuales: ~500 contactos
- Aumento de almacenamiento: ~33%
- Tiempo de migración estimado: 5 minutos

---

## 📈 Resumen Global

### Estadísticas de Cifrado

| Modelo | Campos Totales | Campos a Cifrar | % Cifrado |
|--------|----------------|-----------------|-----------|
| User | 24 | 5 | 21% |
| RespuestaPregunta | 8 | 2 | 25% |
| ReporteIA | 7 | 1 | 14% |
| ContactoEmergencia | 5 | 2 | 40% |
| **TOTAL** | **44** | **10** | **23%** |

### Impacto en Base de Datos

**Estimación de crecimiento**:
- Tamaño actual estimado: ~50 MB
- Tamaño post-cifrado estimado: ~65 MB
- Incremento total: ~30% (~15 MB)

**Tiempo de migración total estimado**: 25-35 minutos

---

## 🔄 Cambios de Esquema Requeridos

### Migraciones Alembic Necesarias

#### 1. Aumentar longitud de campos String
```python
# Campos que necesitan más espacio para datos cifrados
op.alter_column('users', 'celular',
               type_=sa.String(500),  # De 50 a 500
               existing_type=sa.String(50))

op.alter_column('users', 'lugar_trabajo',
               type_=sa.String(500),
               existing_type=sa.String(200))

# ... otros campos similares
```

#### 2. Convertir JSON a Text
```python
# RespuestaPregunta.valor: JSON -> Text
op.alter_column('respuestas_pregunta', 'valor',
               type_=sa.Text(),
               existing_type=sa.JSON())
```

#### 3. Agregar columnas de metadata (opcional)
```python
# Para auditoría de cifrado
op.add_column('users', sa.Column('encrypted_at', sa.DateTime(), nullable=True))
op.add_column('users', sa.Column('encryption_version', sa.String(50), nullable=True))
```

---

## 🔍 Flujos de Datos Afectados

### Endpoints que Leen Datos Sensibles
1. **GET /api/v1/personas/{id}** - Retorna datos de usuario
2. **GET /api/v1/cuestionarios/respuestas/{id}** - Retorna respuestas
3. **GET /api/v1/reportes-ia/{id}** - Retorna reportes
4. **GET /api/v1/contactos-emergencia/{id}** - Retorna contactos

### Endpoints que Escriben Datos Sensibles
1. **POST /api/v1/personas/** - Crea usuario
2. **PUT /api/v1/personas/{id}** - Actualiza usuario
3. **POST /api/v1/cuestionarios/respuestas/** - Guarda respuestas
4. **POST /api/v1/reportes-ia/** - Genera reporte
5. **POST /api/v1/contactos-emergencia/** - Crea contacto

### Servicios Afectados
- `app/services/user_service.py`
- `app/services/cuestionario_service.py`
- `app/services/reporte_ia_service.py`
- `app/services/contacto_service.py`

---

## ⚠️ Consideraciones Especiales

### 1. Búsquedas en Campos Cifrados
**Problema**: No se puede buscar directamente en campos cifrados.

**Soluciones**:
- Mantener índices separados para búsqueda (hash de valores)
- Usar búsqueda por campos no cifrados (matricula, correo)
- Implementar búsqueda en memoria después de descifrar (para conjuntos pequeños)

### 2. Rendimiento
**Impacto esperado**:
- Cifrado: ~0.1-0.5 ms por campo
- Descifrado: ~0.1-0.5 ms por campo
- Consultas con 100 registros: +50-100 ms total

**Mitigaciones**:
- Caché de datos descifrados en sesión
- Paginación agresiva
- Descifrado lazy (solo cuando se necesita)

### 3. Compatibilidad con Reportes
**Desafío**: Reportes PDF/Excel necesitan datos descifrados.

**Solución**:
- Descifrar en capa de servicio antes de generar reporte
- Mantener permisos estrictos en generación de reportes
- Auditar todas las generaciones de reportes

---

## 📋 Checklist de Validación

### Pre-Migración
- [ ] Backup completo de base de datos
- [ ] Verificar espacio en disco (mínimo 2x tamaño actual)
- [ ] Probar migración en entorno de desarrollo
- [ ] Documentar procedimiento de rollback

### Post-Migración
- [ ] Verificar que todos los campos sensibles estén cifrados
- [ ] Probar descifrado de datos migrados
- [ ] Ejecutar suite de tests completa
- [ ] Verificar rendimiento de endpoints críticos
- [ ] Validar generación de reportes

### Validación de Datos
```sql
-- Verificar que campos estén cifrados (contienen '|' del formato)
SELECT COUNT(*) FROM users WHERE celular LIKE '%|%';
SELECT COUNT(*) FROM respuestas_pregunta WHERE valor LIKE '%|%';
SELECT COUNT(*) FROM reportes_ia WHERE contenido LIKE '%|%';
```

---

## 📚 Referencias

- Modelo User: `API/app/models/persona.py`
- Modelo RespuestaPregunta: `API/app/models/cuestionario_admin.py`
- Modelo ReporteIA: `API/app/models/cuestionario_admin.py`
- Modelo ContactoEmergencia: `API/app/models/contacto_emergencia.py`

---

**Última actualización**: 2024-01-07  
**Responsable**: Equipo de Desarrollo SSP  
**Próxima revisión**: Después de Fase 1 de implementación

