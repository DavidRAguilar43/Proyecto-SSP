# Secciones Colapsables en Dashboard de Admin

## Descripción General

Se ha implementado funcionalidad de colapsar/expandir en las listas de solicitudes del dashboard de administración para mejorar la experiencia de usuario y permitir una mejor organización visual de la información.

## Características Implementadas

### 1. Secciones Colapsables

Las siguientes secciones ahora pueden colapsarse/expandirse:

#### En `SolicitudesCitas.tsx`:
- **Solicitudes Pendientes**: Lista de citas con estado "pendiente"
- **Citas Confirmadas**: Lista de citas con estado "confirmada"

#### En `SolicitudesPendientesCards.tsx`:
- **Solicitudes Pendientes**: Lista completa de solicitudes pendientes
- **Citas Confirmadas**: Lista completa de citas confirmadas

### 2. Textos Colapsables

Los textos largos ahora se pueden expandir/colapsar:

- **Motivo de la cita**: Si el texto supera 100 caracteres, se muestra truncado con opción "Ver más"
- **Observaciones del estudiante**: Si el texto supera 100 caracteres, se muestra truncado con opción "Ver más"

### 3. Detalles del Estudiante Colapsables

Los detalles del estudiante ahora se pueden expandir/colapsar:

- **Detalles del Estudiante**: Sección que incluye:
  - Nombre del estudiante
  - Email
  - Celular (si existe)
  - Matrícula (si existe)
  - Fecha de solicitud
  - Fecha preferida (si existe)
- **Estado inicial**: Siempre colapsado

## Implementación Técnica

### Estados de Colapso de Secciones

```typescript
// Estados para colapsar secciones (empiezan colapsadas)
const [pendientesExpanded, setPendientesExpanded] = useState(false);
const [confirmadasExpanded, setConfirmadasExpanded] = useState(false);
```

### Estados de Colapso de Textos y Detalles

```typescript
// Estado para controlar qué textos están expandidos (por id de cita)
const [expandedTexts, setExpandedTexts] = useState<Record<string | number, boolean>>({});

// Estado para controlar qué detalles de estudiante están expandidos (empiezan colapsados)
const [expandedDetails, setExpandedDetails] = useState<Record<string | number, boolean>>({});

// Función para alternar el estado de un texto
const toggleText = (citaId: string | number) => {
  setExpandedTexts(prev => ({
    ...prev,
    [citaId]: !prev[citaId]
  }));
};

// Función para alternar el estado de detalles de estudiante
const toggleDetails = (citaId: string | number) => {
  setExpandedDetails(prev => ({
    ...prev,
    [citaId]: !prev[citaId]
  }));
};

// Función para truncar texto
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
```

### Información Siempre Visible

Las siguientes fechas están **fuera** del collapse y siempre visibles:

```typescript
{/* Fechas fuera del collapse */}
<List dense sx={{ mb: 1 }}>
  <ListItem disablePadding>
    <ListItemIcon>
      <CalendarIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText
      primary="Fecha de solicitud"
      secondary={formatDate(solicitud.fecha_solicitud)}
    />
  </ListItem>

  {solicitud.fecha_propuesta_alumno && (
    <ListItem disablePadding>
      <ListItemIcon>
        <ScheduleIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary="Fecha preferida del alumno"
        secondary={formatDate(solicitud.fecha_propuesta_alumno)}
      />
    </ListItem>
  )}
</List>
```

### Componente de Encabezado Colapsable

```typescript
<Box 
  sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    mb: 2,
    cursor: 'pointer',
    '&:hover': {
      bgcolor: 'action.hover',
      borderRadius: 1,
      transition: 'background-color 0.2s'
    },
    p: 1,
    ml: -1
  }}
  onClick={() => setPendientesExpanded(!pendientesExpanded)}
>
  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
    <Badge badgeContent={solicitudesPendientes.length} color="warning">
      <ScheduleIcon sx={{ mr: 1 }} />
    </Badge>
    Solicitudes Pendientes
  </Typography>
  <IconButton size="small">
    {pendientesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
  </IconButton>
</Box>
```

### Uso del Componente Collapse

```typescript
<Collapse in={pendientesExpanded}>
  <Grid container spacing={2}>
    {/* Contenido de la sección */}
  </Grid>
</Collapse>
```

### Texto Colapsable

```typescript
<Box sx={{ mb: 2 }}>
  <Typography variant="body2" component="span">
    <strong>Motivo:</strong>{' '}
    {expandedTexts[solicitud.id_cita] || solicitud.motivo.length <= 100
      ? solicitud.motivo
      : truncateText(solicitud.motivo, 100)}
  </Typography>
  {solicitud.motivo.length > 100 && (
    <Button
      size="small"
      onClick={() => toggleText(solicitud.id_cita)}
      sx={{ 
        ml: 1, 
        textTransform: 'none',
        minWidth: 'auto',
        p: 0,
        fontSize: '0.875rem'
      }}
    >
      {expandedTexts[solicitud.id_cita] ? 'Ver menos' : 'Ver más'}
    </Button>
  )}
</Box>
```

## Iconos Utilizados

- **ExpandMoreIcon**: Indica que la sección está colapsada (se puede expandir)
- **ExpandLessIcon**: Indica que la sección está expandida (se puede colapsar)

## Comportamiento de Usuario

### Secciones

1. **Estado Inicial**: Todas las secciones están **colapsadas** por defecto
2. **Click en el Encabezado**: Alterna entre expandido/colapsado
3. **Indicador Visual**:
   - Hover sobre el encabezado muestra un fondo gris claro
   - El icono cambia según el estado (flecha arriba/abajo)

### Textos

1. **Textos Cortos (≤100 caracteres)**: Se muestran completos sin botón
2. **Textos Largos (>100 caracteres)**:
   - Se muestran truncados con "..." al final
   - Botón "Ver más" permite expandir el texto completo
   - Botón "Ver menos" permite colapsar el texto nuevamente

### Detalles del Estudiante

1. **Estado Inicial**: Siempre **colapsado** por defecto
2. **Click en el Encabezado**: Alterna entre expandido/colapsado
3. **Indicador Visual**:
   - Hover sobre el encabezado muestra un fondo gris claro
   - El icono cambia según el estado (flecha arriba/abajo)
4. **Contenido**: Muestra todos los detalles del estudiante cuando está expandido

## Identificadores de Textos y Detalles

Para evitar conflictos entre diferentes textos y secciones de la misma cita:

- **Motivo**: Se usa el `id_cita` directamente
- **Observaciones**: Se usa `obs-${id_cita}` como identificador
- **Detalles del Estudiante**: Se usa el `id_cita` directamente en `expandedDetails`

Ejemplo:
```typescript
// Motivo
expandedTexts[solicitud.id_cita]

// Observaciones
expandedTexts[`obs-${solicitud.id_cita}`]

// Detalles del Estudiante
expandedDetails[solicitud.id_cita]
```

## Componentes Afectados

1. **Frontend/ssp-frontend/src/components/SolicitudesCitas.tsx**
   - Secciones colapsables: Pendientes y Confirmadas (empiezan colapsadas)
   - Textos colapsables: Motivo y Observaciones
   - Detalles del Estudiante colapsables (empiezan colapsados)

2. **Frontend/ssp-frontend/src/components/SolicitudesPendientesCards.tsx**
   - Secciones colapsables: Pendientes y Confirmadas (empiezan colapsadas)
   - Textos colapsables: Motivo y Observaciones
   - Detalles del Estudiante colapsables (empiezan colapsados)

## Beneficios

1. **Mejor Organización Visual**: Los administradores pueden ocultar secciones que no necesitan ver
2. **Reducción de Scroll**: Al colapsar secciones, se reduce la cantidad de desplazamiento necesario
3. **Lectura Más Fácil**: Los textos largos no ocupan demasiado espacio visual
4. **Experiencia de Usuario Mejorada**: Interfaz más limpia y organizada
5. **Enfoque en lo Importante**: Al empezar colapsado, el usuario decide qué información ver
6. **Menos Saturación Visual**: Los detalles del estudiante solo se muestran cuando son necesarios

## Notas de Implementación

- Se utiliza el componente `Collapse` de Material-UI para animaciones suaves
- Los estados se mantienen localmente en cada componente
- No se persisten los estados de colapso (se reinician al recargar la página)
- La funcionalidad es completamente opcional y no afecta la funcionalidad existente

## Actualizaciones Futuras Posibles

1. Persistir el estado de colapso en localStorage
2. Agregar animaciones personalizadas
3. Permitir colapsar todas las secciones con un solo botón
4. Agregar configuración de longitud máxima de texto por usuario

