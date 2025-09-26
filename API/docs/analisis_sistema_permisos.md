# Análisis del Sistema de Permisos Actual

## Estado Actual de las Funciones de Permisos

### Funciones Existentes en `deps.py`

1. **`check_admin_role()`** - Solo admin
   - Usado para: eliminaciones, bulk operations, notificaciones
   - Endpoints: bulk-delete, notificaciones, bulk-create/update

2. **`check_coordinador_role()`** - Admin + coordinador  
   - Usado para: acceso administrativo sin eliminaciones
   - Endpoints: catalogos (lectura)

3. **`check_admin_or_coordinador_role()`** - Admin + coordinador
   - Usado para: gestión administrativa general
   - Endpoints: catalogos (CRUD), personal, grupos, programas, unidades

4. **`check_user_level_access()`** - Todos los roles autenticados
   - Actualmente no se usa en ningún endpoint

5. **`check_personal_role()` (DEPRECATED)** - Admin + coordinador
   - Usado incorrectamente para operaciones administrativas
   - Endpoints: personas, contactos, cohortes

6. **`check_docente_role()` (DEPRECATED)** - Admin + coordinador
   - Actualmente no se usa

7. **`check_deletion_permission()`** - Solo admin
   - Usado para: eliminaciones individuales
   - Endpoints: personas/{id}

8. **`get_current_active_user()`** - Todos los usuarios autenticados
   - Usado para: perfil propio, lectura de catálogos, citas propias

## Análisis por Tipo de Operación

### 🔴 OPERACIONES ADMINISTRATIVAS (Requieren admin/coordinador)
- **Gestión de personas**: Crear, actualizar, listar todas
- **Gestión de catálogos**: CRUD de religiones, grupos étnicos, discapacidades
- **Gestión de personal**: CRUD de registros de personal
- **Gestión de grupos**: CRUD de grupos académicos
- **Gestión de programas educativos**: CRUD de programas
- **Gestión de unidades**: CRUD de unidades académicas
- **Notificaciones**: Ver y procesar notificaciones de registro
- **Reportes**: Acceso a reportes y estadísticas

### 🟡 OPERACIONES DE USUARIO FINAL (Requieren acceso básico)
- **Perfil propio**: Ver y editar información personal
- **Cuestionarios**: Completar cuestionarios psicopedagógicos
- **Citas**: Solicitar y ver citas propias (alumnos)
- **Catálogos públicos**: Leer opciones para formularios
- **Auto-registro**: Registro inicial de usuarios

### 🔴 OPERACIONES CRÍTICAS (Solo admin)
- **Eliminaciones**: Individuales y bulk delete
- **Bulk operations**: Creación y actualización masiva
- **Gestión de notificaciones**: Aprobar/rechazar registros

## Problemas Identificados

### 1. Uso Incorrecto de `check_personal_role()`
- **Problema**: Se usa para operaciones administrativas
- **Afectados**: personas, contactos, cohortes
- **Impacto**: Personal/docente/alumno NO pueden acceder a estas operaciones

### 2. Falta de Separación Clara
- **Problema**: No hay distinción entre acceso administrativo y usuario final
- **Impacto**: Usuarios finales no pueden realizar operaciones básicas

### 3. Funciones Redundantes
- **Problema**: `check_coordinador_role()` y `check_admin_or_coordinador_role()` hacen lo mismo
- **Impacto**: Confusión en el código

### 4. Validaciones Inconsistentes
- **Problema**: Algunos endpoints usan validaciones manuales en lugar de decoradores
- **Ejemplo**: `read_persona()` valida manualmente roles

## Endpoints por Categoría de Acceso

### Solo Admin
- `POST /personas/bulk-*`
- `POST /*/bulk-delete`
- `DELETE /personas/{id}`
- `GET /notificaciones/*`
- `POST /notificaciones/*/procesar`

### Admin + Coordinador (Administrativo)
- `POST /catalogos/*` (crear)
- `PUT /catalogos/*` (actualizar)
- `GET /catalogos/pendientes`
- `POST /personal/*`
- `POST /grupos/*`
- `POST /programas-educativos/*`
- `POST /unidades/*`

### Todos los Usuarios Autenticados
- `GET /personas/mi-perfil`
- `PUT /personas/mi-perfil`
- `GET /catalogos/*/activas`
- `POST /citas/solicitar` (solo alumnos)
- `GET /citas/mis-citas` (solo alumnos)
- `GET /cuestionario-psicopedagogico/mi-cuestionario`

### Público (Sin autenticación)
- `POST /auth/login`
- `POST /personas/registro`
- `GET /catalogos/*/activas` (algunos)

## Recomendaciones para Refactorización

### 1. Nuevas Funciones de Permisos
- `check_administrative_access()` → admin + coordinador
- `check_end_user_access()` → docente + personal + alumno
- Mantener `check_admin_role()` para eliminaciones

### 2. Migración de Endpoints
- Operaciones administrativas → `check_administrative_access()`
- Operaciones de usuario → `check_end_user_access()`
- Eliminaciones → mantener `check_admin_role()`

### 3. Validaciones Adicionales
- Usuarios finales solo pueden ver/editar su propia información
- Admin/coordinador pueden ver información de todos
