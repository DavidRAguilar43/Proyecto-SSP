# Columna Lateral Sticky y Proporciones Optimizadas

## Cambios Implementados

### 1. ✅ Proporciones de Columnas Ajustadas

**Archivo:** `Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx`

#### Antes (4:8)
```
┌────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────────────────┐│
│ │          │  │                          ││
│ │  Lateral │  │       Preguntas          ││
│ │          │  │                          ││
│ │ 4 cols   │  │       8 cols             ││
│ │ (33%)    │  │       (67%)              ││
│ │          │  │                          ││
│ └──────────┘  └──────────────────────────┘│
└────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Lateral muy ancho (33%)
- ❌ Preguntas con poco espacio (67%)
- ❌ Desperdicio de espacio en lateral
- ❌ Preguntas apretadas

#### Ahora (3:9)
```
┌────────────────────────────────────────────┐
│ ┌──────┐  ┌────────────────────────────┐ │
│ │      │  │                            │ │
│ │Lateral│ │        Preguntas           │ │
│ │      │  │                            │ │
│ │3 cols│  │        9 cols              │ │
│ │(25%) │  │        (75%)               │ │
│ │      │  │                            │ │
│ └──────┘  └────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Mejoras:**
- ✅ Lateral más compacto (25%)
- ✅ Preguntas con más espacio (75%)
- ✅ Mejor uso del espacio
- ✅ Prioridad a las preguntas

### 2. ✅ Columna Lateral Sticky (Fija)

#### Problema Anterior
Al agregar preguntas, la columna lateral se desplazaba hacia abajo:

```
ANTES DE AGREGAR PREGUNTA:
┌──────┐  ┌────────────┐
│      │  │ Pregunta 1 │
│Lateral│ └────────────┘
│      │  
│      │  
└──────┘  

DESPUÉS DE AGREGAR PREGUNTA:
         ┌────────────┐
         │ Pregunta 1 │
         └────────────┘
         ┌────────────┐
         │ Pregunta 2 │
         └────────────┘
┌──────┐ ┌────────────┐
│      │ │ Pregunta 3 │
│Lateral│ └────────────┘
│      │  
└──────┘  ← SE MOVIÓ HACIA ABAJO ❌
```

#### Solución Implementada

**Columna lateral con `position: sticky`:**

```typescript
<Box
  sx={{
    position: 'sticky',
    top: 16,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  }}
>
  {/* Contenido de la columna lateral */}
</Box>
```

**Ahora:**
```
SIEMPRE:
┌──────┐  ┌────────────┐
│      │  │ Pregunta 1 │
│Lateral│ └────────────┘
│      │  ┌────────────┐
│FIJO  │  │ Pregunta 2 │
│      │  └────────────┘
└──────┘  ┌────────────┐
          │ Pregunta 3 │
          └────────────┘
          ┌────────────┐
          │ Pregunta 4 │
          └────────────┘
          ...
          
← SIEMPRE VISIBLE ✅
```

## Propiedades CSS Aplicadas

### position: sticky
```css
position: sticky;
top: 16px;
```
- La columna se "pega" a 16px del top del viewport
- Se mantiene visible al hacer scroll
- No se mueve al agregar/eliminar preguntas

### maxHeight
```css
maxHeight: 'calc(100vh - 32px)'
```
- Altura máxima = altura del viewport - 32px (16px arriba + 16px abajo)
- Evita que la columna sea más alta que la pantalla
- Permite scroll interno si el contenido es muy largo

### overflowY: auto
```css
overflowY: 'auto'
```
- Scroll vertical automático si el contenido excede maxHeight
- Scroll interno en la columna lateral
- No afecta el scroll de la página principal

### overflowX: hidden
```css
overflowX: 'hidden'
```
- Evita scroll horizontal
- Mantiene el contenido dentro del ancho de la columna

### Custom Scrollbar
```css
'&::-webkit-scrollbar': {
  width: '8px',
}
'&::-webkit-scrollbar-track': {
  background: '#f1f1f1',
  borderRadius: '4px',
}
'&::-webkit-scrollbar-thumb': {
  background: '#888',
  borderRadius: '4px',
}
'&::-webkit-scrollbar-thumb:hover': {
  background: '#555',
}
```
- Scrollbar personalizado de 8px de ancho
- Track gris claro (#f1f1f1)
- Thumb gris (#888)
- Hover más oscuro (#555)
- Bordes redondeados (4px)

## Comparación de Proporciones

### Antes (4:8)
| Columna  | Grid Cols | Porcentaje | Ancho (1920px) |
|----------|-----------|------------|----------------|
| Lateral  | 4         | 33.33%     | ~640px         |
| Preguntas| 8         | 66.67%     | ~1280px        |

### Ahora (3:9)
| Columna  | Grid Cols | Porcentaje | Ancho (1920px) |
|----------|-----------|------------|----------------|
| Lateral  | 3         | 25%        | ~480px         |
| Preguntas| 9         | 75%        | ~1440px        |

**Ganancia:**
- Lateral: -160px (más compacto)
- Preguntas: +160px (más espacio)

## Comportamiento de Scroll

### Scroll de Página (Vertical)
```
┌──────────────────────────────────────┐
│ ┌──────┐  ┌────────────┐            │
│ │      │  │ Pregunta 1 │            │
│ │Lateral│ └────────────┘            │
│ │FIJO  │  ┌────────────┐            │
│ │      │  │ Pregunta 2 │            │
│ └──────┘  └────────────┘            │
│           ┌────────────┐            │
│           │ Pregunta 3 │ ← Scroll  │
│           └────────────┘            │
│           ┌────────────┐            │
│           │ Pregunta 4 │            │
│           └────────────┘            │
└──────────────────────────────────────┘
```

- Usuario hace scroll en la página
- Columna lateral permanece fija
- Preguntas se desplazan normalmente

### Scroll Interno (Lateral)
```
┌──────┐
│ ▲    │ ← Scroll interno
│ Info │
│ Asig │
│ [+]  │
│ Acc  │
│ ▼    │
└──────┘
```

- Si el contenido lateral es muy largo
- Aparece scrollbar interno (8px)
- Scroll independiente del scroll de página

## Ventajas del Diseño

### UX (Experiencia de Usuario)
1. **Botones siempre accesibles**
   - No importa cuántas preguntas agregues
   - Botones siempre visibles sin scroll
   - Acceso rápido a acciones

2. **Contexto constante**
   - Información básica siempre visible
   - Asignación de usuarios siempre visible
   - No pierdes el contexto al editar preguntas

3. **Flujo de trabajo eficiente**
   - Agregar pregunta → Aparece a la derecha
   - Editar pregunta → Lateral sigue visible
   - Guardar → Botón siempre accesible

4. **Menos confusión**
   - Lateral no se mueve
   - Posición predecible de botones
   - Interfaz estable

### UI (Interfaz de Usuario)
1. **Mejor uso del espacio**
   - 75% para preguntas (prioridad)
   - 25% para opciones (compacto)
   - Proporción óptima

2. **Jerarquía visual clara**
   - Preguntas = contenido principal
   - Lateral = opciones secundarias
   - Prioridad visual correcta

3. **Diseño moderno**
   - Patrón común en apps modernas
   - Sidebar sticky es estándar
   - Familiar para usuarios

## Responsive Design

### Desktop (md y superior)
```
┌──────┐  ┌────────────────────────┐
│ 3    │  │         9              │
│ cols │  │        cols            │
│ 25%  │  │        75%             │
└──────┘  └────────────────────────┘
```

### Tablet/Mobile (xs a sm)
```
┌─────────────────────────────────┐
│           12 cols               │
│           100%                  │
│          Lateral                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│           12 cols               │
│           100%                  │
│         Preguntas               │
└─────────────────────────────────┘
```

En pantallas pequeñas:
- Columnas apiladas verticalmente
- Lateral arriba (no sticky)
- Preguntas abajo
- Cada sección 100% de ancho

## Casos de Uso

### Caso 1: Crear cuestionario con muchas preguntas
```
Usuario agrega 20 preguntas:
┌──────┐  ┌────────────┐
│      │  │ Pregunta 1 │
│Lateral│ └────────────┘
│FIJO  │  ┌────────────┐
│      │  │ Pregunta 2 │
│[+]   │  └────────────┘
│[Crear]│ ...
└──────┘  ┌────────────┐
          │Pregunta 20 │
          └────────────┘

✅ Botón [+] siempre visible
✅ Botón [Crear] siempre accesible
✅ No necesita scroll para agregar más
```

### Caso 2: Editar pregunta en medio de la lista
```
Usuario edita Pregunta 10:
┌──────┐  ┌────────────┐
│      │  │ Pregunta 8 │
│Lateral│ └────────────┘
│FIJO  │  ┌────────────┐
│      │  │ Pregunta 9 │
│Info  │  └────────────┘
│visible│ ┌────────────┐
└──────┘  │Pregunta 10 │ ← Editando
          │[Config ▼]  │
          └────────────┘

✅ Información básica visible
✅ Puede cambiar título mientras edita
✅ Contexto completo disponible
```

### Caso 3: Guardar cuestionario
```
Usuario termina de editar:
┌──────┐  ┌────────────┐
│      │  │Pregunta 15 │
│Lateral│ └────────────┘
│FIJO  │  ┌────────────┐
│      │  │Pregunta 16 │
│      │  └────────────┘
│[Crear]│ ← SIEMPRE VISIBLE
└──────┘  

✅ No necesita scroll hasta arriba
✅ Botón [Crear] siempre accesible
✅ Guardado rápido
```

## Archivos Modificados

### Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx

**Cambios:**
1. ✅ Columna lateral: `md={4}` → `md={3}` (33% → 25%)
2. ✅ Columna preguntas: `md={8}` → `md={9}` (67% → 75%)
3. ✅ Agregado `Box` wrapper con `position: sticky`
4. ✅ Agregado `maxHeight: calc(100vh - 32px)`
5. ✅ Agregado `overflowY: auto` para scroll interno
6. ✅ Agregado custom scrollbar styling

## Testing

### Casos de Prueba

1. **Agregar múltiples preguntas**
   - ✅ Lateral permanece fijo
   - ✅ Botones siempre visibles
   - ✅ No se mueve al agregar preguntas

2. **Scroll de página**
   - ✅ Lateral sticky funciona
   - ✅ Se mantiene a 16px del top
   - ✅ Preguntas hacen scroll normalmente

3. **Scroll interno (lateral)**
   - ✅ Si contenido es muy largo, aparece scrollbar
   - ✅ Scrollbar personalizado (8px, gris)
   - ✅ Scroll independiente

4. **Responsive**
   - ✅ Desktop: 3:9 (25%:75%)
   - ✅ Tablet: 3:9 (25%:75%)
   - ✅ Móvil: Columnas apiladas

5. **Proporciones**
   - ✅ Lateral más compacto
   - ✅ Preguntas con más espacio
   - ✅ Mejor uso del espacio

## Mejoras Futuras (Opcionales)

### 1. Colapsar Lateral
Botón para colapsar/expandir la columna lateral:
```typescript
const [lateralCollapsed, setLateralCollapsed] = useState(false);

<Grid item xs={12} md={lateralCollapsed ? 1 : 3}>
  {lateralCollapsed ? (
    <IconButton onClick={() => setLateralCollapsed(false)}>
      <ChevronRightIcon />
    </IconButton>
  ) : (
    // Contenido completo
  )}
</Grid>
```

### 2. Ajuste de Ancho Dinámico
Permitir al usuario ajustar el ancho de las columnas:
```typescript
const [lateralWidth, setLateralWidth] = useState(3);

<Grid item xs={12} md={lateralWidth}>
  <Slider
    value={lateralWidth}
    onChange={(e, val) => setLateralWidth(val)}
    min={2}
    max={4}
  />
</Grid>
```

### 3. Guardar Preferencias
Guardar el ancho preferido en localStorage:
```typescript
useEffect(() => {
  const saved = localStorage.getItem('lateralWidth');
  if (saved) setLateralWidth(parseInt(saved));
}, []);

useEffect(() => {
  localStorage.setItem('lateralWidth', lateralWidth.toString());
}, [lateralWidth]);
```

## Estado

- ✅ Proporciones ajustadas (3:9)
- ✅ Columna lateral sticky implementada
- ✅ Scroll interno funcionando
- ✅ Custom scrollbar aplicado
- ✅ Responsive design mantenido
- ✅ Documentación completa

## Fecha
2025-09-27

## Relacionado
- Componente: `Frontend/ssp-frontend/src/components/cuestionarios/CuestionarioForm.tsx`
- Issue: Columna lateral sticky y proporciones optimizadas
- Patrón: Sticky sidebar + Scroll independiente

