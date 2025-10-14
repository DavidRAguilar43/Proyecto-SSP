# Mejoras de UI en Cuestionarios

## Cambios Implementados

### 1. ✅ Configuración de Preguntas Colapsable

**Archivo:** `Frontend/ssp-frontend/src/components/cuestionarios/ConfiguracionPregunta.tsx`

#### Problema Anterior
La configuración de cada pregunta siempre estaba visible, ocupando mucho espacio vertical y dificultando la navegación cuando había múltiples preguntas.

#### Solución Implementada
Convertir la sección de configuración en un **apartado colapsable** con:
- Header clickeable con fondo gris claro
- Icono de expandir/colapsar
- Animación suave al abrir/cerrar
- Estado inicial: **colapsado** (para ahorrar espacio)

#### Código Agregado

**Imports:**
```typescript
import { useState } from 'react';
import {
  Collapse,
  Paper,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
```

**Estado:**
```typescript
const [expanded, setExpanded] = useState(false);
```

**UI:**
```typescript
<Box sx={{ mt: 2 }}>
  {/* Header colapsable */}
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      bgcolor: 'grey.50',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      cursor: 'pointer',
      '&:hover': {
        bgcolor: 'grey.100'
      }
    }}
    onClick={() => setExpanded(!expanded)}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Configuración
        </Typography>
        <Chip size="small" label={tipo.replace('_', ' ')} variant="outlined" />
      </Box>
      <IconButton size="small">
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>
  </Paper>

  {/* Contenido colapsable */}
  <Collapse in={expanded}>
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      {renderConfiguracion()}
    </Box>
  </Collapse>
</Box>
```

#### Beneficios
- ✅ Ahorra espacio vertical
- ✅ Mejor navegación entre preguntas
- ✅ Interfaz más limpia y organizada
- ✅ Fácil de expandir cuando se necesita configurar
- ✅ Indicador visual claro del tipo de pregunta

---

### 2. ✅ Colores Alternados en Preguntas

**Archivo:** `Frontend/ssp-frontend/src/components/cuestionarios/PreguntaBuilder.tsx`

#### Problema Anterior
Todas las preguntas tenían el mismo fondo blanco, dificultando distinguir visualmente dónde termina una pregunta y empieza otra, especialmente con múltiples preguntas.

#### Solución Implementada
Aplicar **colores de fondo alternados** a las tarjetas de preguntas:
- **Preguntas pares (0, 2, 4...)**: Azul claro
- **Preguntas impares (1, 3, 5...)**: Anaranjado claro

#### Código Agregado

```typescript
// Colores alternados: azul claro para pares, anaranjado claro para impares
const backgroundColor = index % 2 === 0 
  ? 'rgba(33, 150, 243, 0.08)'  // Azul claro
  : 'rgba(255, 152, 0, 0.08)';   // Anaranjado claro

return (
  <Card 
    sx={{ 
      mb: 2, 
      border: hasErrors ? '2px solid' : '1px solid',
      borderColor: hasErrors ? 'error.main' : 'divider',
      bgcolor: backgroundColor,  // ← Color alternado
      '&:hover': {
        boxShadow: 2
      }
    }}
  >
```

#### Paleta de Colores

**Azul Claro (Preguntas Pares):**
- RGB: `rgba(33, 150, 243, 0.08)`
- Opacidad: 8%
- Color base: Material Blue (#2196F3)

**Anaranjado Claro (Preguntas Impares):**
- RGB: `rgba(255, 152, 0, 0.08)`
- Opacidad: 8%
- Color base: Material Orange (#FF9800)

#### Beneficios
- ✅ Fácil distinción visual entre preguntas
- ✅ Mejor organización visual del formulario
- ✅ Colores suaves que no distraen
- ✅ Accesibilidad mantenida (contraste adecuado)
- ✅ Patrón visual consistente

---

## Comparación Antes/Después

### Antes

**Configuración:**
```
┌─────────────────────────────────────┐
│ Pregunta 1                          │
│ [Texto de la pregunta...]           │
│ [Tipo: Abierta]                     │
│                                     │
│ Configuración                       │
│ ─────────────────────────────────   │
│ [Longitud mínima: ___]              │
│ [Límite de caracteres: ___]         │  ← SIEMPRE VISIBLE
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Pregunta 2                          │
│ [Texto de la pregunta...]           │
│ [Tipo: Opción Múltiple]             │
│                                     │
│ Configuración                       │
│ ─────────────────────────────────   │
│ [☐ Selección múltiple]              │
│ [☐ Permitir otro]                   │  ← SIEMPRE VISIBLE
│ Opciones (2)                        │
│ [Opción 1]                          │
│ [Opción 2]                          │
└─────────────────────────────────────┘
```

**Problemas:**
- ❌ Mucho espacio vertical ocupado
- ❌ Difícil navegar con muchas preguntas
- ❌ Todas las preguntas se ven iguales
- ❌ Difícil distinguir límites entre preguntas

### Después

**Configuración:**
```
┌─────────────────────────────────────┐  ← AZUL CLARO
│ Pregunta 1                          │
│ [Texto de la pregunta...]           │
│ [Tipo: Abierta]                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Configuración [abierta] [▼]     │ │  ← COLAPSADO
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐  ← ANARANJADO CLARO
│ Pregunta 2                          │
│ [Texto de la pregunta...]           │
│ [Tipo: Opción Múltiple]             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Configuración [opción múltiple] │ │
│ │                            [▲]  │ │  ← EXPANDIDO
│ ├─────────────────────────────────┤ │
│ │ [☐ Selección múltiple]          │ │
│ │ [☐ Permitir otro]               │ │
│ │ Opciones (2)                    │ │
│ │ [Opción 1]                      │ │
│ │ [Opción 2]                      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Mejoras:**
- ✅ Menos espacio vertical (configuración colapsada)
- ✅ Fácil navegación entre preguntas
- ✅ Colores alternados para distinguir preguntas
- ✅ Límites claros entre preguntas
- ✅ Configuración accesible con un click

---

## Interacción del Usuario

### Expandir/Colapsar Configuración

1. **Estado inicial:** Configuración colapsada
2. **Click en header:** Expande la configuración con animación suave
3. **Click nuevamente:** Colapsa la configuración
4. **Hover:** Fondo cambia a gris más oscuro (feedback visual)

### Navegación Visual

1. **Pregunta 1:** Fondo azul claro
2. **Pregunta 2:** Fondo anaranjado claro
3. **Pregunta 3:** Fondo azul claro
4. **Pregunta 4:** Fondo anaranjado claro
5. **...**

El patrón se repite, facilitando el conteo y la navegación.

---

## Archivos Modificados

### 1. Frontend/ssp-frontend/src/components/cuestionarios/ConfiguracionPregunta.tsx
- ✅ Agregado estado `expanded`
- ✅ Agregado componente `Paper` como header clickeable
- ✅ Agregado componente `Collapse` para animación
- ✅ Agregados iconos `ExpandMoreIcon` y `ExpandLessIcon`
- ✅ Removido import no usado `Divider`

### 2. Frontend/ssp-frontend/src/components/cuestionarios/PreguntaBuilder.tsx
- ✅ Agregada lógica de colores alternados basada en `index`
- ✅ Aplicado `backgroundColor` al componente `Card`

---

## Testing

### Casos de Prueba

1. **Crear cuestionario con múltiples preguntas**
   - ✅ Verificar colores alternados (azul, naranja, azul, naranja...)
   - ✅ Verificar que configuración inicia colapsada
   - ✅ Verificar que se puede expandir/colapsar

2. **Editar cuestionario existente**
   - ✅ Verificar que colores se mantienen consistentes
   - ✅ Verificar que configuración funciona correctamente

3. **Navegación entre preguntas**
   - ✅ Verificar que es fácil distinguir límites
   - ✅ Verificar que colores ayudan a la navegación

4. **Accesibilidad**
   - ✅ Verificar contraste de texto sobre fondos de color
   - ✅ Verificar que header es clickeable
   - ✅ Verificar que iconos son claros

---

## Mejoras Futuras (Opcionales)

### 1. Persistencia del Estado de Expansión
Guardar en localStorage qué configuraciones están expandidas:
```typescript
const [expanded, setExpanded] = useState(() => {
  const saved = localStorage.getItem(`config-${pregunta.id}`);
  return saved === 'true';
});
```

### 2. Expandir/Colapsar Todas
Botón para expandir o colapsar todas las configuraciones a la vez:
```typescript
<Button onClick={expandirTodas}>Expandir Todas</Button>
<Button onClick={colapsarTodas}>Colapsar Todas</Button>
```

### 3. Más Opciones de Colores
Permitir al usuario elegir el esquema de colores:
- Azul/Naranja (actual)
- Verde/Morado
- Rosa/Cyan
- Modo oscuro

### 4. Indicador de Configuración Incompleta
Mostrar un badge en el header si falta configuración:
```typescript
<Badge badgeContent="!" color="error">
  <Typography>Configuración</Typography>
</Badge>
```

---

## Estado

- ✅ Configuración colapsable implementada
- ✅ Colores alternados implementados
- ✅ Animaciones suaves funcionando
- ✅ Feedback visual en hover
- ✅ Código limpio y optimizado
- ✅ Sin warnings de TypeScript
- ✅ Documentación completa

## Fecha
2025-09-27

## Relacionado
- Componente: `Frontend/ssp-frontend/src/components/cuestionarios/ConfiguracionPregunta.tsx`
- Componente: `Frontend/ssp-frontend/src/components/cuestionarios/PreguntaBuilder.tsx`
- Issue: Mejoras de UI en cuestionarios
- Patrón: Colapsables + Colores alternados

