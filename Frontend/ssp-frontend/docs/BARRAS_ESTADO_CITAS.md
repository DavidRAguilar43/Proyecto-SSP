# Sistema de Indicadores Visuales de Estado para Citas

## Descripción General

Se implementó un sistema completo de indicadores visuales para citas que incluye:
1. **Barras de color laterales** en las tarjetas de citas para identificación visual rápida
2. **Sistema de pestañas/filtros temporales** para filtrar citas por su estado temporal

## Fecha de Implementación

21 de octubre de 2025

## Última Actualización

21 de octubre de 2025 - Agregado sistema de pestañas/filtros temporales

## Componentes Modificados

1. **SolicitudesCitas.tsx** - Componente principal de gestión de solicitudes de citas (vista del personal)
2. **MisCitas.tsx** - Componente de visualización de citas del estudiante
3. **SolicitudesPendientesCards.tsx** - Componente de tarjetas de solicitudes pendientes

## Lógica de Colores

El sistema utiliza un código de colores intuitivo basado en la fecha de la cita y su estado:

### Colores y Significados

| Color | Código Hex | Significado | Condiciones |
|-------|-----------|-------------|-------------|
| 🟢 **Verde** | `#4CAF50` | Cita confirmada y fecha llegó/pasó | `estado === 'confirmada' && fecha <= hoy` |
| 🔴 **Rojo** | `#F44336` | Cita no atendida y fecha pasó | `estado === 'pendiente' && fecha < hoy` |
| ⚪ **Gris** | `#9E9E9E` | Cita pendiente (fecha futura) | `fecha > hoy` o sin fecha |
| 🟡 **Amarillo** | `#FFC107` | Cita completada/revisada | `estado === 'completada'` |

### Casos Especiales

- **Citas canceladas**: Se muestran en gris (`#9E9E9E`)
- **Citas sin fecha**: Se muestran en gris por defecto
- **Citas de hoy confirmadas**: Se muestran en verde
- **Citas de hoy pendientes**: Se muestran en gris

## Implementación Técnica

### Función Principal: `getBarraEstadoColor`

Esta función determina el color de la barra basándose en la lógica descrita anteriormente.

```typescript
const getBarraEstadoColor = (solicitud: SolicitudCita): string => {
  const ahora = new Date();
  const fechaCita = solicitud.fecha_confirmada 
    ? new Date(solicitud.fecha_confirmada) 
    : solicitud.fecha_propuesta_alumno 
      ? new Date(solicitud.fecha_propuesta_alumno)
      : null;

  // Lógica de determinación de color...
  // Ver código fuente para detalles completos
};
```

### Características de la Implementación

1. **Prioridad de fechas**: 
   - Primero se verifica `fecha_confirmada`
   - Si no existe, se usa `fecha_propuesta_alumno`
   - Si ninguna existe, se usa gris por defecto

2. **Comparación de fechas**:
   - Se normalizan las fechas para comparar solo día/mes/año (sin hora)
   - Esto evita problemas con diferencias de horas

3. **Posicionamiento visual**:
   - Barra lateral izquierda de 6px de ancho
   - Posición absoluta con `z-index: 1`
   - Altura completa de la tarjeta (100%)

### Estilos Aplicados

```typescript
// Barra de estado visual
<Box
  sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '6px',
    height: '100%',
    backgroundColor: barraColor,
    zIndex: 1
  }}
/>

// Ajuste del contenido de la tarjeta
<CardContent sx={{ pl: 3 }}>
  {/* Contenido de la tarjeta */}
</CardContent>
```

## Integración con Componentes Existentes

### SolicitudesCitas.tsx

- **Secciones modificadas**:
  - Solicitudes Pendientes
  - Citas Confirmadas

- **Cambios realizados**:
  - Agregada función `getBarraEstadoColor`
  - Modificado el `map` para calcular el color de la barra
  - Agregado `Box` para la barra de estado
  - Ajustado `padding-left` del `CardContent`

### MisCitas.tsx

- **Secciones modificadas**:
  - Lista de citas del estudiante

- **Cambios realizados**:
  - Agregada función `getBarraEstadoColor`
  - Modificado el `map` para calcular el color de la barra
  - Agregado `Box` para la barra de estado
  - Ajustado `padding-left` del `CardContent`

### SolicitudesPendientesCards.tsx

- **Secciones modificadas**:
  - Solicitudes Pendientes
  - Citas Confirmadas

- **Cambios realizados**:
  - Agregada función `getBarraEstadoColor`
  - Modificado el `map` para calcular el color de la barra
  - Agregado `Box` para la barra de estado
  - Ajustado `padding-left` del `CardContent`

## Beneficios de la Implementación

1. **Identificación visual rápida**: Los usuarios pueden identificar el estado de las citas de un vistazo
2. **Mejora de UX**: Reduce la carga cognitiva al procesar información de múltiples citas
3. **Consistencia**: El mismo sistema de colores se aplica en todos los componentes de citas
4. **Accesibilidad**: Los colores complementan (no reemplazan) las etiquetas de estado existentes
5. **Mantenibilidad**: Código documentado y reutilizable

## Estados de Citas Soportados

El sistema soporta todos los estados definidos en el tipo `EstadoCita`:

- `pendiente`: Cita solicitada pero no confirmada
- `confirmada`: Cita confirmada con fecha y ubicación
- `cancelada`: Cita cancelada
- `completada`: Cita realizada y completada

## Compatibilidad

- ✅ Compatible con Material-UI v5
- ✅ Compatible con todos los tipos de citas (psicológica, académica, general)
- ✅ Responsive (funciona en móvil y escritorio)
- ✅ No rompe el diseño existente
- ✅ Mantiene todos los estilos y funcionalidades previas

## Pruebas Recomendadas

1. **Prueba de citas pendientes futuras**: Verificar que se muestren en gris
2. **Prueba de citas confirmadas pasadas**: Verificar que se muestren en verde
3. **Prueba de citas pendientes pasadas**: Verificar que se muestren en rojo
4. **Prueba de citas completadas**: Verificar que se muestren en amarillo
5. **Prueba de citas de hoy**: Verificar colores según estado
6. **Prueba de citas sin fecha**: Verificar que se muestren en gris
7. **Prueba de citas canceladas**: Verificar que se muestren en gris

## Notas Técnicas

- La función `getBarraEstadoColor` está documentada con docstrings en formato Google
- Se utilizan colores hexadecimales directos para mayor control
- Los colores coinciden con los colores del tema de Material-UI:
  - Verde: `success.main`
  - Rojo: `error.main`
  - Amarillo: `warning.main`
  - Gris: Color neutral estándar

## Mantenimiento Futuro

Si se necesitan agregar nuevos estados o modificar la lógica de colores:

1. Modificar la función `getBarraEstadoColor` en cada componente
2. Actualizar la tabla de colores en esta documentación
3. Agregar pruebas para los nuevos casos
4. Verificar que los cambios sean consistentes en todos los componentes

## Sistema de Pestañas/Filtros Temporales

### Descripción

Se agregó una barra de pestañas en la parte superior de los componentes de citas que permite filtrar las citas según su estado temporal. Esta funcionalidad complementa las barras de estado laterales y mejora significativamente la experiencia de usuario.

### Pestañas Disponibles

| Pestaña | Icono | Color | Descripción | Filtro Aplicado |
|---------|-------|-------|-------------|-----------------|
| **Todas** | 📅 CalendarIcon | Azul (primary) | Muestra todas las citas | Sin filtro |
| **Hoy** | 📆 TodayIcon | Verde (#4CAF50) | Citas programadas para hoy | `fecha === hoy` |
| **Pasadas** | 🕐 HistoryIcon | Rojo (#F44336) | Citas pasadas sin atender | `fecha < hoy && estado !== 'completada'` |
| **Pendientes** | ⏳ HourglassEmptyIcon | Gris (#9E9E9E) | Citas futuras pendientes | `fecha > hoy && estado !== 'completada'` |
| **Revisión** | ✅ CheckCircleIcon | Amarillo (#FFC107) | Citas completadas | `estado === 'completada'` |

### Características

1. **Contadores dinámicos**: Cada pestaña muestra el número de citas que corresponden a esa categoría
   - Ejemplo: "Hoy (3)", "Pasadas (5)", etc.

2. **Código de colores**: Los colores de las pestañas coinciden con los colores de las barras de estado laterales

3. **Responsive**: La barra de pestañas es scrollable en dispositivos móviles

4. **Feedback visual**: La pestaña seleccionada se destaca con color más intenso y mayor peso de fuente

5. **Mensajes informativos**: Cuando no hay resultados para un filtro, se muestra un mensaje apropiado

### Implementación Técnica

#### Componentes Modificados

1. **SolicitudesCitas.tsx**
2. **MisCitas.tsx**
3. **SolicitudesPendientesCards.tsx**

#### Funciones Agregadas

```typescript
// Determina si una cita es de hoy
const esCitaDeHoy = (solicitud: SolicitudCita): boolean => { ... }

// Determina si una cita ya pasó
const esCitaPasada = (solicitud: SolicitudCita): boolean => { ... }

// Determina si una cita está pendiente (fecha futura)
const esCitaPendienteFutura = (solicitud: SolicitudCita): boolean => { ... }

// Filtra las solicitudes según el filtro temporal seleccionado
const filtrarPorEstadoTemporal = (solicitudes: SolicitudCita[]): SolicitudCita[] => { ... }
```

#### Estado del Componente

```typescript
type FiltroTemporal = 'todas' | 'hoy' | 'pasadas' | 'pendientes' | 'revision';
const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('todas');
```

#### Contadores

```typescript
const contadorHoy = solicitudes.filter(s => esCitaDeHoy(s)).length;
const contadorPasadas = solicitudes.filter(s => esCitaPasada(s) && s.estado !== 'completada').length;
const contadorPendientes = solicitudes.filter(s => esCitaPendienteFutura(s) && s.estado !== 'completada').length;
const contadorRevision = solicitudes.filter(s => s.estado === 'completada').length;
```

### Estilos de las Pestañas

```typescript
<Tabs
  value={filtroTemporal}
  onChange={(_, newValue) => setFiltroTemporal(newValue as FiltroTemporal)}
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    borderBottom: 1,
    borderColor: 'divider',
    '& .MuiTab-root': {
      minHeight: 64,
      textTransform: 'none',
      fontWeight: 600
    }
  }}
>
  <Tab
    value="hoy"
    label={`Hoy (${contadorHoy})`}
    icon={<TodayIcon />}
    iconPosition="start"
    sx={{
      color: contadorHoy > 0 ? '#4CAF50' : 'text.secondary',
      '&.Mui-selected': {
        color: '#4CAF50',
        fontWeight: 700
      }
    }}
  />
  {/* ... más pestañas ... */}
</Tabs>
```

### Mensajes de Estado Vacío

Cuando no hay resultados para el filtro seleccionado, se muestra un mensaje apropiado:

```typescript
{solicitudesPendientes.length === 0 && solicitudesConfirmadas.length === 0 && (
  <Alert severity="info" sx={{ mt: 2 }}>
    {filtroTemporal === 'hoy' && 'No hay citas programadas para hoy.'}
    {filtroTemporal === 'pasadas' && 'No hay citas pasadas sin atender.'}
    {filtroTemporal === 'pendientes' && 'No hay citas pendientes con fecha futura.'}
    {filtroTemporal === 'revision' && 'No hay citas completadas/revisadas.'}
    {filtroTemporal === 'todas' && 'No hay citas en este momento.'}
  </Alert>
)}
```

### Beneficios Adicionales

1. **Organización mejorada**: Los usuarios pueden enfocarse en citas específicas según su urgencia
2. **Reducción de carga cognitiva**: No es necesario revisar todas las citas para encontrar las relevantes
3. **Priorización**: Las citas de "Hoy" y "Pasadas" son fácilmente accesibles
4. **Seguimiento**: La pestaña "Revisión" permite ver el historial de citas completadas
5. **Visibilidad**: Los contadores muestran de un vistazo cuántas citas hay en cada categoría

## Referencias

- Tipos de citas: `Frontend/ssp-frontend/src/types/index.ts`
- Estados de citas: `EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'`
- Tipos de citas: `TipoCita = 'psicologica' | 'academica' | 'general'`
- Material-UI Tabs: https://mui.com/material-ui/react-tabs/

