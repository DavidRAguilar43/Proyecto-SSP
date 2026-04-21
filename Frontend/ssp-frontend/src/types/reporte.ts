/**
 * Tipos para reportes generados por IA
 */

export interface Reporte {
  id: string
  respuesta_cuestionario_id: string
  version: number
  es_actual: boolean
  contenido: string
  fecha_generacion: string
  created_at?: string
}

export interface ReportesResponse {
  respuesta_id: string
  total_reportes: number
  reportes: Reporte[]
}

export interface GenerarReporteResponse {
  id: string
  respuesta_cuestionario_id: string
  version: number
  es_actual: boolean
  contenido: string
  fecha_generacion: string
  mensaje: string
}

export interface PreguntaRespuestaReportePayload {
  pregunta_id?: string
  pregunta: string
  respuesta?: string | number | boolean | string[]
  texto_otro?: string | null
  tipo?: string
  orden?: number
}

/**
 * PROTECCIÓN DE DATOS PERSONALES:
 * - Se permiten: edad, género, semestre (datos demográficos útiles)
 * - NO se permiten: nombres, apellidos, correos, teléfonos, direcciones
 * - Matrícula/número de empleado: comentados temporalmente para pruebas
 */
export interface PersonaInfoReportePayload {
  // COMENTADO TEMPORALMENTE PARA PRUEBAS
  // matricula?: string | null
  // numero_empleado?: string | null

  // Datos demográficos útiles para análisis psicopedagógico
  edad?: number | null
  genero?: string | null
  semestre?: number | null
}

export interface GenerarReporteRequestPayload {
  preguntas_respuestas: PreguntaRespuestaReportePayload[]
  instruccion_sistema?: string | null
  modelo_ia?: string | null
  max_tokens?: number | null
  temperature?: number | null
  persona_info?: PersonaInfoReportePayload
}
