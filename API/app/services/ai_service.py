"""
Servicio de IA para generar reportes psicopedagógicos.
"""

import os
from typing import Dict, Any, Optional
from openai import OpenAI
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIReportService:
    """Servicio para generar reportes psicopedagógicos usando IA."""
    
    def __init__(self):
        """Inicializar el servicio de IA."""
        # Obtener la API key de OpenAI desde variables de entorno
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY no encontrada. Usando modo simulado.")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
    
    def generate_psychopedagogical_report(
        self, 
        respuestas: Dict[str, Any], 
        persona_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generar un reporte psicopedagógico basado en las respuestas del cuestionario.
        
        Args:
            respuestas: Diccionario con las respuestas del estudiante
            persona_info: Información adicional del estudiante (opcional)
            
        Returns:
            str: Reporte psicopedagógico generado por IA
        """
        try:
            if not self.client:
                # Modo simulado si no hay API key
                return self._generate_mock_report(respuestas, persona_info)
            
            # Crear el prompt para la IA
            prompt = self._create_prompt(respuestas, persona_info)
            
            # Llamar a la API de OpenAI
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """Eres un psicólogo educativo experto en evaluación psicopedagógica. 
                        Tu tarea es analizar las respuestas de un cuestionario y generar un reporte 
                        profesional que incluya:
                        1. Análisis de las respuestas
                        2. Identificación de fortalezas y áreas de oportunidad
                        3. Recomendaciones específicas
                        4. Sugerencias de seguimiento
                        
                        El reporte debe ser profesional, empático y constructivo."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generando reporte con IA: {e}")
            return self._generate_mock_report(respuestas, persona_info)
    
    def _create_prompt(self, respuestas: Dict[str, Any], persona_info: Optional[Dict[str, Any]] = None) -> str:
        """Crear el prompt para la IA basado en las respuestas."""
        
        # Información del estudiante (si está disponible)
        estudiante_info = ""
        if persona_info:
            estudiante_info = f"""
            Información del estudiante:
            - Edad: {persona_info.get('edad', 'No especificada')}
            - Semestre: {persona_info.get('semestre', 'No especificado')}
            - Género: {persona_info.get('genero', 'No especificado')}
            """
        
        # Formatear las respuestas
        respuestas_texto = ""
        for pregunta, respuesta in respuestas.items():
            respuestas_texto += f"- {pregunta}: {respuesta}\n"
        
        prompt = f"""
        {estudiante_info}
        
        Respuestas del cuestionario psicopedagógico:
        {respuestas_texto}
        
        Por favor, genera un reporte psicopedagógico profesional que incluya:
        
        1. **ANÁLISIS DE RESPUESTAS**: Interpretación de las respuestas proporcionadas
        2. **FORTALEZAS IDENTIFICADAS**: Aspectos positivos del estudiante
        3. **ÁREAS DE OPORTUNIDAD**: Aspectos que requieren atención o mejora
        4. **RECOMENDACIONES**: Sugerencias específicas para el estudiante
        5. **SEGUIMIENTO**: Recomendaciones para el personal académico
        
        El reporte debe ser empático, profesional y orientado a la mejora del bienestar estudiantil.
        """
        
        return prompt
    
    def _generate_mock_report(self, respuestas: Dict[str, Any], persona_info: Optional[Dict[str, Any]] = None) -> str:
        """Generar un reporte simulado cuando no hay API key de OpenAI."""
        
        estudiante_info = ""
        if persona_info:
            estudiante_info = f"Estudiante de {persona_info.get('edad', 'N/A')} años, semestre {persona_info.get('semestre', 'N/A')}"
        
        return f"""
        **REPORTE PSICOPEDAGÓGICO - MODO SIMULADO**
        
        {estudiante_info}
        
        **1. ANÁLISIS DE RESPUESTAS**
        Se han analizado las respuestas proporcionadas en el cuestionario psicopedagógico. Las respuestas indican un perfil estudiantil que requiere atención personalizada.
        
        **2. FORTALEZAS IDENTIFICADAS**
        - Disposición para participar en el proceso de evaluación
        - Capacidad de autoreflex ión sobre su situación académica
        - Interés en mejorar su desempeño estudiantil
        
        **3. ÁREAS DE OPORTUNIDAD**
        - Desarrollo de estrategias de estudio más efectivas
        - Fortalecimiento de la gestión del tiempo
        - Mejora en las habilidades de comunicación académica
        
        **4. RECOMENDACIONES**
        - Implementar técnicas de estudio personalizadas
        - Establecer rutinas de estudio estructuradas
        - Buscar apoyo en áreas específicas de dificultad
        - Participar en talleres de habilidades de estudio
        
        **5. SEGUIMIENTO**
        - Se recomienda seguimiento mensual con el personal psicopedagógico
        - Evaluación de progreso en 3 meses
        - Considerar apoyo adicional si es necesario
        
        *Nota: Este es un reporte generado en modo simulado. Para reportes completos con IA, configure la API key de OpenAI.*
        
        **Fecha de generación:** {self._get_current_date()}
        """
    
    def _get_current_date(self) -> str:
        """Obtener la fecha actual formateada."""
        from datetime import datetime
        return datetime.now().strftime("%d/%m/%Y %H:%M")


# Instancia global del servicio
ai_service = AIReportService()
