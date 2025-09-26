# Sistema de Gestión de Cuestionarios Administrativos

## Descripción General

El Sistema de Gestión de Cuestionarios Administrativos es una solución completa que permite a los administradores crear, gestionar y asignar cuestionarios personalizados a diferentes tipos de usuarios (Alumnos, Docentes, Personal). El sistema está integrado con la arquitectura existente del proyecto SSP y proporciona una interfaz intuitiva tanto para administradores como para usuarios finales.

## Características Principales

### Para Administradores
- **CRUD Completo**: Crear, editar, eliminar y duplicar cuestionarios
- **Constructor de Preguntas**: Interfaz drag-and-drop para crear preguntas de diferentes tipos
- **Sistema de Asignación**: Asignar cuestionarios a tipos específicos de usuarios
- **Vista Previa**: Previsualizar cuestionarios antes de publicarlos
- **Gestión de Estados**: Controlar el estado de los cuestionarios (activo, inactivo, borrador)
- **Estadísticas**: Ver métricas de respuestas y completitud

### Para Usuarios Finales
- **Dashboard Personalizado**: Ver cuestionarios asignados según el rol
- **Interfaz de Respuesta**: Responder cuestionarios con diferentes tipos de preguntas
- **Guardado Automático**: Guardar progreso y continuar después
- **Historial**: Ver cuestionarios completados y respuestas

## Tipos de Preguntas Soportadas

### 1. Pregunta Abierta
- Campo de texto libre (textarea)
- Límite de caracteres configurable
- Validación de longitud mínima/máxima

### 2. Opción Múltiple
- Mínimo 2 opciones, máximo 10
- Selección única o múltiple
- Opción "Otro" con campo de texto

### 3. Verdadero/Falso
- Dos opciones fijas: Verdadero/Falso
- Sin configuraciones adicionales

### 4. Select (Desplegable)
- Lista desplegable con opciones predefinidas
- Mínimo 2 opciones, máximo 15
- Opción por defecto configurable

### 5. Checkbox
- Casillas de verificación para selección múltiple
- Mínimo/máximo de selecciones configurable

### 6. Radio Button
- Botones de opción para selección única obligatoria
- Mínimo 2 opciones, máximo 8

### 7. Escala de Likert
- Escala numérica configurable (3-10 puntos)
- Etiquetas personalizables para extremos
- Visualización horizontal con números

## Arquitectura del Sistema

### Estructura de Componentes

```
src/
├── components/cuestionarios/
│   ├── TipoPreguntaSelector.tsx      # Selector de tipos de pregunta
│   ├── ConfiguracionPregunta.tsx     # Configuración específica por tipo
│   ├── PreguntaBuilder.tsx           # Constructor individual de preguntas
│   ├── VistaPreviaPregunta.tsx       # Vista previa de preguntas
│   ├── CuestionarioForm.tsx          # Formulario principal
│   ├── AsignacionUsuarios.tsx        # Selector de tipos de usuario
│   └── VistaPreviaModal.tsx          # Modal de vista previa completa
├── pages/admin/
│   ├── CuestionariosPage.tsx         # Listado de cuestionarios
│   ├── CrearCuestionarioPage.tsx     # Crear nuevo cuestionario
│   └── EditarCuestionarioPage.tsx    # Editar cuestionario existente
├── pages/usuario/
│   ├── CuestionariosAsignadosPage.tsx # Cuestionarios del usuario
│   └── ResponderCuestionarioPage.tsx  # Interfaz para responder
├── types/
│   └── cuestionarios.ts              # Tipos TypeScript
├── utils/
│   ├── validacionesCuestionarios.ts  # Utilidades de validación
│   └── errorHandling.ts              # Manejo de errores
└── services/
    └── api.ts                        # Servicios API (actualizado)
```

### Tipos TypeScript Principales

```typescript
interface CuestionarioAdmin {
  id: string;
  titulo: string;
  descripcion: string;
  preguntas: Pregunta[];
  tipos_usuario_asignados: TipoUsuario[];
  fecha_creacion: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: EstadoCuestionario;
  creado_por: string;
  total_preguntas: number;
}

interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  texto: string;
  descripcion?: string;
  obligatoria: boolean;
  orden: number;
  configuracion: ConfiguracionPregunta;
}
```

## Integración con el Sistema Existente

### Rutas Agregadas

**Administración:**
- `/admin/cuestionarios` - Listado de cuestionarios
- `/admin/cuestionarios/crear` - Crear nuevo cuestionario
- `/admin/cuestionarios/editar/:id` - Editar cuestionario

**Usuarios:**
- `/usuario/cuestionarios` - Cuestionarios asignados
- `/usuario/cuestionarios/responder/:id` - Responder cuestionario

### Permisos por Rol

- **Admin/Coordinador**: Acceso completo a gestión de cuestionarios
- **Alumno/Docente/Personal**: Solo acceso a cuestionarios asignados

### Servicios API

```typescript
// Administración
cuestionariosAdminApi.getAll(filtros)
cuestionariosAdminApi.create(data)
cuestionariosAdminApi.update(id, data)
cuestionariosAdminApi.delete(id)

// Usuarios
cuestionariosUsuarioApi.getCuestionariosAsignados()
cuestionariosUsuarioApi.completarCuestionario(id, respuestas)
```

## Validaciones Implementadas

### Validaciones de Cuestionario
- Título obligatorio (máx. 100 caracteres)
- Descripción obligatoria (máx. 500 caracteres)
- Mínimo 1 pregunta, máximo 50
- Al menos un tipo de usuario asignado
- Fechas de inicio/fin coherentes

### Validaciones de Preguntas
- Texto obligatorio por pregunta
- Mínimo 2 opciones para preguntas de selección
- Opciones no vacías ni duplicadas
- Configuración válida según el tipo

### Validaciones de Respuestas
- Preguntas obligatorias completadas
- Formato correcto según tipo de pregunta
- Límites de selección respetados

## Manejo de Errores

### Errores de API
- Procesamiento automático de códigos HTTP
- Mensajes amigables para el usuario
- Logging para debugging en desarrollo

### Errores de Validación
- Validación en tiempo real
- Mensajes específicos por campo
- Prevención de envío con errores

### Recuperación de Errores
- Retry automático para operaciones recuperables
- Timeout para operaciones que se cuelgan
- Guardado automático de progreso

## Flujo de Usuario

### Administrador
1. Accede a "Gestión de Cuestionarios" desde el dashboard
2. Ve listado con filtros y estadísticas
3. Crea nuevo cuestionario con el constructor
4. Configura preguntas y asignación de usuarios
5. Previsualiza antes de publicar
6. Gestiona estados y ve estadísticas

### Usuario Final
1. Ve "Mis Cuestionarios" en su dashboard
2. Accede a cuestionarios asignados por estado
3. Inicia o continúa cuestionarios
4. Responde con guardado automático
5. Completa y ve historial

## Características Técnicas

### Performance
- Carga lazy de componentes pesados
- Paginación en listados
- Debounce en búsquedas
- Optimización de re-renders

### Accesibilidad
- Cumple estándares WCAG 2.1 AA
- Navegación por teclado
- Lectores de pantalla compatibles
- Contraste adecuado

### Responsive Design
- Compatible con móviles y tablets
- Breakpoints optimizados
- Touch-friendly en dispositivos móviles

### Seguridad
- Validación tanto frontend como backend
- Sanitización de inputs
- Control de permisos por rol
- Rate limiting en API

## Próximas Mejoras

### Funcionalidades Planeadas
- Exportación de respuestas a Excel/PDF
- Plantillas de cuestionarios predefinidas
- Sistema de notificaciones automáticas
- Análisis avanzado de respuestas
- Cuestionarios con lógica condicional

### Optimizaciones Técnicas
- Cache de cuestionarios frecuentes
- Compresión de respuestas grandes
- Modo offline básico
- Tests automatizados completos

## Soporte y Mantenimiento

### Logs y Monitoreo
- Errores registrados en consola (desarrollo)
- Métricas de uso por tipo de pregunta
- Tiempo de completitud promedio

### Debugging
- Herramientas de validación incluidas
- Mensajes de error detallados
- Trazabilidad de operaciones

### Actualizaciones
- Versionado de tipos de pregunta
- Migración automática de datos
- Compatibilidad hacia atrás

---

**Versión:** 1.0.0  
**Fecha:** Enero 2025  
**Autor:** Sistema SSP - Módulo de Cuestionarios
