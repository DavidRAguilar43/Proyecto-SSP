# Scripts de Base de Datos - Sistema SSP

Este directorio contiene scripts para la gestión completa de la base de datos del Sistema de Seguimiento Psicopedagógico.

## 📋 Scripts Disponibles

### 🚀 Inicialización Completa

#### `init_database.py`
**Propósito:** Inicialización completa de la base de datos desde cero.

**Características:**
- ✅ Elimina todas las tablas existentes
- ✅ Crea todas las tablas del sistema
- ✅ Crea usuario administrador por defecto
- ✅ Pobla catálogos con datos iniciales
- ✅ Verificación completa del proceso
- ⚠️ Requiere confirmación del usuario

**Uso:**
```bash
cd API
python scripts/init_database.py
```

**Credenciales creadas:**
- 📧 Email: `admin@uabc.edu.mx`
- 🔑 Password: `12345678`
- 👤 Rol: `admin`

---

#### `reset_database.py`
**Propósito:** Reset rápido sin confirmación interactiva.

**Características:**
- ✅ Reset automático sin confirmación
- ✅ Datos mínimos esenciales
- ✅ Ideal para desarrollo y testing
- ⚡ Ejecución rápida

**Uso:**
```bash
cd API
python scripts/reset_database.py
```

---

### 🔍 Verificación y Diagnóstico

#### `check_database.py`
**Propósito:** Verificación completa del estado de la base de datos.

**Verifica:**
- 📁 Archivo de base de datos
- 🗄️ Existencia de tablas
- 👤 Usuario administrador
- 📊 Estado de catálogos
- 👥 Datos de personas
- ⏳ Elementos pendientes

**Uso:**
```bash
cd API
python scripts/check_database.py
```

---

### 📊 Catálogos Específicos

#### `setup_catalogos.py`
**Propósito:** Configuración específica de catálogos.

**Uso:**
```bash
cd API
python scripts/setup_catalogos.py
```

#### `seed_catalogos.py`
**Propósito:** Poblar solo los catálogos con datos iniciales.

**Uso:**
```bash
cd API
python scripts/seed_catalogos.py
```

---

### 🔄 Migración y Mantenimiento

#### `migrate_cohorte_simplification.py`
**Propósito:** Migración específica para simplificación de cohortes.

**Uso:**
```bash
cd API
python scripts/migrate_cohorte_simplification.py
```

---

### 👤 Administración de Usuarios

#### `create_admin_user.py`
**Propósito:** Crear o actualizar el usuario administrador principal.

**Características:**
- ✅ Crea el admin si no existe
- 🔄 Actualiza contraseña y activa al admin existente
- 🔐 Usa `admin123` como contraseña predeterminada

**Uso:**
```bash
cd API
python scripts/create_admin_user.py
```

---

## 🛠️ Flujo de Trabajo Recomendado

### 1. Primera Instalación
```bash
# Eliminar base de datos existente (si existe)
rm -f *.db

# Inicializar base de datos completa
python scripts/init_database.py
```

### 2. Desarrollo Diario
```bash
# Reset rápido para testing
python scripts/reset_database.py

# Verificar estado
python scripts/check_database.py
```

### 3. Verificación de Problemas
```bash
# Diagnóstico completo
python scripts/check_database.py

# Si hay problemas, reinicializar
python scripts/init_database.py
```

---

## 📊 Datos Iniciales Creados

### Usuario Administrador
- **Email:** admin@uabc.edu.mx
- **Password (init_database/reset_database):** 12345678
- **Password (create_admin_user):** admin123
- **Rol:** admin
- **Matrícula:** ADMIN001

### Catálogos Poblados

#### Religiones
- Católica, Protestante, Judía, Musulmana
- Budista, Hinduista, Otra, Ninguna

#### Grupos Étnicos
- Mestizo, Indígena, Afrodescendiente
- Asiático, Europeo, Otro, Prefiero no decir

#### Discapacidades
- Ninguna, Visual, Auditiva, Motriz
- Intelectual, Psicosocial, Múltiple, Otra

---

## ⚠️ Consideraciones Importantes

### Seguridad
- 🔐 Cambiar password del admin en producción
- 🛡️ Los scripts eliminan TODOS los datos existentes
- 💾 Hacer backup antes de ejecutar en producción

### Desarrollo
- 🧪 Scripts optimizados para desarrollo local
- 🔄 Reset rápido para testing frecuente
- 📋 Verificación automática de integridad

### Producción
- ⚠️ NO usar `reset_database.py` en producción
- 📊 Usar `check_database.py` para monitoreo
- 🔄 Ejecutar migraciones específicas cuando sea necesario

---

## 🐛 Solución de Problemas

### Error: "No such table"
```bash
# Reinicializar base de datos
python scripts/init_database.py
```

### Error: "No admin user found"
```bash
# Verificar estado
python scripts/check_database.py

# Recrear si es necesario
python scripts/reset_database.py
```

### Error: "Catálogos vacíos"
```bash
# Poblar solo catálogos
python scripts/seed_catalogos.py
```

### Error: "Foreign key constraint"
```bash
# Reset completo
python scripts/init_database.py
```

---

## 📝 Logs y Debugging

Todos los scripts proporcionan salida detallada:
- ✅ Operaciones exitosas
- ❌ Errores con descripción
- ℹ️ Información adicional
- ⚠️ Advertencias importantes

Para debugging adicional, revisar:
- Logs de SQLAlchemy
- Archivos de base de datos generados
- Estructura de tablas creadas

---

## 🔄 Actualizaciones Futuras

Para agregar nuevos scripts:
1. Seguir el patrón de naming existente
2. Incluir documentación en este README
3. Agregar verificaciones de error apropiadas
4. Mantener compatibilidad con scripts existentes
