# Conversión de Vistas a Formato de Tabla

## Resumen
Se han convertido todas las vistas de catálogos y gestión de cuestionarios de formato de tarjetas (Grid/Card) a formato de tabla (Table) para mejorar la visualización, comparación y gestión de datos.

## Fecha de Implementación
2025-11-06

---

## 1. Catálogos Administrativos

### Archivos Modificados
- `Frontend/ssp-frontend/src/components/admin/CatalogosAdmin.tsx`

### Catálogos Convertidos
1. **Religiones**
2. **Grupos Étnicos**
3. **Discapacidades**
4. **Modelos IA** (ya estaba en formato tabla)

### Estructura de Tabla para Catálogos Estándar

#### Columnas
| Columna | Descripción | Formato |
|---------|-------------|---------|
| **Título** | Nombre del elemento | Texto en negrita |
| **Estado** | Activo/Inactivo | Chip verde/gris |
| **Fecha Creación** | Cuándo se creó | Formato corto (ej: "6 nov 2025") |
| **Última Actualización** | Última modificación | Formato corto |
| **Acciones** | Botones de acción | Iconos con tooltips |

#### Acciones Disponibles
- ✏️ **Editar** - Modificar el elemento
- 🗑️ **Eliminar** - Borrar el elemento (solo admin)
- ✅ **Activar** - Activar elemento inactivo

#### Código de Ejemplo

```typescript
<TableContainer component={Paper} variant="outlined">
  <Table>
    <TableHead>
      <TableRow sx={{ backgroundColor: 'background.secondary' }}>
        <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
        <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Fecha Creación</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Última Actualización</TableCell>
        <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id} hover>
          <TableCell>
            <Typography variant="body2" fontWeight="medium">
              {item.titulo}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Chip 
              label={item.activo ? 'Activo' : 'Inactivo'} 
              color={item.activo ? 'success' : 'default'}
              size="small"
            />
          </TableCell>
          <TableCell>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.fecha_creacion)}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.fecha_actualizacion)}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Box display="flex" gap={0.5} justifyContent="center">
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => handleEdit(item)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {/* Más acciones... */}
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

---

## 2. Modelos IA (Catálogo Especial)

### Estructura de Tabla para Modelos IA

#### Columnas
| Columna | Descripción | Formato |
|---------|-------------|---------|
| **Título** | Nombre amigable | Texto en negrita |
| **ID del Modelo** | ID técnico | Fuente monospace |
| **Proveedor** | Empresa proveedora | Texto normal |
| **Categoría** | Nivel del modelo | Chip de color (Premium/Standard/Budget) |
| **Descripción** | Detalles del modelo | Texto truncado con tooltip |
| **Recomendado** | Para reportes | Chip "Sí" o texto "No" |
| **Estado** | Activo/Inactivo | Chip verde/gris |
| **Acciones** | Botones de acción | Iconos con tooltips |

#### Características Especiales
- **Categorías con colores**:
  - 🔵 Premium = `color="primary"`
  - ⚪ Standard = `color="default"`
  - 🟣 Budget = `color="secondary"`
- **Tooltips** en descripciones largas
- **Campo recomendado** para destacar modelos preferidos

---

## 3. Gestión de Cuestionarios

### Archivos Modificados
- `Frontend/ssp-frontend/src/pages/admin/CuestionariosPage.tsx`

### Cambios Realizados

#### Imports Agregados
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  TablePagination
} from '@mui/material';
```

#### Estructura de Tabla

##### Columnas
| Columna | Descripción | Formato |
|---------|-------------|---------|
| **Título** | Nombre del cuestionario | Texto en negrita |
| **Descripción** | Descripción del cuestionario | Texto truncado con tooltip |
| **Estado** | Estado actual | Chip de color (activo/borrador/inactivo) |
| **Preguntas** | Número de preguntas | Chip outlined |
| **Asignado a** | Tipos de usuario | Chips de tipos de usuario |
| **Creado** | Fecha y autor | Fecha + nombre del creador |
| **Acciones** | Botones de acción | 5 iconos con tooltips |

##### Acciones Disponibles
1. 👁️ **Ver detalles** - Ver información completa
2. ✏️ **Editar** - Modificar cuestionario
3. 📋 **Duplicar** - Crear copia
4. ✅/❌ **Activar/Desactivar** - Cambiar estado
5. 🗑️ **Eliminar** - Borrar cuestionario

#### Paginación
- Integrada en la tabla con `TablePagination`
- Opciones: 5, 10, 25, 50 filas por página
- Etiquetas en español
- Eliminada la paginación antigua con `Pagination` component

#### Código de Ejemplo

```typescript
<Paper elevation={2}>
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: 'background.secondary' }}>
          <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="center">Preguntas</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Asignado a</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Creado</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cuestionarios.map((cuestionario) => (
          <TableRow key={cuestionario.id} hover>
            {/* Celdas con datos */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>

  <TablePagination
    rowsPerPageOptions={[5, 10, 25, 50]}
    component="div"
    count={total}
    rowsPerPage={limit}
    page={page - 1}
    onPageChange={(_, newPage) => setPage(newPage + 1)}
    onRowsPerPageChange={(e) => {
      setFiltros(prev => ({ ...prev, limit: parseInt(e.target.value, 10) }));
      setPage(1);
    }}
    labelRowsPerPage="Filas por página:"
    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
  />
</Paper>
```

---

## 4. Patrón de Diseño Común

### Características Compartidas

1. **TableContainer con Paper**
   - Bordes y sombras consistentes
   - `variant="outlined"` para catálogos
   - `elevation={2}` para cuestionarios

2. **TableHead con fondo**
   - `backgroundColor: 'background.secondary'`
   - `fontWeight: 600` en todas las celdas

3. **TableRow con hover**
   - Efecto hover en todas las filas de datos
   - Mejora la experiencia de usuario

4. **Tooltips en acciones**
   - Todos los botones tienen tooltips descriptivos
   - Mejora la accesibilidad

5. **Estados vacíos**
   - Mensajes claros cuando no hay datos
   - Botones de acción sugeridos

6. **Responsive**
   - Las tablas se adaptan al ancho disponible
   - Scroll horizontal automático si es necesario

---

## 5. Ventajas de la Conversión

### Comparado con Grid/Card

| Aspecto | Grid/Card | Tabla |
|---------|-----------|-------|
| **Densidad de información** | Baja | Alta |
| **Comparación de datos** | Difícil | Fácil |
| **Espacio utilizado** | Mucho | Eficiente |
| **Escaneo visual** | Lento | Rápido |
| **Ordenamiento** | No nativo | Fácil de agregar |
| **Filtrado** | Requiere lógica extra | Integrado |
| **Paginación** | Separada | Integrada |
| **Accesibilidad** | Buena | Excelente |
| **Profesionalismo** | Casual | Formal |

### Beneficios Específicos

1. **Mejor UX para administradores**
   - Más información visible sin scroll
   - Comparación directa de elementos
   - Acciones más accesibles

2. **Consistencia visual**
   - Todas las vistas administrativas usan el mismo patrón
   - Curva de aprendizaje reducida

3. **Escalabilidad**
   - Funciona bien con 10 o 1000 registros
   - Paginación eficiente

4. **Mantenibilidad**
   - Código más simple y directo
   - Menos componentes anidados

---

## 6. Próximos Pasos Sugeridos

1. **Agregar ordenamiento**
   - Implementar `TableSortLabel` en columnas clave
   - Ordenar por título, fecha, estado, etc.

2. **Filtros avanzados**
   - Agregar filtros por columna
   - Búsqueda en múltiples campos

3. **Exportación**
   - Botón para exportar a CSV/Excel
   - Incluir filtros aplicados

4. **Acciones en lote**
   - Checkboxes para selección múltiple
   - Activar/desactivar/eliminar en lote

5. **Columnas configurables**
   - Permitir mostrar/ocultar columnas
   - Guardar preferencias del usuario

---

## 7. Notas Técnicas

### Imports Necesarios
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  TablePagination
} from '@mui/material';
```

### Estilos Comunes
```typescript
// Header de tabla
sx={{ backgroundColor: 'background.secondary' }}

// Celdas de header
sx={{ fontWeight: 600 }}

// Filas con hover
<TableRow hover>

// Texto truncado
sx={{
  maxWidth: 250,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}}
```

---

## 8. Testing Recomendado

- [ ] Verificar que todas las tablas se renderizan correctamente
- [ ] Probar paginación en cuestionarios
- [ ] Verificar tooltips en todas las acciones
- [ ] Probar con diferentes cantidades de datos (0, 1, 10, 100+)
- [ ] Verificar responsive en móvil y tablet
- [ ] Probar todas las acciones (editar, eliminar, activar, etc.)
- [ ] Verificar permisos (admin vs coordinador)
- [ ] Probar estados vacíos
- [ ] Verificar formato de fechas
- [ ] Probar chips de estado y categoría

---

**Implementado por:** Sistema SSP  
**Fecha:** 2025-11-06  
**Versión:** 1.0

