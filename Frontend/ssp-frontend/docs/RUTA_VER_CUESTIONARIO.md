# Fix: Ruta Faltante para Ver Detalles de Cuestionario

## Problema

Al hacer clic en "Ver detalles" en la gestión de cuestionarios, la aplicación mostraba una página en blanco con el siguiente error en la consola:

```
No routes matched location "/admin/cuestionarios/ver/ea6e94af-646c-40db-b757-bf4623658cf6"
```

### Causa Raíz

La página `CuestionariosPage.tsx` tenía un botón "Ver detalles" que navegaba a `/admin/cuestionarios/ver/:id`, pero esta ruta **NO estaba definida** en `App.tsx`.

**Código problemático en CuestionariosPage.tsx (línea 420):**
```tsx
<MenuItem onClick={() => navigate(`/admin/cuestionarios/ver/${cuestionarioSeleccionado?.id}`)}>
  <ViewIcon sx={{ mr: 1 }} />
  Ver detalles
</MenuItem>
```

**Rutas existentes en App.tsx:**
- ✅ `/admin/cuestionarios` - Listado de cuestionarios
- ✅ `/admin/cuestionarios/crear` - Crear cuestionario
- ✅ `/admin/cuestionarios/editar/:id` - Editar cuestionario
- ❌ `/admin/cuestionarios/ver/:id` - **FALTABA**

## Solución Aplicada

### 1. Creación de Nueva Página

**Archivo:** `Frontend/ssp-frontend/src/pages/admin/VerCuestionarioPage.tsx`

Página de solo lectura para visualizar los detalles completos de un cuestionario, incluyendo:

**Características:**
- ✅ Vista de solo lectura (no editable)
- ✅ Muestra toda la información del cuestionario
- ✅ Muestra todas las preguntas con vista previa
- ✅ Botón para editar (navega a la página de edición)
- ✅ Breadcrumbs para navegación
- ✅ Botón de regreso a la lista de cuestionarios
- ✅ Manejo de errores y estados de carga

**Información mostrada:**
- Título y descripción
- Estado del cuestionario (con chip de color)
- Total de preguntas
- Total de respuestas recibidas
- Creador del cuestionario
- Fechas (creación, inicio, fin)
- Tipos de usuario asignados
- Lista completa de preguntas con vista previa

**Componentes utilizados:**
- `VistaPreviaPregunta` - Para mostrar cada pregunta
- `getTipoUsuarioLabel` - Para formatear tipos de usuario
- Material-UI components (Paper, Grid, Chip, etc.)

### 2. Registro de Ruta en App.tsx

**Cambios en `Frontend/ssp-frontend/src/App.tsx`:**

**Import agregado (línea 25):**
```tsx
import VerCuestionarioPage from './pages/admin/VerCuestionarioPage';
```

**Ruta agregada (líneas 141-147):**
```tsx
<Route
  path="/admin/cuestionarios/ver/:id"
  element={
    <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
      <VerCuestionarioPage />
    </ProtectedRoute>
  }
/>
```

**Orden de rutas:**
1. `/admin/cuestionarios` - Listado
2. `/admin/cuestionarios/crear` - Crear
3. `/admin/cuestionarios/ver/:id` - **Ver (NUEVA)** ✨
4. `/admin/cuestionarios/editar/:id` - Editar

> **Nota:** Es importante que la ruta `/ver/:id` esté **antes** de `/editar/:id` para evitar conflictos de enrutamiento.

## Estructura de la Página

### Header
```tsx
<AppBar>
  <Toolbar>
    <IconButton onClick={() => navigate('/admin/cuestionarios')}>
      <ArrowBackIcon />
    </IconButton>
    <Typography>Ver Cuestionario</Typography>
    <Button onClick={() => navigate(`/admin/cuestionarios/editar/${id}`)}>
      Editar
    </Button>
  </Toolbar>
</AppBar>
```

### Breadcrumbs
```
Dashboard > Cuestionarios > Ver: [Título del Cuestionario]
```

### Información del Cuestionario
- Panel con metadatos en Grid (3-4 columnas)
- Chips para estado y tipos de usuario
- Formato de fechas con date-fns

### Lista de Preguntas
- Cada pregunta en un Paper separado
- Numeración automática
- Vista previa usando `VistaPreviaPregunta` en modo disabled

## Flujo de Navegación

### Desde Listado de Cuestionarios
```
CuestionariosPage
  └─> Click en "⋮" (menú)
      └─> Click en "Ver detalles"
          └─> VerCuestionarioPage (/admin/cuestionarios/ver/:id)
```

### Desde Vista de Detalles
```
VerCuestionarioPage
  ├─> Click en "← Atrás" → CuestionariosPage
  ├─> Click en "Editar" → EditarCuestionarioPage
  └─> Breadcrumb "Cuestionarios" → CuestionariosPage
```

## Permisos

**Roles permitidos:**
- ✅ `admin`
- ✅ `coordinador`

**Roles NO permitidos:**
- ❌ `alumno`
- ❌ `docente`
- ❌ `personal`

## API Utilizada

**Endpoint:** `GET /api/cuestionarios-admin/{id}`

**Servicio:** `cuestionariosAdminApi.getById(id)`

**Respuesta esperada:**
```typescript
interface CuestionarioAdmin {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoCuestionario;
  total_preguntas: number;
  total_respuestas: number;
  creado_por: number;
  creado_por_nombre: string;
  fecha_creacion: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipos_usuario_asignados: TipoUsuario[];
  preguntas: Pregunta[];
  created_at: string;
  updated_at: string;
}
```

## Manejo de Errores

### Casos Manejados

1. **ID no válido**
   ```tsx
   if (!id) {
     setError('ID de cuestionario no válido');
   }
   ```

2. **Cuestionario no encontrado (404)**
   ```tsx
   catch (error) {
     const errorMessage = error.response?.data?.detail || 'Error al cargar el cuestionario';
     setError(errorMessage);
     showNotification(errorMessage, 'error');
   }
   ```

3. **Error de red o servidor**
   - Muestra mensaje de error
   - Permite regresar a la lista

### Estados de UI

- **Loading:** Muestra `CircularProgress` centrado
- **Error:** Muestra `Alert` con mensaje de error y botón de regreso
- **Success:** Muestra contenido completo del cuestionario

## Testing

### Casos de Prueba

1. **Navegación desde listado**
   - ✅ Click en "Ver detalles" abre la página correcta
   - ✅ URL contiene el ID correcto

2. **Carga de datos**
   - ✅ Muestra loading mientras carga
   - ✅ Muestra todos los datos del cuestionario
   - ✅ Muestra todas las preguntas

3. **Navegación desde vista**
   - ✅ Botón "Atrás" regresa al listado
   - ✅ Botón "Editar" abre la página de edición
   - ✅ Breadcrumbs funcionan correctamente

4. **Manejo de errores**
   - ✅ ID inválido muestra error
   - ✅ Cuestionario no encontrado muestra error
   - ✅ Error de red muestra mensaje apropiado

5. **Permisos**
   - ✅ Admin puede acceder
   - ✅ Coordinador puede acceder
   - ✅ Otros roles son redirigidos

## Archivos Modificados

1. ✅ **Frontend/ssp-frontend/src/pages/admin/VerCuestionarioPage.tsx** (NUEVO)
   - Página completa de vista de detalles

2. ✅ **Frontend/ssp-frontend/src/App.tsx**
   - Agregado import de VerCuestionarioPage
   - Agregada ruta `/admin/cuestionarios/ver/:id`

## Archivos NO Modificados

- ❌ `CuestionariosPage.tsx` - Ya tenía la navegación correcta
- ❌ `EditarCuestionarioPage.tsx` - No requiere cambios
- ❌ `CrearCuestionarioPage.tsx` - No requiere cambios

## Mejoras Futuras (Opcional)

1. **Estadísticas de respuestas**
   - Gráficos de respuestas por pregunta
   - Porcentaje de completitud

2. **Exportar cuestionario**
   - PDF con todas las preguntas
   - Excel con respuestas

3. **Historial de cambios**
   - Ver quién editó y cuándo
   - Comparar versiones

4. **Vista previa interactiva**
   - Simular responder el cuestionario
   - Ver cómo lo verán los usuarios

## Estado

- ✅ Página creada
- ✅ Ruta registrada
- ✅ Navegación funcionando
- ✅ Manejo de errores implementado
- ✅ Permisos configurados
- ✅ Documentación completa

## Fecha
2025-09-27

## Relacionado
- Página: `Frontend/ssp-frontend/src/pages/admin/CuestionariosPage.tsx`
- Rutas: `Frontend/ssp-frontend/src/App.tsx`
- Componente: `Frontend/ssp-frontend/src/components/cuestionarios/VistaPreviaPregunta.tsx`

