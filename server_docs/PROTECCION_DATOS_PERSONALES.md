# Protección de Datos Personales en Generación de Reportes IA

## 📋 Resumen

Se ha implementado protección de datos personales en el sistema de generación de reportes IA para asegurar que **NUNCA** se envíen datos personales sensibles al servicio de IA externo (OpenRouter).

## 🔒 Datos Protegidos

Los siguientes datos personales **NUNCA** se envían a la IA:

- ❌ Nombres completos
- ❌ Apellidos
- ❌ Correos electrónicos
- ❌ Teléfonos
- ❌ Direcciones
- ❌ Fechas de nacimiento
- ❌ Cualquier dato personal identificable

## ✅ Datos Permitidos

**SOLO** se envía información de identificación institucional:

- ✓ Matrícula del estudiante
- ✓ Número de empleado (para personal)

## 📝 Cambios Implementados

### 1. Schema de Datos (`cuestionario_admin.py`)

**Antes:**
```python
class PersonaInfoReporte(BaseModel):
    matricula: Optional[str] = None
    correo: Optional[str] = None
    nombre: Optional[str] = None
    otros: Dict[str, Any] = Field(default_factory=dict)
```

**Después:**
```python
class PersonaInfoReporte(BaseModel):
    """
    PROTECCIÓN DE DATOS PERSONALES:
    Solo se permite enviar identificador (matrícula o número de empleado).
    NO se permiten datos personales (nombres, correos, teléfonos, etc.)
    """
    matricula: Optional[str] = Field(None, description="Matrícula del estudiante (SOLO IDENTIFICADOR)")
    numero_empleado: Optional[str] = Field(None, description="Número de empleado (SOLO IDENTIFICADOR)")
```

### 2. Servicio de IA (`ai_service.py`)

**Cambios en `_create_prompt_from_questionnaire`:**
- ❌ Removido: edad, semestre, género, correo
- ✅ Solo se incluye: matrícula o número de empleado

**Antes:**
```python
estudiante_info = f"""
Información del estudiante:
- Edad: {persona_info.get('edad', 'No especificada')}
- Semestre: {persona_info.get('semestre', 'No especificado')}
- Género: {persona_info.get('genero', 'No especificado')}
- Matrícula: {persona_info.get('matricula', 'No especificada')}
"""
```

**Después:**
```python
# PROTECCIÓN DE DATOS: Solo enviamos matrícula o número de empleado
identificador = persona_info.get('matricula') or persona_info.get('numero_empleado')
if identificador:
    estudiante_info = f"""
Identificador del estudiante: {identificador}
"""
```

### 3. Endpoint de Generación de Reporte (`cuestionarios_usuario.py`)

**Cambios en construcción de `persona_info`:**

**Antes:**
```python
persona_info = {
    "matricula": ...,
    "correo": ...,  # ❌ Dato personal
}
if persona_info_request and persona_info_request.nombre:
    persona_info["nombre"] = ...  # ❌ Dato personal
if persona_info_request and persona_info_request.otros:
    persona_info.update(...)  # ❌ Datos personales adicionales
```

**Después:**
```python
# PROTECCIÓN DE DATOS: Solo enviar identificador (matrícula o número de empleado)
# NUNCA enviar datos personales (nombres, correos, teléfonos, etc.)
persona_info = {
    "matricula": persona_info_request.matricula if persona_info_request and persona_info_request.matricula else current_user.matricula,
}

# Si no tiene matrícula, intentar con número de empleado (para personal)
if not persona_info["matricula"]:
    persona_info["numero_empleado"] = current_user.numero_empleado if hasattr(current_user, 'numero_empleado') else None
```

## 🎯 Beneficios

1. **Cumplimiento Legal**: Cumple con leyes de protección de datos personales (GDPR, LFPDPPP en México)
2. **Privacidad**: Protege la identidad de los estudiantes y personal
3. **Seguridad**: Minimiza el riesgo de exposición de datos sensibles a terceros
4. **Trazabilidad**: Mantiene identificación institucional para seguimiento
5. **Confianza**: Demuestra responsabilidad en el manejo de datos

## 📊 Ejemplo de Prompt Enviado a IA

### Antes (❌ Inseguro):
```
Información del estudiante:
- Nombre: Juan Pérez López
- Edad: 20 años
- Semestre: 5
- Género: Masculino
- Matrícula: 2021030123
- Correo: juan.perez@universidad.edu.mx
```

### Después (✅ Seguro):
```
Identificador del estudiante: 2021030123
```

## 🔍 Archivos Modificados

1. [`API/app/schemas/cuestionario_admin.py`](API/app/schemas/cuestionario_admin.py)
   - Línea 320-328: Schema `PersonaInfoReporte`

2. [`API/app/services/ai_service.py`](API/app/services/ai_service.py)
   - Línea 170-189: Método `_create_prompt_from_questionnaire`
   - Línea 218-236: Método `_generate_mock_report`

3. [`API/app/routes/cuestionarios_usuario.py`](API/app/routes/cuestionarios_usuario.py)
   - Línea 770-780: Construcción de `persona_info`

## ✅ Verificación

Para verificar que los cambios funcionan correctamente:

1. Generar un nuevo reporte IA
2. Revisar los logs del servidor (verás el prompt completo enviado a IA)
3. Confirmar que solo aparece la matrícula/número de empleado
4. Confirmar que NO aparecen nombres, correos u otros datos personales

## 📚 Documentación Relacionada

- [Generación de Reportes IA](API/docs/GENERACION_REPORTES_IA.md)
- [Testing de Reportes](API/docs/TESTING_REPORTES_IA.md)
- [Protección de Respuestas](API/docs/PROTECCION_RESPUESTAS_USUARIOS.md)

---

**Fecha de implementación**: Noviembre 2025
**Prioridad**: CRÍTICA 🔴
**Status**: ✅ IMPLEMENTADO
