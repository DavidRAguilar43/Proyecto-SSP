# Instrucciones para Probar la Actualización Visual

**Fecha**: 2025-10-26  
**Versión**: 1.0

---

## Requisitos Previos

Asegúrate de tener:
- Node.js instalado
- Dependencias del proyecto instaladas (`npm install`)
- Backend corriendo (si es necesario para funcionalidad completa)

---

## Pasos para Probar

### 1. Iniciar el Servidor de Desarrollo

```bash
cd Frontend/ssp-frontend
npm run dev
```

El servidor debería iniciar en `http://localhost:5173`

---

### 2. Verificar Página de Login

**URL**: `http://localhost:5173/login`

**Elementos a verificar**:
- ✅ Fondo de la página en gris azulado claro (#f5f7fa)
- ✅ Tarjeta de login con fondo blanco
- ✅ Encabezado "Sistema de Seguimiento Psicopedagógico" con fondo azul (#1976d2)
- ✅ Texto del encabezado en blanco
- ✅ Botón "Iniciar Sesión" en azul primario
- ✅ Botón "Registrate aquí" en púrpura (outlined)
- ✅ Campos de texto con fondo blanco
- ✅ Hover en campos cambia a gris muy claro

**Credenciales de prueba**:
- Usuario: `admin@uabc.edu.mx`
- Password: `12345678`

---

### 3. Verificar Dashboard Principal

**URL**: `http://localhost:5173/dashboard` (después de login)

**Elementos a verificar**:
- ✅ Fondo de la página en gris azulado claro (#f5f7fa)
- ✅ AppBar en azul primario con sombra
- ✅ Botón "Cerrar Sesión" con hover effect
- ✅ Tarjeta de bienvenida con:
  - Fondo blanco
  - Borde izquierdo azul (4px)
  - Título "Bienvenido al Dashboard" en azul
  - Sombra suave
- ✅ Tarjetas de funcionalidades con:
  - Fondo blanco
  - Border-radius redondeado
  - Sombra que aumenta en hover
  - Elevación en hover (translateY)

---

### 4. Verificar Tablas

**URL**: `http://localhost:5173/personas` (o cualquier página con tabla)

**Elementos a verificar**:
- ✅ Contenedor de tabla con border-radius
- ✅ Encabezados de tabla con fondo azul claro (#e3f2fd)
- ✅ Texto de encabezados en negrita (font-weight: 600)
- ✅ Filas impares con fondo gris muy claro (#fafafa)
- ✅ Hover en filas cambia a azul claro
- ✅ Chips de estado con colores apropiados:
  - Verde para "Activo"
  - Rojo para "Inactivo"
  - Colores según rol

---

### 5. Verificar Formularios

**URL**: Cualquier página con formularios (crear/editar)

**Elementos a verificar**:
- ✅ Campos de texto con fondo blanco
- ✅ Hover en campos cambia a gris claro
- ✅ Focus en campos mantiene fondo blanco
- ✅ Outline azul en focus (2px)
- ✅ Botones con colores apropiados:
  - Primarios en azul
  - Secundarios en púrpura
  - Cancelar en gris

---

### 6. Verificar Componentes Específicos

#### Botones
- ✅ Border-radius de 6px
- ✅ Sin text-transform (texto normal, no mayúsculas)
- ✅ Font-weight 500
- ✅ Sombra en botones contained
- ✅ Sombra aumenta en hover

#### Cards
- ✅ Border-radius de 8px
- ✅ Sombra base suave
- ✅ Sombra aumenta en hover
- ✅ Transición suave

#### Dialogs/Modales
- ✅ Border-radius de 12px
- ✅ Fondo blanco
- ✅ Sombra pronunciada

---

## Verificación de Accesibilidad

### Contraste de Color

**Herramienta recomendada**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Verificar**:
- ✅ Texto principal sobre fondo default: Ratio > 4.5:1
- ✅ Texto sobre botones primarios: Blanco sobre azul
- ✅ Texto sobre botones secundarios: Blanco sobre púrpura

### Focus Visible

**Verificar**:
- ✅ Navegar con Tab muestra outline azul
- ✅ Outline tiene 2px de grosor
- ✅ Offset de 2px para claridad

---

## Verificación de Responsive Design

### Desktop (> 1200px)
- ✅ Tarjetas en grid de 3 columnas
- ✅ Tablas con ancho completo
- ✅ Espaciado adecuado

### Tablet (768px - 1200px)
- ✅ Tarjetas en grid de 2 columnas
- ✅ Tablas con scroll horizontal si es necesario

### Mobile (< 768px)
- ✅ Tarjetas en columna única
- ✅ Tablas con scroll horizontal
- ✅ AppBar responsive

---

## Verificación de Scrollbar Personalizada

**Navegadores compatibles**: Chrome, Edge, Safari

**Verificar**:
- ✅ Scrollbar con ancho de 10px
- ✅ Track en gris claro (#f5f5f5)
- ✅ Thumb en gris medio (#bdbdbd)
- ✅ Hover en thumb cambia a gris más oscuro (#9e9e9e)

---

## Comparación Visual Antes/Después

### Antes
- Fondo completamente blanco
- Sin diferenciación entre secciones
- Elementos se pierden sobre el fondo
- Apariencia plana

### Después
- Fondo gris azulado suave
- Secciones claramente diferenciadas
- Elementos destacados con contraste
- Apariencia moderna y profesional

---

## Problemas Conocidos y Soluciones

### Problema: Los colores no se aplican

**Solución**:
1. Verificar que el servidor esté corriendo
2. Limpiar caché del navegador (Ctrl + Shift + R)
3. Verificar que no haya errores en la consola

### Problema: Scrollbar no se ve personalizada

**Solución**:
- La scrollbar personalizada solo funciona en navegadores basados en Chromium
- En Firefox, se usará la scrollbar por defecto del sistema

### Problema: Algunos componentes siguen blancos

**Solución**:
- Verificar que el componente esté usando `sx` props de MUI
- Asegurar que esté dentro del `ThemeProvider`
- Revisar que no tenga estilos inline que sobrescriban el tema

---

## Checklist de Verificación Completa

### Colores
- [ ] Fondo principal en #f5f7fa
- [ ] Tarjetas en blanco (#ffffff)
- [ ] AppBar en azul (#1976d2)
- [ ] Encabezados de tabla en azul claro (#e3f2fd)
- [ ] Botones primarios en azul
- [ ] Botones secundarios en púrpura

### Componentes
- [ ] LoginForm con encabezado azul
- [ ] Dashboard con fondo de color
- [ ] Tablas con encabezados coloreados
- [ ] Cards con efectos hover
- [ ] Botones con estilos mejorados
- [ ] Formularios con fondos diferenciados

### Interactividad
- [ ] Hover en botones funciona
- [ ] Hover en cards funciona
- [ ] Hover en filas de tabla funciona
- [ ] Focus visible en elementos interactivos
- [ ] Transiciones suaves

### Accesibilidad
- [ ] Contraste de texto adecuado
- [ ] Focus visible con outline azul
- [ ] Navegación con teclado funcional
- [ ] Scrollbar visible y usable

---

## Capturas de Pantalla Recomendadas

Para documentación, tomar capturas de:
1. Página de login completa
2. Dashboard principal
3. Tabla de personas
4. Formulario de creación/edición
5. Hover states de botones y cards
6. Focus states de campos de formulario

---

## Reporte de Problemas

Si encuentras algún problema:

1. **Verificar consola del navegador** para errores
2. **Tomar captura de pantalla** del problema
3. **Anotar pasos para reproducir** el problema
4. **Verificar versión del navegador**

---

## Próximos Pasos

Una vez verificado todo:

1. ✅ Confirmar que todos los elementos visuales funcionan
2. ✅ Verificar accesibilidad
3. ✅ Probar en diferentes navegadores
4. ✅ Probar en diferentes tamaños de pantalla
5. ✅ Documentar cualquier ajuste necesario

---

## Recursos Adicionales

- **Documentación del tema**: `docs/SISTEMA_DISENO_VISUAL.md`
- **Resumen de cambios**: `docs/RESUMEN_ACTUALIZACION_VISUAL.md`
- **Material-UI Docs**: https://mui.com/material-ui/
- **Paleta de colores**: Ver diagrama Mermaid generado

---

## Contacto

Para preguntas o problemas, consultar la documentación o revisar los archivos:
- `src/theme.ts` - Configuración del tema
- `src/index.css` - Estilos globales
- `src/App.tsx` - Integración del tema

