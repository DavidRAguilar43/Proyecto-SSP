# Guía de Integración - Reportes IA en Frontend

## Componentes Disponibles

### 1. ReporteIAViewer
Componente para visualizar un reporte individual.

```tsx
import { ReporteIAViewer } from '@/components/ReporteIAViewer'

<ReporteIAViewer
  open={open}
  reporte={reporte}
  onClose={() => setOpen(false)}
  onRegenerate={handleRegenerate}
  isRegenerating={regenerating}
  isAdmin={isAdmin}
/>
```

### 2. ReportesHistorial
Componente para mostrar historial de reportes.

```tsx
import { ReportesHistorial } from '@/components/ReportesHistorial'

<ReportesHistorial
  reportes={reportes}
  onSelectReporte={handleSelectReporte}
  onRegenerate={handleRegenerate}
  isRegenerating={regenerating}
  isAdmin={isAdmin}
  loading={loading}
/>
```

### 3. GenerarReporteButton
Botón para generar/regenerar reportes.

```tsx
import { GenerarReporteButton } from '@/components/GenerarReporteButton'

<GenerarReporteButton
  respuestaId={respuestaId}
  onSuccess={handleSuccess}
  onError={handleError}
  isAdmin={isAdmin}
  isRegenerate={false}
/>
```

## Integración en CuestionariosCompletadosPage

```tsx
import { useState, useEffect } from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { ReporteIAViewer } from '@/components/ReporteIAViewer'
import { ReportesHistorial } from '@/components/ReportesHistorial'
import { GenerarReporteButton } from '@/components/GenerarReporteButton'
import * as reporteService from '@/services/reporteService'

export const CuestionariosCompletadosPage = () => {
  const [selectedReporte, setSelectedReporte] = useState(null)
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const handleLoadReportes = async (respuestaId: string) => {
    setLoading(true)
    try {
      const data = await reporteService.obtenerReportes(respuestaId)
      setReportes(data.reportes)
    } catch (error) {
      console.error('Error cargando reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await reporteService.regenerarReporte(selectedReporte.respuesta_cuestionario_id)
      // Recargar reportes
      await handleLoadReportes(selectedReporte.respuesta_cuestionario_id)
    } catch (error) {
      console.error('Error regenerando reporte:', error)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Box>
      {/* Tabla de cuestionarios completados */}
      <ReportesHistorial
        reportes={reportes}
        onSelectReporte={setSelectedReporte}
        onRegenerate={handleRegenerate}
        isRegenerating={regenerating}
        loading={loading}
      />

      <ReporteIAViewer
        open={!!selectedReporte}
        reporte={selectedReporte}
        onClose={() => setSelectedReporte(null)}
        onRegenerate={handleRegenerate}
        isRegenerating={regenerating}
      />
    </Box>
  )
}
```

## Integración en Tabla de Cuestionarios

```tsx
// En la columna de acciones de la tabla
{
  field: 'acciones',
  headerName: 'Acciones',
  width: 200,
  renderCell: (params) => (
    <Box display="flex" gap={1}>
      <GenerarReporteButton
        respuestaId={params.row.respuesta_id}
        onSuccess={() => {
          // Recargar tabla o mostrar notificación
        }}
        size="small"
      />
      <Button
        size="small"
        onClick={() => handleViewReportes(params.row.respuesta_id)}
      >
        Ver Historial
      </Button>
    </Box>
  )
}
```

## Flujo de Usuario Recomendado

### Para Alumnos
1. Completa cuestionario
2. Ve botón "Generar Reporte"
3. Hace clic y espera generación
4. Ve reporte en modal
5. Puede ver historial de versiones

### Para Admins
1. Accede a "Cuestionarios Completados"
2. Ve tabla con todos los cuestionarios
3. Puede generar reporte si no existe
4. Puede regenerar reporte existente
5. Puede ver historial y comparar versiones

## Manejo de Estados

```tsx
// Estados de carga
const [loading, setLoading] = useState(false)
const [regenerating, setRegenerating] = useState(false)
const [error, setError] = useState<string | null>(null)

// Estados de UI
const [viewerOpen, setViewerOpen] = useState(false)
const [selectedReporte, setSelectedReporte] = useState(null)
const [reportes, setReportes] = useState([])
```

## Manejo de Errores

```tsx
const handleError = (error: Error) => {
  setError(error.message)
  // Mostrar notificación
  showNotification({
    type: 'error',
    message: error.message
  })
}
```

## Tipos TypeScript

```tsx
import { Reporte, ReportesResponse } from '@/services/reporteService'

interface ReporteState {
  reportes: Reporte[]
  selectedReporte: Reporte | null
  loading: boolean
  regenerating: boolean
  error: string | null
}
```

## Consideraciones de Rendimiento

- Usar lazy loading para reportes largos
- Cachear reportes en estado local
- Paginar historial si hay muchas versiones
- Usar virtualization para listas largas

## Accesibilidad

- Agregar aria-labels a botones
- Usar colores significativos (verde para éxito, rojo para error)
- Mostrar mensajes claros de estado
- Permitir navegación con teclado

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { GenerarReporteButton } from '@/components/GenerarReporteButton'

test('genera reporte exitosamente', async () => {
  render(<GenerarReporteButton respuestaId="123" />)
  
  const button = screen.getByText('Generar Reporte')
  fireEvent.click(button)
  
  // Verificar que se muestra diálogo de confirmación
  expect(screen.getByText(/Se generará un reporte/)).toBeInTheDocument()
})
```

