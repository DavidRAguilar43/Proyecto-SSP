# Implementación de Reportes IA en Frontend

## Descripción

Se debe crear una interfaz para mostrar y gestionar reportes generados por IA en el frontend.

## Componentes a Crear

### 1. ReporteIAViewer.tsx
Componente para visualizar un reporte individual.

**Props:**
- `reporte`: Objeto con contenido, versión, fecha_generacion
- `onClose`: Callback para cerrar
- `onRegenerate`: Callback para regenerar

**Características:**
- Mostrar contenido del reporte en formato markdown
- Mostrar número de versión
- Mostrar fecha de generación
- Botón para regenerar (si es admin)
- Botón para cerrar

### 2. ReportesHistorial.tsx
Componente para mostrar historial de reportes.

**Props:**
- `respuestaId`: ID de la respuesta
- `reportes`: Array de reportes
- `onSelectReporte`: Callback al seleccionar un reporte
- `onRegenerate`: Callback para regenerar

**Características:**
- Lista de versiones de reportes
- Indicador de versión actual
- Fecha de generación de cada versión
- Botón para ver cada versión
- Botón para regenerar (solo admin)

### 3. GenerarReporteButton.tsx
Botón para generar/regenerar reportes.

**Props:**
- `respuestaId`: ID de la respuesta
- `onSuccess`: Callback al generar exitosamente
- `onError`: Callback en caso de error
- `isAdmin`: Boolean indicando si es admin
- `disabled`: Boolean para deshabilitar

**Características:**
- Mostrar estado de carga
- Manejar errores
- Mostrar confirmación
- Actualizar UI después de generar

## Servicios API a Crear

### reporteService.ts

```typescript
// Generar reporte
export const generarReporte = (respuestaId: string) => 
  api.post(`/cuestionarios-usuario/${respuestaId}/generar-reporte`)

// Obtener reportes
export const obtenerReportes = (respuestaId: string) => 
  api.get(`/cuestionarios-usuario/${respuestaId}/reportes`)

// Obtener reporte actual
export const obtenerReporteActual = (respuestaId: string) => 
  api.get(`/cuestionarios-usuario/${respuestaId}/reporte-actual`)

// Regenerar reporte (admin)
export const regenerarReporte = (respuestaId: string) => 
  api.post(`/cuestionarios-admin/respuestas/${respuestaId}/regenerar-reporte`)

// Obtener reportes (admin)
export const obtenerReportesAdmin = (respuestaId: string) => 
  api.get(`/cuestionarios-admin/respuestas/${respuestaId}/reportes`)
```

## Integración en Páginas Existentes

### CuestionariosCompletadosPage.tsx
- Agregar botón "Ver Reporte" en cada cuestionario completado
- Mostrar modal con ReporteIAViewer
- Permitir regenerar si es admin

### CuestionariosPendientesPage.tsx
- Mostrar estado "Reporte disponible" si existe
- Permitir ver reporte después de completar

## Tipos TypeScript

```typescript
interface Reporte {
  id: string
  respuesta_cuestionario_id: string
  version: number
  es_actual: boolean
  contenido: string
  fecha_generacion: string
}

interface ReportesResponse {
  respuesta_id: string
  total_reportes: number
  reportes: Reporte[]
}

interface GenerarReporteResponse {
  id: string
  respuesta_cuestionario_id: string
  version: number
  es_actual: boolean
  contenido: string
  fecha_generacion: string
  mensaje: string
}
```

## Flujo de Usuario

### Alumno
1. Completa cuestionario
2. Ve botón "Ver Reporte"
3. Hace clic y ve el reporte actual
4. Puede ver historial de versiones

### Admin/Coordinador
1. Accede a cuestionarios completados
2. Ve botón "Ver Reporte" y "Regenerar"
3. Puede ver todas las versiones
4. Puede regenerar para obtener análisis actualizado

## Consideraciones de Diseño

- Usar Material-UI para consistencia
- Mostrar contenido markdown del reporte
- Indicar claramente qué versión es actual
- Permitir comparación entre versiones
- Mostrar indicador de carga durante generación
- Manejar errores de API gracefully

