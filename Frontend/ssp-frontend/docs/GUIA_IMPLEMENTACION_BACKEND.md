# Guía de Implementación Backend - Sistema de Cuestionarios

## Descripción General

Esta guía detalla los pasos necesarios para implementar el backend que soporte el sistema de cuestionarios administrativos ya desarrollado en el frontend. El backend debe proporcionar las APIs REST necesarias para todas las funcionalidades implementadas.

## Estructura de Base de Datos Requerida

### Tabla: cuestionarios_admin

```sql
CREATE TABLE cuestionarios_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP NULL,
    fecha_fin TIMESTAMP NULL,
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('activo', 'inactivo', 'borrador')),
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: preguntas

```sql
CREATE TABLE preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuestionario_id UUID NOT NULL REFERENCES cuestionarios_admin(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('abierta', 'opcion_multiple', 'verdadero_falso', 'select', 'checkbox', 'radio_button', 'escala_likert')),
    texto TEXT NOT NULL,
    descripcion TEXT,
    obligatoria BOOLEAN DEFAULT FALSE,
    orden INTEGER NOT NULL,
    configuracion JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuestionario_id, orden)
);
```

### Tabla: cuestionario_asignaciones

```sql
CREATE TABLE cuestionario_asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuestionario_id UUID NOT NULL REFERENCES cuestionarios_admin(id) ON DELETE CASCADE,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('alumno', 'docente', 'personal')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuestionario_id, tipo_usuario)
);
```

### Tabla: respuestas_cuestionario

```sql
CREATE TABLE respuestas_cuestionario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuestionario_id UUID NOT NULL REFERENCES cuestionarios_admin(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completado')),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuestionario_id, usuario_id)
);
```

### Tabla: respuestas_pregunta

```sql
CREATE TABLE respuestas_pregunta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    respuesta_cuestionario_id UUID NOT NULL REFERENCES respuestas_cuestionario(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES preguntas(id),
    valor JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(respuesta_cuestionario_id, pregunta_id)
);
```

## Endpoints de API Requeridos

### Administración de Cuestionarios

#### GET /api/admin/cuestionarios
```python
@router.get("/cuestionarios")
async def get_cuestionarios(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    buscar: Optional[str] = None,
    tipo_usuario: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Obtener lista de cuestionarios con filtros y paginación
    """
    pass
```

#### POST /api/admin/cuestionarios
```python
@router.post("/cuestionarios")
async def crear_cuestionario(
    cuestionario: CuestionarioCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Crear nuevo cuestionario
    """
    pass
```

#### GET /api/admin/cuestionarios/{id}
```python
@router.get("/cuestionarios/{cuestionario_id}")
async def get_cuestionario(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Obtener cuestionario específico con preguntas
    """
    pass
```

#### PUT /api/admin/cuestionarios/{id}
```python
@router.put("/cuestionarios/{cuestionario_id}")
async def actualizar_cuestionario(
    cuestionario_id: UUID,
    cuestionario: CuestionarioUpdate,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Actualizar cuestionario existente
    """
    pass
```

#### DELETE /api/admin/cuestionarios/{id}
```python
@router.delete("/cuestionarios/{cuestionario_id}")
async def eliminar_cuestionario(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Eliminar cuestionario (soft delete recomendado)
    """
    pass
```

#### POST /api/admin/cuestionarios/{id}/duplicar
```python
@router.post("/cuestionarios/{cuestionario_id}/duplicar")
async def duplicar_cuestionario(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Duplicar cuestionario existente
    """
    pass
```

#### PATCH /api/admin/cuestionarios/{id}/estado
```python
@router.patch("/cuestionarios/{cuestionario_id}/estado")
async def cambiar_estado_cuestionario(
    cuestionario_id: UUID,
    nuevo_estado: EstadoUpdate,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Cambiar estado del cuestionario
    """
    pass
```

#### GET /api/admin/cuestionarios/{id}/estadisticas
```python
@router.get("/cuestionarios/{cuestionario_id}/estadisticas")
async def get_estadisticas_cuestionario(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Obtener estadísticas de respuestas del cuestionario
    """
    pass
```

### APIs para Usuarios Finales

#### GET /api/usuario/cuestionarios
```python
@router.get("/cuestionarios")
async def get_cuestionarios_asignados(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener cuestionarios asignados al usuario según su rol
    """
    pass
```

#### GET /api/usuario/cuestionarios/{id}
```python
@router.get("/cuestionarios/{cuestionario_id}")
async def get_cuestionario_para_responder(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener cuestionario específico para responder
    """
    pass
```

#### GET /api/usuario/cuestionarios/{id}/respuestas
```python
@router.get("/cuestionarios/{cuestionario_id}/respuestas")
async def get_respuestas_guardadas(
    cuestionario_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener respuestas guardadas del usuario
    """
    pass
```

#### POST /api/usuario/cuestionarios/{id}/respuestas
```python
@router.post("/cuestionarios/{cuestionario_id}/respuestas")
async def guardar_respuestas(
    cuestionario_id: UUID,
    respuestas: List[RespuestaPregunta],
    current_user: User = Depends(get_current_user)
):
    """
    Guardar progreso de respuestas (sin completar)
    """
    pass
```

#### POST /api/usuario/cuestionarios/{id}/completar
```python
@router.post("/cuestionarios/{cuestionario_id}/completar")
async def completar_cuestionario(
    cuestionario_id: UUID,
    respuestas: List[RespuestaPregunta],
    current_user: User = Depends(get_current_user)
):
    """
    Completar cuestionario con todas las respuestas
    """
    pass
```

## Modelos Pydantic Requeridos

### Modelos Base

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID

class TipoPregunta(str, Enum):
    ABIERTA = "abierta"
    OPCION_MULTIPLE = "opcion_multiple"
    VERDADERO_FALSO = "verdadero_falso"
    SELECT = "select"
    CHECKBOX = "checkbox"
    RADIO_BUTTON = "radio_button"
    ESCALA_LIKERT = "escala_likert"

class EstadoCuestionario(str, Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    BORRADOR = "borrador"

class TipoUsuario(str, Enum):
    ALUMNO = "alumno"
    DOCENTE = "docente"
    PERSONAL = "personal"

class PreguntaBase(BaseModel):
    tipo: TipoPregunta
    texto: str = Field(..., max_length=500)
    descripcion: Optional[str] = None
    obligatoria: bool = False
    orden: int = Field(..., ge=1)
    configuracion: Dict[str, Any] = {}

class PreguntaCreate(PreguntaBase):
    pass

class PreguntaUpdate(PreguntaBase):
    pass

class Pregunta(PreguntaBase):
    id: UUID
    cuestionario_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CuestionarioBase(BaseModel):
    titulo: str = Field(..., max_length=100)
    descripcion: str = Field(..., max_length=500)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: EstadoCuestionario = EstadoCuestionario.BORRADOR

class CuestionarioCreate(CuestionarioBase):
    preguntas: List[PreguntaCreate] = []
    tipos_usuario_asignados: List[TipoUsuario] = []

class CuestionarioUpdate(CuestionarioBase):
    preguntas: Optional[List[PreguntaUpdate]] = None
    tipos_usuario_asignados: Optional[List[TipoUsuario]] = None

class CuestionarioAdmin(CuestionarioBase):
    id: UUID
    fecha_creacion: datetime
    creado_por: UUID
    preguntas: List[Pregunta] = []
    tipos_usuario_asignados: List[TipoUsuario] = []
    total_preguntas: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### Modelos de Respuestas

```python
class RespuestaPregunta(BaseModel):
    pregunta_id: UUID
    valor: Any  # JSON que puede ser string, number, array, etc.

class RespuestaCuestionarioBase(BaseModel):
    estado: str = "pendiente"
    progreso: int = Field(0, ge=0, le=100)

class RespuestaCuestionarioCreate(RespuestaCuestionarioBase):
    respuestas: List[RespuestaPregunta] = []

class RespuestaCuestionario(RespuestaCuestionarioBase):
    id: UUID
    cuestionario_id: UUID
    usuario_id: UUID
    fecha_inicio: datetime
    fecha_completado: Optional[datetime] = None
    respuestas: List[RespuestaPregunta] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

## Validaciones Backend Requeridas

### Validaciones de Cuestionario
```python
def validar_cuestionario(cuestionario: CuestionarioCreate) -> None:
    # Validar fechas
    if cuestionario.fecha_inicio and cuestionario.fecha_fin:
        if cuestionario.fecha_inicio >= cuestionario.fecha_fin:
            raise ValueError("La fecha de inicio debe ser anterior a la fecha de fin")
    
    # Validar preguntas
    if len(cuestionario.preguntas) == 0:
        raise ValueError("Debe tener al menos una pregunta")
    
    if len(cuestionario.preguntas) > 50:
        raise ValueError("No puede exceder 50 preguntas")
    
    # Validar órdenes únicos
    ordenes = [p.orden for p in cuestionario.preguntas]
    if len(ordenes) != len(set(ordenes)):
        raise ValueError("Los órdenes de las preguntas deben ser únicos")
    
    # Validar tipos de usuario
    if len(cuestionario.tipos_usuario_asignados) == 0:
        raise ValueError("Debe asignar a al menos un tipo de usuario")
```

### Validaciones de Pregunta
```python
def validar_pregunta(pregunta: PreguntaCreate) -> None:
    # Validaciones específicas por tipo
    if pregunta.tipo in ['opcion_multiple', 'select', 'checkbox', 'radio_button']:
        opciones = pregunta.configuracion.get('opciones', [])
        if len(opciones) < 2:
            raise ValueError("Debe tener al menos 2 opciones")
        if len(opciones) > 10:
            raise ValueError("No puede tener más de 10 opciones")
    
    if pregunta.tipo == 'escala_likert':
        puntos = pregunta.configuracion.get('puntos_escala', 5)
        if puntos < 3 or puntos > 10:
            raise ValueError("La escala debe tener entre 3 y 10 puntos")
```

## Lógica de Negocio Importante

### Asignación de Cuestionarios
```python
async def get_cuestionarios_para_usuario(usuario: User) -> List[CuestionarioAdmin]:
    """
    Obtener cuestionarios asignados según el rol del usuario
    """
    tipo_usuario = mapear_rol_a_tipo_usuario(usuario.rol)
    
    query = select(CuestionarioAdmin).join(CuestionarioAsignacion).where(
        and_(
            CuestionarioAsignacion.tipo_usuario == tipo_usuario,
            CuestionarioAdmin.estado == 'activo',
            or_(
                CuestionarioAdmin.fecha_inicio.is_(None),
                CuestionarioAdmin.fecha_inicio <= datetime.now()
            ),
            or_(
                CuestionarioAdmin.fecha_fin.is_(None),
                CuestionarioAdmin.fecha_fin >= datetime.now()
            )
        )
    )
    
    return await db.execute(query)
```

### Cálculo de Progreso
```python
def calcular_progreso(respuestas: List[RespuestaPregunta], total_preguntas: int) -> int:
    """
    Calcular porcentaje de progreso basado en preguntas respondidas
    """
    if total_preguntas == 0:
        return 100
    
    preguntas_respondidas = len([r for r in respuestas if r.valor is not None])
    return min(100, int((preguntas_respondidas / total_preguntas) * 100))
```

### Validación de Respuestas
```python
def validar_respuesta(pregunta: Pregunta, valor: Any) -> bool:
    """
    Validar que la respuesta sea válida según el tipo de pregunta
    """
    if pregunta.obligatoria and (valor is None or valor == ""):
        return False
    
    if pregunta.tipo == 'checkbox':
        if not isinstance(valor, list):
            return False
        min_sel = pregunta.configuracion.get('minimo_selecciones', 0)
        max_sel = pregunta.configuracion.get('maximo_selecciones', len(valor))
        return min_sel <= len(valor) <= max_sel
    
    # Más validaciones según tipo...
    return True
```

## Consideraciones de Seguridad

### Autorización
- Verificar que el usuario tenga permisos para acceder al cuestionario
- Validar que el cuestionario esté asignado al tipo de usuario correcto
- Prevenir acceso a cuestionarios inactivos o fuera de fecha

### Validación de Datos
- Sanitizar todas las entradas de usuario
- Validar tipos de datos en respuestas JSON
- Prevenir inyección de código en configuraciones

### Rate Limiting
- Limitar frecuencia de guardado de respuestas
- Prevenir spam en creación de cuestionarios
- Timeout en operaciones largas

## Testing Recomendado

### Tests Unitarios
- Validaciones de modelos Pydantic
- Lógica de cálculo de progreso
- Funciones de validación de respuestas

### Tests de Integración
- Endpoints de API completos
- Flujo completo de creación y respuesta
- Permisos y autorización

### Tests de Performance
- Carga de cuestionarios con muchas preguntas
- Respuestas simultáneas de múltiples usuarios
- Consultas complejas con filtros

---

**Nota:** Esta guía asume el uso de FastAPI con SQLAlchemy y PostgreSQL. Adaptar según el stack tecnológico específico del proyecto.
