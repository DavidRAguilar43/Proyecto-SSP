# Plan de Migración del Sistema de Permisos

## Funciones Nuevas Creadas

### ✅ `check_administrative_access()`
- **Reemplaza**: `check_admin_or_coordinador_role()`, `check_personal_role()` (para ops administrativas)
- **Permite**: admin, coordinador
- **Uso**: Gestión de personas, citas, reportes, configuraciones

### ✅ `check_end_user_access()`
- **Reemplaza**: `check_personal_role()`, `check_docente_role()` (para ops de usuario)
- **Permite**: docente, personal, alumno
- **Uso**: Perfil propio, cuestionarios, funciones básicas

### ✅ Mantenidas sin cambios
- `check_admin_role()` - Solo admin (eliminaciones)
- `check_coordinador_role()` - Admin + coordinador
- `check_deletion_permission()` - Solo admin (eliminaciones)

## Plan de Migración por Archivo

### 1. catalogos.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → operaciones CRUD administrativas
- ✅ **Mantener**: `get_current_active_user()` → lectura de catálogos
- ✅ **Mantener**: Sin autenticación → catálogos activos públicos

### 2. persona.py ⚠️ CRÍTICO
- ❌ **Cambiar**: `check_personal_role()` → `check_administrative_access()`
  - Endpoints: `create_persona()`, `read_personas()`, `update_persona()`
- ✅ **Mantener**: `check_admin_role()` → bulk operations
- ✅ **Mantener**: `check_deletion_permission()` → eliminaciones
- ✅ **Mantener**: `get_current_active_user()` → perfil propio

### 3. contacto_emergencia.py ⚠️ CRÍTICO  
- ❌ **Cambiar**: `check_personal_role()` → `check_end_user_access()`
  - Endpoints: CRUD individual de contactos
- ✅ **Mantener**: `check_admin_role()` → bulk operations

### 4. cohorte.py ⚠️ CRÍTICO
- ❌ **Cambiar**: `check_personal_role()` → `check_administrative_access()`
  - Endpoints: Todos los CRUD de cohortes

### 5. personal.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → gestión administrativa

### 6. grupo.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → gestión administrativa

### 7. programa_educativo.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → gestión administrativa

### 8. unidad.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → gestión administrativa

### 9. cuestionario.py
- ✅ **Mantener**: `check_admin_or_coordinador_role()` → gestión administrativa

### 10. atencion.py
- ✅ **Mantener**: `check_personal_role()` → gestión administrativa (por ahora)

### 11. citas.py
- ✅ **Mantener**: `check_admin_role()` → bulk delete
- ✅ **Mantener**: `get_current_active_user()` → operaciones de usuario

### 12. notificaciones.py
- ✅ **Mantener**: `check_admin_role()` → gestión de notificaciones

## Orden de Migración

### Fase 1: Archivos Críticos (Rompen funcionalidad actual)
1. **contacto_emergencia.py** - Usuarios finales no pueden gestionar contactos
2. **persona.py** - Usuarios finales no pueden crear personas
3. **cohorte.py** - Solo admin/coordinador pueden gestionar cohortes

### Fase 2: Validación y Pruebas
- Probar cada cambio individualmente
- Verificar que usuarios finales pueden acceder a sus funciones
- Verificar que admin/coordinador mantienen acceso administrativo

### Fase 3: Limpieza (Opcional)
- Reemplazar `check_admin_or_coordinador_role()` por `check_administrative_access()`
- Eliminar funciones DEPRECATED

## Validaciones Adicionales Necesarias

### Para Usuarios Finales
- Solo pueden ver/editar su propia información
- No pueden ver información de otros usuarios
- No pueden acceder a funciones administrativas

### Para Administradores
- Mantienen acceso completo a todo
- Pueden eliminar registros
- Pueden ver información de todos los usuarios

### Para Coordinadores  
- Acceso administrativo completo excepto eliminaciones
- Pueden ver información de todos los usuarios
- No pueden eliminar registros

## Riesgos y Precauciones

### ⚠️ Alto Riesgo
- **contacto_emergencia.py**: Usuarios no podrán gestionar sus contactos
- **persona.py**: Usuarios no podrán crear/editar personas
- **cohorte.py**: Solo admin/coordinador podrán gestionar cohortes

### ✅ Bajo Riesgo
- **catalogos.py**: Ya funciona correctamente
- **citas.py**: Ya tiene validaciones correctas
- **notificaciones.py**: Solo admin debe acceder

## Próximos Pasos

1. Migrar archivos críticos uno por uno
2. Probar cada cambio antes del siguiente
3. Verificar funcionalidad con diferentes roles
4. Documentar cambios realizados
