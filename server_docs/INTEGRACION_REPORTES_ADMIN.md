# Integración de Reportes IA en Página de Cuestionarios Contestados

## 📋 Descripción

Se ha integrado completamente la funcionalidad de generación y visualización de reportes psicopedagógicos en la página de administración "Cuestionarios Contestados".

## ✅ Cambios Realizados

### 1. Frontend - CuestionariosContestadosPage.tsx

#### Importaciones Agregadas
```typescript
import GenerarReporteButton from '@/components/GenerarReporteButton';
import ReporteIAViewer from '@/components/ReporteIAViewer';
import { FileDownload as FileDownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
```

#### Estados Agregados
```typescript
// Reportes IA
const [reporteActual, setReporteActual] = useState<Reporte | null>(null);
const [reporteViewerOpen, setReporteViewerOpen] = useState(false);
const [cargandoReporte, setCargandoReporte] = useState(false);
const [regenerandoReporte, setRegenerandoReporte] = useState(false);
```

#### Funciones Agregadas

**cargarReporte(respuestaId: string)**
- Carga el reporte actual de una respuesta
- Se ejecuta automáticamente al abrir el detalle
- Maneja errores gracefully

**handleRegenerarReporte()**
- Regenera el reporte actual
- Recarga el reporte después de regenerar
- Muestra notificaciones de éxito/error

#### UI Agregada

**Sección de Reportes en el Dialog**
- Indicador visual si hay reporte generado
- Botón "Ver Reporte" para visualizar
- Mensaje informativo si no hay reporte

**DialogActions Actualizado**
- Botón "Generar Reporte" (GenerarReporteButton)
- Botón "Ver Reporte" (solo si existe reporte)
- Botón "Cerrar"

**Componente ReporteIAViewer**
- Modal para visualizar reporte completo
- Botón "Regenerar Reporte" (solo para admin)
- Información de versión y fecha

### 2. Backend - cuestionarios_admin.py

#### Nuevo Endpoint
```
GET /cuestionarios-admin/respuestas/{respuesta_id}/reporte-actual
```

**Descripción**: Obtiene el reporte actual (más reciente) de una respuesta

**Parámetros**:
- `respuesta_id` (path): ID de la respuesta del cuestionario

**Respuesta**:
```json
{
  "reporte": {
    "id": "uuid",
    "respuesta_cuestionario_id": "uuid",
    "contenido": "texto del reporte",
    "version": 1,
    "es_actual": true,
    "fecha_generacion": "2025-11-05T10:30:00",
    "created_at": "2025-11-05T10:30:00"
  }
}
```

**Autenticación**: Requiere ser admin o coordinador

### 3. Frontend - api.ts

#### Métodos Agregados a cuestionariosAdminApi

```typescript
// Obtener el reporte actual de una respuesta (admin)
obtenerReporteActual: async (respuestaId: string) => {
  const response = await api.get(`/cuestionarios-admin/respuestas/${respuestaId}/reporte-actual`);
  return response.data;
}

// Regenerar reporte de una respuesta (admin)
regenerarReporte: async (respuestaId: string) => {
  const response = await api.post(`/cuestionarios-admin/respuestas/${respuestaId}/regenerar-reporte`);
  return response.data;
}

// Obtener todos los reportes de una respuesta (admin)
obtenerReportes: async (respuestaId: string) => {
  const response = await api.get(`/cuestionarios-admin/respuestas/${respuestaId}/reportes`);
  return response.data;
}
```

## 🎯 Flujo de Uso

### Para Administrador/Coordinador

1. **Navegar a "Cuestionarios Contestados"**
   - Ver tabla de respuestas completadas

2. **Hacer clic en "Ver Detalle"**
   - Se abre dialog con preguntas y respuestas
   - Se carga automáticamente el reporte si existe

3. **Generar Reporte (si no existe)**
   - Hacer clic en botón "Generar Reporte"
   - Confirmar en dialog
   - Se genera reporte con IA
   - Se muestra notificación de éxito

4. **Ver Reporte**
   - Hacer clic en "Ver Reporte"
   - Se abre modal con contenido completo
   - Muestra versión y fecha de generación

5. **Regenerar Reporte (opcional)**
   - Hacer clic en "Regenerar Reporte" en el modal
   - Se crea nueva versión
   - Versión anterior se mantiene en historial

## 📊 Estructura de Datos

### Interfaz Reporte
```typescript
interface Reporte {
  id: string;
  respuesta_cuestionario_id: string;
  contenido: string;
  version: number;
  es_actual: boolean;
  fecha_generacion: string;
  created_at: string;
}
```

## 🔄 Flujo de Datos

```
Usuario Admin
    ↓
CuestionariosContestadosPage
    ↓
Hace clic en "Ver Detalle"
    ↓
cargarReporte() → API GET /reporte-actual
    ↓
Muestra reporte en dialog
    ↓
Hace clic en "Generar Reporte"
    ↓
GenerarReporteButton → API POST /generar-reporte
    ↓
Recarga reporte
    ↓
Muestra en ReporteIAViewer
```

## ✨ Características

- ✅ Carga automática de reporte al abrir detalle
- ✅ Generación de reporte con IA
- ✅ Regeneración de reportes con versionado
- ✅ Visualización completa del reporte
- ✅ Historial de versiones
- ✅ Notificaciones de éxito/error
- ✅ Indicadores visuales de estado
- ✅ Manejo de errores graceful

## 🔒 Seguridad

- ✅ Solo admin/coordinador pueden acceder
- ✅ Validación de permisos en backend
- ✅ Validación de existencia de respuesta
- ✅ Manejo seguro de errores

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `Frontend/ssp-frontend/src/pages/admin/CuestionariosContestadosPage.tsx` | Integración de componentes y funciones |
| `Frontend/ssp-frontend/src/services/api.ts` | Métodos para reportes admin |
| `API/app/routes/cuestionarios_admin.py` | Nuevo endpoint reporte-actual |

## 🚀 Próximos Pasos

1. ✅ Integración completada
2. ⏳ Testing manual en navegador
3. ⏳ Integración en CuestionariosPendientesPage (opcional)
4. ⏳ Integración en página de usuario (CuestionariosAsignadosPage)

## 🧪 Testing

### Verificar que funciona:

1. **Abrir página de Cuestionarios Contestados**
   - Debe cargar lista de respuestas

2. **Hacer clic en "Ver Detalle"**
   - Debe abrir dialog
   - Debe cargar reporte si existe

3. **Generar Reporte**
   - Hacer clic en "Generar Reporte"
   - Debe mostrar confirmación
   - Debe generar reporte con IA

4. **Ver Reporte**
   - Hacer clic en "Ver Reporte"
   - Debe mostrar contenido completo

5. **Regenerar Reporte**
   - Hacer clic en "Regenerar Reporte"
   - Debe crear nueva versión
   - Debe mantener versión anterior

## 📚 Documentación Relacionada

- `docs/GENERACION_REPORTES_IA.md` - Descripción técnica
- `docs/TESTING_REPORTES_IA.md` - Guía de testing
- `RESUMEN_CENTRALIZACION_ENV.md` - Configuración de entorno

