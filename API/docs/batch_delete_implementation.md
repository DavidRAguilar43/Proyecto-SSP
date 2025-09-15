# Implementación de Batch Delete

## Resumen

Se ha implementado la funcionalidad de eliminación por lotes (batch delete) en todas las tablas del dashboard del Sistema de Seguimiento Psicopedagógico, respetando los roles y niveles de acceso establecidos.

## Roles y Permisos

### 🔴 Admin
- **Permisos completos**: Puede crear, editar, ver y **eliminar** (individual y por lotes)
- **Acceso a batch delete**: ✅ SÍ
- **Restricciones**: Ninguna

### 🟡 Coordinador  
- **Permisos limitados**: Puede crear, editar y ver
- **Acceso a batch delete**: ❌ NO
- **Restricciones**: No puede eliminar registros (individual ni por lotes)

### 🔵 Otros roles (Personal, Docente, Alumno)
- **Permisos de usuario**: Solo acceso de lectura a nivel usuario
- **Acceso a batch delete**: ❌ NO
- **Restricciones**: No pueden acceder a funciones administrativas

## Endpoints Implementados

### Backend (API)

#### Nuevos endpoints de bulk delete:
```
POST /catalogos/religiones/bulk-delete
POST /catalogos/grupos-etnicos/bulk-delete  
POST /catalogos/discapacidades/bulk-delete
POST /citas/bulk-delete
```

#### Endpoints existentes (ya implementados):
```
POST /personas/bulk-delete
POST /atenciones/bulk-delete
POST /contactos-emergencia/bulk-delete
POST /personal/bulk-delete
POST /cuestionarios/bulk-delete
POST /grupos/bulk-delete
POST /programas-educativos/bulk-delete
DELETE /unidades/bulk-delete/
```

### Esquemas de datos
- Agregados esquemas `*BulkDelete` en todos los módulos
- Estructura consistente: `{"ids": [1, 2, 3]}`

## Frontend

### Componentes Creados

#### 1. `useBulkSelection` Hook
- Maneja la lógica de selección múltiple
- Funciones: `handleSelectAll`, `handleSelectItem`, `clearSelection`
- Estados: `selectedIds`, `isAllSelected`, `isIndeterminate`

#### 2. `BulkDeleteToolbar` Component
- Barra flotante que aparece cuando hay elementos seleccionados
- Muestra contador de elementos seleccionados
- Botones de eliminar y cancelar selección

#### 3. `BulkDeleteDialog` Component
- Diálogo de confirmación para eliminación masiva
- Muestra advertencias específicas por tipo de entidad
- Previene eliminaciones accidentales

#### 4. `GenericTableWithBulkDelete` Component
- Tabla reutilizable con funcionalidad de batch delete integrada
- Configurable por tipo de entidad
- Maneja permisos automáticamente según rol de usuario

### Servicios API Actualizados

Agregadas funciones `bulkDelete` en todos los servicios:
- `personasService.bulkDelete(ids)`
- `catalogosApi.religiones.bulkDelete(ids)`
- `catalogosApi.gruposEtnicos.bulkDelete(ids)`
- `catalogosApi.discapacidades.bulkDelete(ids)`
- `programasEducativosApi.bulkDelete(ids)`
- `unidadesApi.bulkDelete(ids)`
- `gruposApi.bulkDelete(ids)`
- `atencionesApi.bulkDelete(ids)`
- `citasApi.bulkDelete(ids)`

## Páginas Actualizadas

### Implementación Completa
- ✅ **PersonasPage**: Tabla actualizada con batch delete funcional
- ✅ **UnidadesPage**: Migrada a tabla genérica con batch delete

### Pendientes de Migración
- 🔄 **AtencionesPage**: Usar tabla genérica
- 🔄 **GruposPage**: Usar tabla genérica  
- 🔄 **ProgramasEducativosPage**: Usar tabla genérica
- 🔄 **SolicitudesPendientesPage**: Usar tabla genérica
- 🔄 **CuestionariosPendientesPage**: Usar tabla genérica
- 🔄 **CatalogosPage**: Usar tabla genérica

## Seguridad

### Validación de Permisos
- **Backend**: Uso de `check_admin_role` en todos los endpoints de bulk delete
- **Frontend**: UI de batch delete solo visible para rol `admin`
- **Middleware**: Interceptor de autenticación valida tokens

### Prevención de Errores
- Confirmación obligatoria antes de eliminar
- Mensajes de advertencia específicos por entidad
- Validación de IDs existentes antes de eliminar
- Manejo de errores con mensajes informativos

## Pruebas

### Scripts de Prueba Creados

#### 1. `test_bulk_delete.py`
- Prueba todos los endpoints de bulk delete
- Verifica respuestas correctas de la API
- Usa IDs inexistentes para evitar eliminar datos reales

#### 2. `test_role_permissions.py`  
- Verifica permisos por rol
- Confirma que solo admin puede usar bulk delete
- Valida que coordinador reciba 403 Forbidden

#### 3. `TestBulkDeletePage.tsx`
- Página de prueba en frontend
- Permite probar la UI de batch delete
- Datos de prueba simulados

### Comandos de Prueba
```bash
# Probar endpoints del backend
cd API/scripts
python test_bulk_delete.py

# Probar permisos de roles  
python test_role_permissions.py

# Verificar compilación del frontend
cd Frontend/ssp-frontend
npm run build
```

## Uso

### Para Administradores
1. Navegar a cualquier página con tabla (ej: Personas, Unidades)
2. Seleccionar elementos usando checkboxes
3. Aparece barra flotante con contador
4. Hacer clic en "Eliminar" 
5. Confirmar en el diálogo de advertencia
6. Los elementos se eliminan y la tabla se actualiza

### Para Coordinadores
- Pueden ver y usar todas las funciones excepto eliminación
- No ven checkboxes de selección ni botones de eliminar
- Reciben mensaje de error si intentan acceder a endpoints de eliminación

## Próximos Pasos

1. **Migrar páginas restantes** a la tabla genérica
2. **Crear usuario coordinador de prueba** para validar permisos
3. **Ejecutar pruebas completas** en entorno de desarrollo
4. **Documentar casos de uso** específicos por módulo
5. **Optimizar rendimiento** para eliminaciones masivas grandes

## Archivos Modificados/Creados

### Backend
- `API/app/schemas/catalogos.py` - Agregados esquemas bulk delete
- `API/app/schemas/cita.py` - Agregados esquemas bulk delete  
- `API/app/routes/catalogos.py` - Endpoints bulk delete catálogos
- `API/app/routes/citas.py` - Endpoint bulk delete citas
- `API/app/services/api.ts` - Funciones bulk delete

### Frontend
- `Frontend/ssp-frontend/src/hooks/useBulkSelection.ts` - Hook selección múltiple
- `Frontend/ssp-frontend/src/components/BulkDeleteToolbar.tsx` - Barra herramientas
- `Frontend/ssp-frontend/src/components/BulkDeleteDialog.tsx` - Diálogo confirmación
- `Frontend/ssp-frontend/src/components/GenericTableWithBulkDelete.tsx` - Tabla genérica
- `Frontend/ssp-frontend/src/components/PersonasTable.tsx` - Actualizada con batch delete
- `Frontend/ssp-frontend/src/pages/PersonasPage.tsx` - Función handleBulkDelete
- `Frontend/ssp-frontend/src/pages/UnidadesPage.tsx` - Migrada a tabla genérica

### Pruebas
- `API/scripts/test_bulk_delete.py` - Pruebas endpoints
- `API/scripts/test_role_permissions.py` - Pruebas permisos
- `Frontend/ssp-frontend/src/pages/TestBulkDeletePage.tsx` - Página prueba UI
