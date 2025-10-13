# Navegación al Dashboard - Botones de Regreso

## Resumen
Este documento detalla la implementación de botones de regreso al dashboard en todas las páginas administrativas y de usuario del sistema.

## Cambios Realizados

### Páginas Actualizadas

#### 1. Gestión de Cuestionarios (`/admin/cuestionarios`)
**Archivo:** `Frontend/ssp-frontend/src/pages/admin/CuestionariosPage.tsx`

**Cambios:**
- ✅ Agregado import de `ArrowBackIcon`
- ✅ Agregado `IconButton` con navegación a `/dashboard` en el AppBar
- ✅ Ubicación: Esquina superior izquierda del AppBar

**Código agregado:**
```tsx
<IconButton
  color="inherit"
  onClick={() => navigate('/dashboard')}
  sx={{ mr: 2 }}
  aria-label="Regresar al dashboard"
>
  <ArrowBackIcon />
</IconButton>
```

#### 2. Mis Cuestionarios (`/usuario/cuestionarios`)
**Archivo:** `Frontend/ssp-frontend/src/pages/usuario/CuestionariosAsignadosPage.tsx`

**Cambios:**
- ✅ Agregado import de `ArrowBackIcon`
- ✅ Agregado import de `IconButton`
- ✅ Agregado `IconButton` con navegación a `/dashboard` en el AppBar
- ✅ Ubicación: Esquina superior izquierda del AppBar

**Código agregado:**
```tsx
<IconButton
  color="inherit"
  onClick={() => navigate('/dashboard')}
  sx={{ mr: 2 }}
  aria-label="Regresar al dashboard"
>
  <ArrowBackIcon />
</IconButton>
```

## Páginas que YA tenían Botón de Regreso

Las siguientes páginas ya contaban con el botón de regreso al dashboard implementado:

### Páginas Administrativas
1. **Gestión de Personas** (`/personas`)
   - Archivo: `PersonasPage.tsx`
   - Implementación: IconButton con ArrowBackIcon

2. **Grupos** (`/grupos`)
   - Archivo: `GruposPage.tsx`
   - Implementación: IconButton con ArrowBackIcon

3. **Atenciones** (`/atenciones`)
   - Archivo: `AtencionesPage.tsx`
   - Implementación: IconButton con ArrowBackIcon

4. **Programas Educativos** (`/programas-educativos`)
   - Archivo: `ProgramasEducativosPage.tsx`
   - Implementación: IconButton con ArrowBackIcon

5. **Unidades** (`/unidades`)
   - Archivo: `UnidadesPage.tsx`
   - Implementación: IconButton con ArrowBackIcon

6. **Catálogos** (`/catalogos`)
   - Archivo: `CatalogosPage.tsx`
   - Implementación: Button con ArrowBackIcon en AppBar

7. **Solicitudes Pendientes** (`/solicitudes-pendientes`)
   - Archivo: `SolicitudesPendientesPage.tsx`
   - Implementación: Button con ArrowBackIcon en AppBar

8. **Cuestionarios Pendientes** (`/cuestionarios-pendientes`)
   - Archivo: `CuestionariosPendientesPage.tsx`
   - Implementación: Button con ArrowBackIcon en AppBar

### Páginas de Cuestionarios (Admin)
9. **Crear Cuestionario** (`/admin/cuestionarios/crear`)
   - Archivo: `CrearCuestionarioPage.tsx`
   - Implementación: IconButton con ArrowBackIcon
   - Nota: Regresa a `/admin/cuestionarios` en lugar de dashboard

10. **Editar Cuestionario** (`/admin/cuestionarios/editar/:id`)
    - Archivo: `EditarCuestionarioPage.tsx`
    - Implementación: IconButton con ArrowBackIcon
    - Nota: Regresa a `/admin/cuestionarios` en lugar de dashboard

### Páginas de Usuario
11. **Responder Cuestionario** (`/usuario/cuestionarios/responder/:id`)
    - Archivo: `ResponderCuestionarioPage.tsx`
    - Implementación: IconButton con ArrowBackIcon
    - Nota: Regresa a `/usuario/cuestionarios` en lugar de dashboard

## Patrón de Implementación

### Patrón Estándar (IconButton)
Usado en la mayoría de las páginas:

```tsx
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';

// En el render:
<IconButton
  onClick={() => navigate('/dashboard')}
  sx={{ mr: 2 }}
  aria-label="Regresar al dashboard"
>
  <ArrowBackIcon />
</IconButton>
```

### Patrón Alternativo (Button en AppBar)
Usado en algunas páginas con AppBar:

```tsx
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Button, AppBar, Toolbar } from '@mui/material';

// En el render:
<AppBar position="static">
  <Toolbar>
    <Button
      color="inherit"
      startIcon={<ArrowBackIcon />}
      onClick={() => navigate('/dashboard')}
      sx={{ mr: 2 }}
    >
      Volver
    </Button>
    {/* ... resto del toolbar */}
  </Toolbar>
</AppBar>
```

## Navegación Jerárquica

### Páginas de Primer Nivel
Estas páginas regresan directamente al dashboard:
- Gestión de Personas
- Grupos
- Atenciones
- Programas Educativos
- Unidades
- Catálogos
- Solicitudes Pendientes
- Cuestionarios Pendientes
- **Gestión de Cuestionarios** (recién actualizado)
- **Mis Cuestionarios** (recién actualizado)

### Páginas de Segundo Nivel
Estas páginas regresan a su página padre:
- Crear Cuestionario → `/admin/cuestionarios`
- Editar Cuestionario → `/admin/cuestionarios`
- Responder Cuestionario → `/usuario/cuestionarios`

## Accesibilidad

Todos los botones de regreso incluyen:
- ✅ Atributo `aria-label` descriptivo
- ✅ Icono visual claro (ArrowBackIcon)
- ✅ Posición consistente (esquina superior izquierda)
- ✅ Espaciado adecuado (`sx={{ mr: 2 }}`)

## Testing

Para verificar que todos los botones funcionan correctamente:

1. Navegar a cada página desde el dashboard
2. Verificar que el botón de regreso esté visible
3. Hacer clic en el botón de regreso
4. Confirmar que regresa a la página correcta (dashboard o página padre)

## Páginas Verificadas

- [x] `/personas`
- [x] `/grupos`
- [x] `/atenciones`
- [x] `/programas-educativos`
- [x] `/unidades`
- [x] `/catalogos`
- [x] `/solicitudes-pendientes`
- [x] `/cuestionarios-pendientes`
- [x] `/admin/cuestionarios` ✨ **ACTUALIZADO**
- [x] `/admin/cuestionarios/crear`
- [x] `/admin/cuestionarios/editar/:id`
- [x] `/usuario/cuestionarios` ✨ **ACTUALIZADO**
- [x] `/usuario/cuestionarios/responder/:id`

## Notas Adicionales

- Todas las páginas administrativas ahora tienen navegación consistente
- El patrón de navegación es uniforme en todo el sistema
- Los usuarios siempre tienen una forma clara de regresar al dashboard
- La navegación jerárquica se mantiene en páginas de segundo nivel

## Fecha de Actualización
2025-09-27

