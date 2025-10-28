# Sistema de Diseño Visual - SSP Dashboard

## Fecha de Implementación
**2025-10-26**

---

## Objetivo

Reemplazar el diseño minimalista completamente blanco por una paleta de colores claros y suaves que mantenga una apariencia limpia y moderna, pero que proporcione suficiente contraste visual para que los elementos no se pierdan sobre el fondo.

---

## Paleta de Colores

### Colores Primarios

#### Azul Profesional (Primary)
- **Main**: `#1976d2` - Azul principal para elementos destacados
- **Light**: `#42a5f5` - Azul claro para variaciones
- **Dark**: `#1565c0` - Azul oscuro para estados hover/active
- **Uso**: AppBar, botones principales, enlaces, elementos de navegación

#### Púrpura/Morado (Secondary)
- **Main**: `#9c27b0` - Púrpura principal
- **Light**: `#ba68c8` - Púrpura claro
- **Dark**: `#7b1fa2` - Púrpura oscuro
- **Uso**: Botones secundarios, badges, elementos de acento

### Colores de Estado

#### Success (Verde)
- **Main**: `#2e7d32`
- **Light**: `#4caf50`
- **Dark**: `#1b5e20`
- **Uso**: Estados activos, confirmaciones, mensajes de éxito

#### Error (Rojo)
- **Main**: `#d32f2f`
- **Light**: `#ef5350`
- **Dark**: `#c62828`
- **Uso**: Errores, validaciones fallidas, estados inactivos

#### Warning (Naranja)
- **Main**: `#ed6c02`
- **Light**: `#ff9800`
- **Dark**: `#e65100`
- **Uso**: Advertencias, estados pendientes, alertas

#### Info (Azul Info)
- **Main**: `#0288d1`
- **Light**: `#03a9f4`
- **Dark**: `#01579b`
- **Uso**: Información general, tooltips, mensajes informativos

### Fondos y Superficies

#### Background Default
- **Color**: `#f5f7fa` - Gris azulado muy claro
- **Uso**: Fondo principal de la aplicación
- **Contraste**: Proporciona base neutra para todos los componentes

#### Background Paper
- **Color**: `#ffffff` - Blanco puro
- **Uso**: Tarjetas, contenedores, modales, formularios
- **Contraste**: Se destaca sobre el fondo default

#### Background Secondary
- **Color**: `#e3f2fd` - Azul muy claro
- **Uso**: Encabezados de tabla, secciones alternadas, fondos de énfasis
- **Contraste**: Diferenciación sutil pero clara

#### Background Tertiary
- **Color**: `#f3e5f5` - Púrpura muy claro
- **Uso**: Secciones especiales, elementos destacados alternativos

### Escala de Grises

- **Grey 50**: `#fafafa` - Casi blanco
- **Grey 100**: `#f5f5f5` - Muy claro
- **Grey 200**: `#eeeeee` - Claro
- **Grey 300**: `#e0e0e0` - Medio claro
- **Grey 400**: `#bdbdbd` - Medio
- **Grey 500**: `#9e9e9e` - Medio oscuro
- **Grey 600**: `#757575` - Oscuro
- **Grey 700**: `#616161` - Muy oscuro
- **Grey 800**: `#424242` - Casi negro
- **Grey 900**: `#212121` - Negro suave

**Uso**: Bordes, divisores, fondos alternados, texto secundario

### Colores de Texto

- **Primary**: `rgba(0, 0, 0, 0.87)` - Texto principal
- **Secondary**: `rgba(0, 0, 0, 0.6)` - Texto secundario
- **Disabled**: `rgba(0, 0, 0, 0.38)` - Texto deshabilitado

### Divisores y Bordes

- **Divider**: `rgba(0, 0, 0, 0.12)` - Líneas divisorias sutiles

---

## Componentes Personalizados

### AppBar
- **Elevación**: 2
- **Sombra**: `0 2px 4px rgba(0,0,0,0.1)`
- **Color de fondo**: `primary.main`
- **Color de texto**: Blanco

### Paper (Tarjetas y Contenedores)
- **Border Radius**: 8px
- **Elevación 1**: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- **Elevación 2**: `0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)`
- **Elevación 3**: `0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)`
- **Fondo**: `background.paper`

### Card
- **Border Radius**: 8px
- **Sombra base**: `0 2px 8px rgba(0,0,0,0.1)`
- **Sombra hover**: `0 4px 12px rgba(0,0,0,0.15)`
- **Transición**: `box-shadow 0.3s ease-in-out`
- **Hover**: Elevación y transformación suave

### Button
- **Border Radius**: 6px
- **Text Transform**: none (sin mayúsculas automáticas)
- **Font Weight**: 500
- **Padding**: 8px 16px

#### Contained
- **Sombra**: `0 2px 4px rgba(0,0,0,0.1)`
- **Sombra hover**: `0 4px 8px rgba(0,0,0,0.15)`

#### Outlined
- **Border Width**: 1.5px
- **Hover**: Mantiene border width

### TextField
- **Fondo**: `#ffffff`
- **Fondo hover**: `#fafafa`
- **Fondo focused**: `#ffffff`
- **Border Radius**: 4px

### Table

#### TableHead
- **Fondo**: `background.secondary` (#e3f2fd)
- **Font Weight**: 600
- **Color**: `text.primary`

#### TableRow
- **Filas impares**: `#fafafa`
- **Hover**: `background.secondary`
- **Transición**: Suave

### Chip
- **Font Weight**: 500
- **Border Radius**: 16px (por defecto de MUI)

### Dialog
- **Border Radius**: 12px
- **Sombra**: Elevación 24 de MUI

---

## Variables CSS Personalizadas

Ubicación: `src/index.css`

```css
:root {
  /* Colores primarios */
  --color-primary: #1976d2;
  --color-primary-light: #42a5f5;
  --color-primary-dark: #1565c0;
  
  /* Colores secundarios */
  --color-secondary: #9c27b0;
  --color-secondary-light: #ba68c8;
  --color-secondary-dark: #7b1fa2;
  
  /* Colores de estado */
  --color-success: #2e7d32;
  --color-error: #d32f2f;
  --color-warning: #ed6c02;
  --color-info: #0288d1;
  
  /* Fondos */
  --bg-default: #f5f7fa;
  --bg-paper: #ffffff;
  --bg-secondary: #e3f2fd;
  --bg-tertiary: #f3e5f5;
  --bg-hover: #fafafa;
  
  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  --shadow-md: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
  --shadow-lg: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10);
}
```

---

## Accesibilidad

### Contraste de Color
- **Texto sobre fondo claro**: Cumple WCAG AA (mínimo 4.5:1)
- **Texto sobre colores primarios**: Blanco para máximo contraste
- **Estados de foco**: Outline de 2px en color primario

### Focus Visible
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## Implementación

### Archivos Modificados

1. **`src/theme.ts`** (NUEVO)
   - Configuración completa del tema de Material-UI
   - Paleta de colores
   - Personalización de componentes
   - Tipografía

2. **`src/index.css`**
   - Variables CSS globales
   - Estilos base
   - Scrollbar personalizada
   - Mejoras de accesibilidad

3. **`src/App.tsx`**
   - Integración de ThemeProvider
   - Aplicación del tema a toda la aplicación

4. **Componentes actualizados**:
   - `LoginForm.tsx` - Encabezado con fondo de color, botones mejorados
   - `Dashboard.tsx` - AppBar mejorado, tarjetas con mejor contraste
   - `PersonasTable.tsx` - Encabezados de tabla con fondo de color
   - `GenericTableWithBulkDelete.tsx` - Encabezados de tabla con fondo de color

---

## Uso del Tema

### En Componentes

```tsx
import { Box, Paper, Button } from '@mui/material';

// Usar colores del tema
<Box sx={{ backgroundColor: 'background.default' }}>
  <Paper sx={{ backgroundColor: 'background.paper' }}>
    <Button color="primary">Botón Principal</Button>
    <Button color="secondary">Botón Secundario</Button>
  </Paper>
</Box>
```

### Acceder a Colores Personalizados

```tsx
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.secondary,
      color: theme.palette.text.primary 
    }}>
      Contenido
    </Box>
  );
};
```

---

## Beneficios

✅ **Diferenciación visual clara** entre componentes
✅ **Contraste adecuado** para accesibilidad (WCAG AA)
✅ **Apariencia limpia y moderna** con colores suaves
✅ **Jerarquía visual consistente** en toda la aplicación
✅ **Fácil mantenimiento** con tema centralizado
✅ **Escalabilidad** para futuras personalizaciones

---

## Próximos Pasos (Opcional)

1. **Modo Oscuro**: Implementar tema oscuro alternativo
2. **Personalización por Usuario**: Permitir selección de esquemas de color
3. **Animaciones**: Agregar transiciones más elaboradas
4. **Componentes Adicionales**: Extender personalización a más componentes

