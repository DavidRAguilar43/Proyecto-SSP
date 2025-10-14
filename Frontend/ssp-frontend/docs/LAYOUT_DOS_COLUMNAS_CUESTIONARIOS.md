# Layout de Dos Columnas en Cuestionarios

## Cambio Implementado

### Reorganización Completa del Formulario

**Archivo:** `Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx`

#### Problema Anterior
El formulario tenía un layout confuso con:
- Información básica arriba (8 columnas)
- Asignación de usuarios a la derecha (4 columnas)
- Preguntas abajo (ancho completo)
- Botones de acción al final

**Problemas:**
- ❌ Mucho scroll vertical
- ❌ Botones de acción muy lejos
- ❌ Difícil navegar entre secciones
- ❌ No se ve el contexto completo

#### Solución Implementada

**Layout de dos columnas:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │   COLUMNA    │  │        COLUMNA               │   │
│  │  IZQUIERDA   │  │        DERECHA               │   │
│  │   (4 cols)   │  │        (8 cols)              │   │
│  │              │  │                              │   │
│  │ • Info       │  │  ┌────────────────────────┐  │   │
│  │   Básica     │  │  │ Pregunta 1 (azul)      │  │   │
│  │              │  │  └────────────────────────┘  │   │
│  │ • Asignación │  │                              │   │
│  │   Usuarios   │  │  ┌────────────────────────┐  │   │
│  │              │  │  │ Pregunta 2 (naranja)   │  │   │
│  │ • Agregar    │  │  └────────────────────────┘  │   │
│  │   Pregunta   │  │                              │   │
│  │              │  │  ┌────────────────────────┐  │   │
│  │ • Acciones:  │  │  │ Pregunta 3 (azul)      │  │   │
│  │   - Vista    │  │  └────────────────────────┘  │   │
│  │     Previa   │  │                              │   │
│  │   - Guardar  │  │  ...                         │   │
│  │     Borrador │  │                              │   │
│  │   - Crear    │  │                              │   │
│  │   - Cancelar │  │                              │   │
│  │              │  │                              │   │
│  └──────────────┘  └──────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Estructura Detallada

### COLUMNA IZQUIERDA (4 columnas - md={4})

#### 1. Card: Información Básica
```typescript
<Card>
  <CardContent>
    <Typography variant="h6">Información Básica</Typography>
    
    <TextField label="Título del cuestionario" />
    <TextField label="Descripción" multiline rows={3} />
    <Select label="Estado">
      <MenuItem value="borrador">Borrador</MenuItem>
      <MenuItem value="activo">Activo</MenuItem>
      <MenuItem value="inactivo">Inactivo</MenuItem>
    </Select>
    <TextField label="Fecha de inicio" type="datetime-local" />
    <TextField label="Fecha de fin" type="datetime-local" />
  </CardContent>
</Card>
```

**Campos:**
- ✅ Título (100 caracteres max)
- ✅ Descripción (500 caracteres max, 3 filas)
- ✅ Estado (Borrador/Activo/Inactivo)
- ✅ Fecha de inicio (datetime-local)
- ✅ Fecha de fin (datetime-local)

#### 2. Card: Asignación de Usuarios
```typescript
<Card>
  <CardContent>
    <Typography variant="h6">Asignación de Usuarios</Typography>
    <AsignacionUsuarios
      tiposSeleccionados={tiposUsuario}
      onChange={setTiposUsuario}
      error={tiposUsuario.length === 0 && validacion !== null}
    />
  </CardContent>
</Card>
```

**Funcionalidad:**
- ✅ Selección de tipos de usuario
- ✅ Opciones rápidas (Todos, Ninguno)
- ✅ Resumen de selección
- ✅ Validación de al menos un tipo

#### 3. Botón: Agregar Pregunta
```typescript
<Button
  fullWidth
  startIcon={<AddIcon />}
  onClick={agregarPregunta}
  variant="contained"
  disabled={preguntas.length >= 50}
>
  Agregar Pregunta
</Button>
```

**Características:**
- ✅ Ancho completo
- ✅ Icono de agregar
- ✅ Deshabilitado si hay 50 preguntas
- ✅ Fácil acceso sin scroll

#### 4. Card: Acciones
```typescript
<Card>
  <CardContent>
    <Typography variant="subtitle2">Acciones</Typography>
    
    <Button fullWidth variant="outlined">Vista Previa</Button>
    <Button fullWidth variant="outlined">Guardar Borrador</Button>
    
    <Divider />
    
    <Button fullWidth variant="contained" size="large">
      Crear Cuestionario / Guardar Cambios
    </Button>
    <Button fullWidth variant="text">Cancelar</Button>
  </CardContent>
</Card>
```

**Botones (en orden):**
1. ✅ **Vista Previa** (outlined) - Ver cómo se verá el cuestionario
2. ✅ **Guardar Borrador** (outlined) - Guardar sin publicar
3. ✅ **Divider** - Separador visual
4. ✅ **Crear Cuestionario** (contained, large) - Acción principal
5. ✅ **Cancelar** (text) - Volver atrás

### COLUMNA DERECHA (8 columnas - md={8})

#### Card: Lista de Preguntas
```typescript
<Card>
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h6">Preguntas ({preguntas.length})</Typography>
      <Chip label={`${preguntas.length} pregunta(s)`} />
    </Box>

    {preguntas.length === 0 && (
      <Alert severity="info">
        Agregue al menos una pregunta para completar el cuestionario.
        Use el botón "Agregar Pregunta" en el panel lateral.
      </Alert>
    )}

    {preguntas.map((pregunta, index) => (
      <PreguntaBuilder
        key={pregunta.id}
        pregunta={pregunta}
        onChange={...}
        onDelete={...}
        onDuplicate={...}
        index={index}
        totalPreguntas={preguntas.length}
        errors={...}
      />
    ))}
  </CardContent>
</Card>
```

**Características:**
- ✅ Header con contador de preguntas
- ✅ Chip con número de preguntas
- ✅ Alert cuando no hay preguntas
- ✅ Lista de preguntas con colores alternados
- ✅ Scroll independiente si hay muchas preguntas

## Comparación Antes/Después

### Antes (Layout Horizontal)

```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────┐  ┌──────────────────┐  │
│ │ Información Básica  │  │ Asignación       │  │
│ │ (8 cols)            │  │ Usuarios         │  │
│ │                     │  │ (4 cols)         │  │
│ └─────────────────────┘  └──────────────────┘  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Preguntas (12 cols)                         │ │
│ │                                             │ │
│ │ [Agregar Pregunta]                          │ │
│ │                                             │ │
│ │ Pregunta 1                                  │ │
│ │ Pregunta 2                                  │ │
│ │ Pregunta 3                                  │ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Cancelar] [Borrador] [Preview] [Crear]        │
└─────────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Botones muy abajo (mucho scroll)
- ❌ Información básica separada de acciones
- ❌ Difícil ver contexto completo
- ❌ Mucho espacio desperdiciado

### Después (Layout Vertical de Dos Columnas)

```
┌─────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ Info Básica  │  │ Preguntas (8)            │ │
│ │              │  │                          │ │
│ │ Asignación   │  │ Pregunta 1 (azul)        │ │
│ │              │  │                          │ │
│ │ [+ Pregunta] │  │ Pregunta 2 (naranja)     │ │
│ │              │  │                          │ │
│ │ Acciones:    │  │ Pregunta 3 (azul)        │ │
│ │ [Preview]    │  │                          │ │
│ │ [Borrador]   │  │ ...                      │ │
│ │ ────────     │  │                          │ │
│ │ [CREAR]      │  │                          │ │
│ │ [Cancelar]   │  │                          │ │
│ │              │  │                          │ │
│ │ (4 cols)     │  │ (8 cols)                 │ │
│ └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Mejoras:**
- ✅ Botones siempre visibles (sin scroll)
- ✅ Contexto completo en una vista
- ✅ Flujo lógico de trabajo
- ✅ Mejor uso del espacio

## Flujo de Trabajo

### Crear Cuestionario

1. **Llenar información básica** (columna izquierda)
   - Título
   - Descripción
   - Estado
   - Fechas

2. **Seleccionar usuarios** (columna izquierda)
   - Tipos de usuario asignados

3. **Agregar preguntas** (botón en columna izquierda)
   - Click en "Agregar Pregunta"
   - Pregunta aparece en columna derecha

4. **Configurar preguntas** (columna derecha)
   - Editar texto
   - Seleccionar tipo
   - Configurar opciones (colapsable)

5. **Revisar y guardar** (columna izquierda)
   - Vista previa
   - Guardar borrador
   - Crear cuestionario

## Responsive Design

### Desktop (md y superior)
```
┌──────────────┐  ┌──────────────────────────┐
│   4 cols     │  │        8 cols            │
│   Lateral    │  │      Preguntas           │
└──────────────┘  └──────────────────────────┘
```

### Tablet/Mobile (xs a sm)
```
┌─────────────────────────────────────────────┐
│              12 cols                        │
│            Lateral                          │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│              12 cols                        │
│            Preguntas                        │
└─────────────────────────────────────────────┘
```

En pantallas pequeñas, las columnas se apilan verticalmente.

## Beneficios

### UX (Experiencia de Usuario)
- ✅ **Menos scroll**: Botones siempre visibles
- ✅ **Contexto completo**: Todo en una vista
- ✅ **Flujo lógico**: De izquierda a derecha
- ✅ **Acciones rápidas**: Botones accesibles
- ✅ **Organización clara**: Separación visual

### UI (Interfaz de Usuario)
- ✅ **Mejor uso del espacio**: Columnas balanceadas
- ✅ **Jerarquía visual**: Lateral vs contenido
- ✅ **Consistencia**: Patrón común en apps
- ✅ **Responsive**: Funciona en todos los tamaños

### Desarrollo
- ✅ **Código limpio**: Estructura clara
- ✅ **Mantenible**: Fácil de modificar
- ✅ **Escalable**: Fácil agregar secciones

## Archivos Modificados

### Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx
- ✅ Reorganizado Grid container
- ✅ Columna izquierda (md={4}): Lateral con opciones
- ✅ Columna derecha (md={8}): Lista de preguntas
- ✅ Botones movidos a columna lateral
- ✅ Botón "Agregar Pregunta" en lateral
- ✅ Acciones agrupadas en Card
- ✅ Divider entre acciones secundarias y primarias

## Testing

### Casos de Prueba

1. **Crear cuestionario nuevo**
   - ✅ Verificar layout de dos columnas
   - ✅ Verificar botones visibles sin scroll
   - ✅ Verificar agregar pregunta funciona
   - ✅ Verificar preguntas aparecen en columna derecha

2. **Editar cuestionario existente**
   - ✅ Verificar datos se cargan correctamente
   - ✅ Verificar preguntas se muestran en columna derecha
   - ✅ Verificar botones funcionan

3. **Responsive**
   - ✅ Verificar en desktop (dos columnas)
   - ✅ Verificar en tablet (dos columnas)
   - ✅ Verificar en móvil (columnas apiladas)

4. **Interacciones**
   - ✅ Agregar pregunta
   - ✅ Eliminar pregunta
   - ✅ Duplicar pregunta
   - ✅ Vista previa
   - ✅ Guardar borrador
   - ✅ Crear/Guardar
   - ✅ Cancelar

## Estado

- ✅ Layout de dos columnas implementado
- ✅ Columna lateral con opciones
- ✅ Columna derecha con preguntas
- ✅ Botones reorganizados
- ✅ Responsive design
- ✅ Documentación completa

## Fecha
2025-09-27

## Relacionado
- Componente: `Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx`
- Issue: Layout de dos columnas en cuestionarios
- Patrón: Sidebar + Content

