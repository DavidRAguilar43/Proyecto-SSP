"""
Servicio de IA para generar reportes psicopedagógicos usando OpenRouter.
"""

from typing import Dict, Any, Optional, List
from openai import OpenAI
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Zona horaria de México
MEXICO_TZ = ZoneInfo("America/Mexico_City")

class AIReportService:
    """Servicio para generar reportes psicopedagógicos usando OpenRouter."""

    def __init__(self):
        """Inicializar el servicio de IA con OpenRouter."""
        # Obtener la API key de OpenRouter desde configuración centralizada
        self.api_key = settings.OPENROUTER_API_KEY
        self.site_url = settings.SITE_URL
        self.site_name = settings.SITE_NAME
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL

        if not self.api_key:
            logger.warning(
                "OPENROUTER_API_KEY no configurada. Usando modo simulado. "
                "Configura OPENROUTER_API_KEY en el archivo .env para usar la API real."
            )
            self.client = None
        else:
            self.client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key
            )
            logger.info(f"Cliente OpenRouter inicializado. Modelo: {self.model}")
    
    def generate_questionnaire_report(
        self,
        preguntas_respuestas: List[Dict[str, Any]],
        instruccion_sistema: Optional[str] = None,
        persona_info: Optional[Dict[str, Any]] = None,
        modelo_ia: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generar un reporte basado en preguntas y respuestas del cuestionario.

        Args:
            preguntas_respuestas: Lista de dicts con 'pregunta' y 'respuesta'
            instruccion_sistema: Instrucción personalizada para la IA
            persona_info: Información adicional del estudiante (opcional)
            modelo_ia: Modelo de IA a utilizar (opcional, usa el configurado por defecto si no se especifica)
            max_tokens: Número máximo de tokens para la respuesta (opcional, por defecto 4000)
            temperature: Temperatura de la IA 0.0-1.0 (opcional, por defecto 0.7)

        Returns:
            str: Reporte generado por IA
        """
        try:
            if not self.client:
                # Modo simulado si no hay API key
                return self._generate_mock_report(preguntas_respuestas, persona_info)

            # Crear el prompt para la IA
            prompt = self._create_prompt_from_questionnaire(preguntas_respuestas, persona_info)

            # Usar instrucción personalizada o usar una por defecto
            system_instruction = instruccion_sistema or self._get_default_system_instruction()

            # Usar modelo especificado o el configurado por defecto
            model_to_use = modelo_ia or self.model

            # Configurar parámetros de generación
            max_tokens_to_use = max_tokens if max_tokens is not None else 4000
            temperature_to_use = temperature if temperature is not None else 0.7

            # Logs de debugging
            logger.info(f"🤖 Generando reporte con modelo: {model_to_use}")
            logger.info(f"📋 Instrucción del sistema COMPLETA: {system_instruction}")
            logger.info(f"📝 Prompt del usuario (primeros 500 chars): {prompt[:500]}...")
            logger.info(f"⚙️ Parámetros: max_tokens={max_tokens_to_use}, temperature={temperature_to_use}")

            # Preparar mensajes
            messages_payload = [
                {
                    "role": "system",
                    "content": system_instruction
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]

            logger.info(f"📤 Payload completo de mensajes: {messages_payload}")

            # Preparar parámetros de la llamada
            api_params = {
                "model": model_to_use,
                "messages": messages_payload,
                "max_tokens": max_tokens_to_use,
                "temperature": temperature_to_use,
                "extra_headers": {
                    "HTTP-Referer": self.site_url,
                    "X-Title": self.site_name,
                }
            }

            # Llamar a la API de OpenRouter
            response = self.client.chat.completions.create(**api_params)

            logger.info(f"✅ Respuesta recibida de OpenRouter (primeros 500 chars): {response.choices[0].message.content[:500]}...")

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Error generando reporte con IA: {e}")
            return self._generate_mock_report(preguntas_respuestas, persona_info)

    def _get_default_system_instruction(self) -> str:
        """Obtener la instrucción de sistema por defecto."""
        return """Eres un psicólogo educativo especializado en análisis psicopedagógico universitario.

Tu tarea es analizar las respuestas de un cuestionario psicopedagógico y generar un reporte profesional,
detallado y estructurado que incluya:

1. **RESUMEN EJECUTIVO**: Breve síntesis del perfil del estudiante (2-3 párrafos)

2. **ANÁLISIS DETALLADO POR ÁREAS**:
   - Situación académica actual
   - Factores socioeconómicos y familiares
   - Estado emocional y psicológico
   - Hábitos de estudio y organización
   - Relaciones interpersonales y apoyo social
   - Salud física y bienestar general

3. **FORTALEZAS IDENTIFICADAS**: Recursos personales, familiares y académicos del estudiante

4. **ÁREAS DE OPORTUNIDAD Y FACTORES DE RIESGO**:
   - Identificar vulnerabilidades
   - Señalar situaciones que requieren atención prioritaria
   - Clasificar por nivel de urgencia (alta, media, baja)

5. **RECOMENDACIONES ESPECÍFICAS**:
   - Intervenciones sugeridas (individual, grupal, familiar)
   - Derivaciones a servicios especializados si es necesario
   - Estrategias de apoyo académico
   - Recursos institucionales disponibles

6. **PLAN DE SEGUIMIENTO**: Sugerencias de frecuencia y tipo de seguimiento recomendado

IMPORTANTE:
- Usa un lenguaje profesional pero accesible
- Sé empático y constructivo, evita juicios
- Fundamenta tus observaciones en las respuestas proporcionadas
- Si detectas señales de riesgo grave (ideación suicida, violencia, etc.), márcalo claramente como URGENTE
- Estructura el reporte con títulos y subtítulos claros
- Usa viñetas y listas cuando sea apropiado para mejor legibilidad"""
    
    def _create_prompt_from_questionnaire(
        self,
        preguntas_respuestas: List[Dict[str, Any]],
        persona_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Crear el prompt para la IA basado en preguntas y respuestas del cuestionario.

        PROTECCIÓN DE DATOS:
        - Se envían: edad, género, semestre (datos demográficos útiles)
        - NO se envían: nombres, apellidos, correos, teléfonos, direcciones
        - Matrícula: comentada temporalmente para pruebas
        """

        # Información del estudiante (DATOS DEMOGRÁFICOS - NO IDENTIFICADORES PERSONALES)
        estudiante_info = ""
        if persona_info:
            info_parts = []

            # COMENTADO TEMPORALMENTE PARA PRUEBAS
            # identificador = persona_info.get('matricula') or persona_info.get('numero_empleado')
            # if identificador:
            #     info_parts.append(f"Identificador: {identificador}")

            # Datos demográficos útiles para el análisis
            if persona_info.get('edad'):
                info_parts.append(f"Edad: {persona_info.get('edad')} años")

            if persona_info.get('genero'):
                info_parts.append(f"Género: {persona_info.get('genero')}")

            if persona_info.get('semestre'):
                info_parts.append(f"Semestre: {persona_info.get('semestre')}")

            if info_parts:
                estudiante_info = f"""
Información del estudiante:
{chr(10).join(f"- {part}" for part in info_parts)}
"""

        # Formatear las preguntas y respuestas
        preguntas_respuestas_texto = ""
        for idx, item in enumerate(preguntas_respuestas, 1):
            pregunta = item.get('pregunta', 'Pregunta sin texto')
            respuesta = item.get('respuesta', 'Sin respuesta')
            preguntas_respuestas_texto += f"{idx}. **{pregunta}**\n   Respuesta: {respuesta}\n\n"

        prompt = f"""
A continuación se presenta la información recopilada de un estudiante universitario a través de un cuestionario psicopedagógico:

{estudiante_info}

RESPUESTAS DEL CUESTIONARIO PSICOPEDAGÓGICO:
{preguntas_respuestas_texto}

INSTRUCCIONES:
Analiza cuidadosamente todas las respuestas proporcionadas y genera un reporte psicopedagógico completo siguiendo
la estructura solicitada. Asegúrate de:
- Citar respuestas específicas cuando fundamentes tus observaciones
- Identificar patrones y conexiones entre diferentes respuestas
- Ser específico en las recomendaciones (evita generalidades)
- Priorizar las intervenciones según urgencia y viabilidad
- Mantener un tono profesional, empático y orientado a soluciones
"""

        return prompt
    
    def _generate_mock_report(
        self,
        preguntas_respuestas: List[Dict[str, Any]],
        persona_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generar un reporte simulado cuando no hay API key de OpenRouter.

        PROTECCIÓN DE DATOS: Solo usa datos demográficos, no identificadores personales.
        """

        estudiante_info = ""
        if persona_info:
            info_parts = []

            if persona_info.get('edad'):
                info_parts.append(f"{persona_info.get('edad')} años")

            if persona_info.get('semestre'):
                info_parts.append(f"semestre {persona_info.get('semestre')}")

            if info_parts:
                estudiante_info = f"Estudiante de {', '.join(info_parts)}"

        # Contar respuestas
        total_respuestas = len(preguntas_respuestas)

        return f"""# REPORTE PSICOPEDAGÓGICO - MODO SIMULADO

{estudiante_info}

## 1. ANÁLISIS GENERAL
Se han analizado {total_respuestas} respuestas del cuestionario psicopedagógico. Las respuestas indican un perfil estudiantil que requiere atención personalizada.

## 2. FORTALEZAS IDENTIFICADAS
- Disposición para participar en el proceso de evaluación
- Capacidad de autorreflexión sobre su situación académica
- Interés en mejorar su desempeño estudiantil

## 3. ÁREAS DE OPORTUNIDAD
- Desarrollo de estrategias de estudio más efectivas
- Fortalecimiento de la gestión del tiempo
- Mejora en las habilidades de comunicación académica

## 4. RECOMENDACIONES
- Implementar técnicas de estudio personalizadas
- Establecer rutinas de estudio estructuradas
- Buscar apoyo en áreas específicas de dificultad
- Participar en talleres de habilidades de estudio

## 5. SEGUIMIENTO
- Se recomienda seguimiento mensual con el personal psicopedagógico
- Evaluación de progreso en 3 meses
- Considerar apoyo adicional si es necesario

**Nota:** Este es un reporte generado en modo simulado. Para reportes completos con IA, configure la API key de OpenRouter.

**Fecha de generación:** {self._get_current_date()}
"""
    
    def _get_current_date(self) -> str:
        """Obtener la fecha actual formateada."""
        return datetime.now(MEXICO_TZ).strftime("%d/%m/%Y %H:%M")


# Instancia global del servicio
ai_service = AIReportService()
