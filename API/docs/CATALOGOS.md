# Sistema de Catálogos Administrativos

Este documento describe el sistema de catálogos administrativos implementado para gestionar elementos de Religión, Grupo Étnico y Discapacidad.

## Características

### 1. Catálogos Disponibles
- **Religión**: Catálogo de religiones y creencias
- **Grupo Étnico**: Catálogo de grupos étnicos y etnias
- **Discapacidad**: Catálogo de tipos de discapacidades

### 2. Estructura de Base de Datos
Cada catálogo tiene la siguiente estructura:
- `id`: Clave primaria
- `titulo`: Nombre del elemento del catálogo
- `activo`: Boolean para activar/desactivar elementos
- `fecha_creacion`: Timestamp de creación
- `fecha_actualizacion`: Timestamp de última actualización

### 3. Funcionalidades

#### Para Administradores:
- ✅ Ver todos los elementos (activos e inactivos)
- ✅ Crear nuevos elementos
- ✅ Editar elementos existentes
- ✅ Activar/desactivar elementos
- ✅ Eliminar elementos
- ✅ Ver elementos pendientes de activación
- ✅ Activar múltiples elementos a la vez

#### Para Usuarios (Formularios):
- ✅ Ver solo elementos activos en selectores
- ✅ Opción "Otro" para agregar elementos personalizados
- ✅ Elementos personalizados se crean como inactivos (pendientes de revisión)

## Configuración e Instalación

### 1. Ejecutar Migraciones y Poblar Catálogos

```bash
# Desde el directorio API/
cd scripts/
python setup_catalogos.py
```

Este script:
- Crea las tablas necesarias en la base de datos
- Pobla los catálogos con datos iniciales
- Muestra estadísticas de elementos creados

### 2. Poblar Solo Datos (si las tablas ya existen)

```bash
# Desde el directorio API/scripts/
python seed_catalogos.py
```

## Endpoints API

### Religiones
- `GET /api/v1/catalogos/religiones/` - Listar religiones (admin)
- `GET /api/v1/catalogos/religiones/activas/` - Listar religiones activas (público)
- `POST /api/v1/catalogos/religiones/` - Crear religión (admin)
- `PUT /api/v1/catalogos/religiones/{id}` - Actualizar religión (admin)
- `DELETE /api/v1/catalogos/religiones/{id}` - Eliminar religión (admin)

### Grupos Étnicos
- `GET /api/v1/catalogos/grupos-etnicos/` - Listar grupos étnicos (admin)
- `GET /api/v1/catalogos/grupos-etnicos/activos/` - Listar grupos étnicos activos (público)
- `POST /api/v1/catalogos/grupos-etnicos/` - Crear grupo étnico (admin)
- `PUT /api/v1/catalogos/grupos-etnicos/{id}` - Actualizar grupo étnico (admin)
- `DELETE /api/v1/catalogos/grupos-etnicos/{id}` - Eliminar grupo étnico (admin)

### Discapacidades
- `GET /api/v1/catalogos/discapacidades/` - Listar discapacidades (admin)
- `GET /api/v1/catalogos/discapacidades/activas/` - Listar discapacidades activas (público)
- `POST /api/v1/catalogos/discapacidades/` - Crear discapacidad (admin)
- `PUT /api/v1/catalogos/discapacidades/{id}` - Actualizar discapacidad (admin)
- `DELETE /api/v1/catalogos/discapacidades/{id}` - Eliminar discapacidad (admin)

### Endpoints Especiales
- `GET /api/v1/catalogos/pendientes/` - Obtener elementos pendientes (admin)
- `POST /api/v1/catalogos/elemento-personalizado/` - Crear elemento personalizado (público)
- `POST /api/v1/catalogos/activar-multiples/` - Activar múltiples elementos (admin)

## Uso en Frontend

### 1. Componente CatalogoSelector

```tsx
import CatalogoSelector from './components/CatalogoSelector';

// Uso en formularios
<CatalogoSelector
  tipo="religion"
  label="Religión"
  value={formData.religion || ''}
  onChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}
  required={false}
  helperText="Seleccione su religión"
/>
```

### 2. Administración de Catálogos

```tsx
import CatalogosAdmin from './components/admin/CatalogosAdmin';

// Componente completo de administración
<CatalogosAdmin />
```

### 3. Notificaciones de Elementos Pendientes

```tsx
import NotificacionesPendientes from './components/admin/NotificacionesPendientes';

// En la barra de navegación del admin
<NotificacionesPendientes 
  onNavigateToCatalogos={() => navigate('/admin/catalogos')}
/>
```

## Flujo de Trabajo

### 1. Usuario Completa Formulario
1. Usuario selecciona de opciones disponibles o elige "Otro"
2. Si elige "Otro", aparece campo de texto para especificar
3. El texto personalizado se almacena temporalmente en el formulario
4. **IMPORTANTE:** Los elementos personalizados solo se procesan DESPUÉS del envío exitoso del formulario completo

### 2. Procesamiento de Elementos Personalizados
1. Después del envío exitoso del formulario, el sistema procesa elementos personalizados
2. Validación case-insensitive: "Católica" = "católica" = "CATÓLICA" = "  católica  "
3. Si el elemento ya existe (activo o inactivo), NO se crea duplicado
4. Solo se crean elementos pendientes para valores únicos que no existan
5. Elementos creados quedan con `activo=false` para revisión

### 3. Administrador Revisa Elementos
1. Administrador ve notificación de elementos pendientes
2. Puede activar elementos individualmente o en lote
3. Elementos activados aparecen disponibles para futuros usuarios

### 4. Gestión Continua
1. Administrador puede crear, editar y gestionar elementos
2. Puede desactivar elementos obsoletos sin eliminarlos
3. Sistema mantiene historial de cambios con timestamps

## Datos Iniciales Incluidos

### Religiones (20 elementos)
- Católica, Protestante, Evangélica, Cristiana
- Judaísmo, Islam, Budismo, Hinduismo
- Testigos de Jehová, Mormón, Adventista
- Agnóstico, Ateo, Sin religión, etc.

### Grupos Étnicos (28 elementos)
- Mestizo, Indígena, Blanco, Afromexicano
- Maya, Náhuatl, Zapoteco, Mixteco
- Otomí, Totonaco, Mazahua, Huichol
- Tarahumara, Yaqui, Mayo, etc.

### Discapacidades (30 elementos)
- Ninguna, Visual, Auditiva, Motriz
- Intelectual, Psicosocial, Múltiple
- Autismo, Síndrome de Down, Parálisis cerebral
- TDAH, Dislexia, Epilepsia, etc.

## Consideraciones de Seguridad

- ✅ Endpoints de administración requieren rol de administrador
- ✅ Endpoints públicos solo muestran elementos activos
- ✅ Validación de datos en backend y frontend
- ✅ Elementos personalizados requieren revisión antes de activación
- ✅ Validación case-insensitive para prevenir duplicados
- ✅ Elementos personalizados solo se crean después del envío exitoso del formulario

## Mantenimiento

### Respaldos
- Los catálogos son parte de la base de datos principal
- Incluir en respaldos regulares de la base de datos

### Monitoreo
- Revisar elementos pendientes regularmente
- Monitorear uso de opción "Otro" para identificar elementos faltantes
- Actualizar catálogos según necesidades institucionales
