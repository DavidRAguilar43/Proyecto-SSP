// Tipos para el sistema de cuestionarios
export type TipoUsuario = 'alumno' | 'docente' | 'personal';

export type TipoPregunta =
  | 'abierta'
  | 'opcion_multiple'
  | 'verdadero_falso'
  | 'select'
  | 'checkbox'
  | 'radio_button'
  | 'escala_likert';

export type EstadoCuestionario = 'activo' | 'inactivo' | 'borrador';
export type EstadoRespuesta = 'pendiente' | 'en_progreso' | 'completado';

export interface ConfiguracionPregunta {
  limite_caracteres?: number;
  longitud_minima?: number;
  longitud_maxima?: number;
  opciones?: string[];
  seleccion_multiple?: boolean;
  permitir_otro?: boolean;
  opcion_por_defecto?: string;
  minimo_selecciones?: number;
  maximo_selecciones?: number;
  puntos_escala?: number;
  etiqueta_minima?: string;
  etiqueta_maxima?: string;
  mostrar_numeros?: boolean;
  etiqueta_verdadero?: string;
  etiqueta_falso?: string;
}

export interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  texto: string;
  descripcion?: string;
  obligatoria: boolean;
  orden: number;
  configuracion: ConfiguracionPregunta;
  created_at?: string;
  updated_at?: string;
}

export interface CuestionarioAdmin {
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
  creado_por_nombre?: string;
  total_preguntas: number;
  total_respuestas?: number;
  instruccion_sistema?: string;
  modelo_ia?: string;
  max_tokens?: number;
  temperature?: number;
  instruccion_sistema_default?: string;
  updated_at?: string;
}

export interface CuestionarioAdminCreate {
  titulo: string;
  descripcion: string;
  preguntas: Omit<Pregunta, 'id' | 'created_at' | 'updated_at'>[];
  tipos_usuario_asignados: TipoUsuario[];
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: EstadoCuestionario;
  instruccion_sistema?: string;
  modelo_ia?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface CuestionarioAdminUpdate {
  titulo?: string;
  descripcion?: string;
  preguntas?: Pregunta[];
  tipos_usuario_asignados?: TipoUsuario[];
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoCuestionario;
  instruccion_sistema?: string;
  modelo_ia?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface RespuestaPregunta {
  id?: number;
  pregunta_id: string;
  valor: string | string[] | number | boolean | null;
  texto_otro?: string;
  pregunta?: Pregunta; // Información de la pregunta (cuando viene del backend)
  // Campos preservados cuando la pregunta fue eliminada
  pregunta_texto?: string; // Texto de la pregunta al momento de responder
  pregunta_tipo?: string; // Tipo de pregunta al momento de responder
  created_at?: string;
  updated_at?: string;
}

export interface RespuestaCuestionario {
  id?: string;
  cuestionario_id: string;
  usuario_id: number;
  respuestas?: RespuestaPregunta[]; // Alias para compatibilidad
  respuestas_preguntas?: RespuestaPregunta[]; // Nombre correcto del backend
  estado: EstadoRespuesta;
  fecha_inicio?: string;
  fecha_completado?: string;
  tiempo_total_minutos?: number;
  progreso_porcentaje?: number;
  progreso?: number; // Alias para compatibilidad
  cuestionario?: CuestionarioAdmin; // Información del cuestionario
  reportes_ia?: ReporteIA[]; // Reportes de IA generados
  created_at?: string;
  updated_at?: string;
}

export interface CuestionarioAsignado {
  cuestionario: CuestionarioAdmin;
  respuesta?: RespuestaCuestionario;
  estado: EstadoRespuesta;
  fecha_asignacion: string;
  fecha_limite?: string;
  puede_responder: boolean;
}

export interface FiltrosCuestionarios {
  titulo?: string;
  estado?: EstadoCuestionario;
  tipo_usuario?: TipoUsuario;
  fecha_creacion_desde?: string;
  fecha_creacion_hasta?: string;
  creado_por?: string;
  skip?: number;
  limit?: number;
}

export interface EstadisticasCuestionario {
  cuestionario_id: string;
  total_asignados: number;
  total_completados: number;
  total_en_progreso: number;
  total_pendientes: number;
  porcentaje_completado: number;
  tiempo_promedio_minutos?: number;
  fecha_ultima_respuesta?: string;
}

export interface CuestionariosResponse {
  cuestionarios: CuestionarioAdmin[];
  total: number;
  skip: number;
  limit: number;
}

export interface CuestionariosAsignadosResponse {
  cuestionarios_asignados: CuestionarioAsignado[];
  total: number;
}

export interface AsignacionMasiva {
  cuestionario_ids: string[];
  tipos_usuario: TipoUsuario[];
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ValidacionPregunta {
  es_valida: boolean;
  errores: string[];
}

export interface ValidacionCuestionario {
  es_valido: boolean;
  errores_generales: string[];
  errores_preguntas: { [pregunta_id: string]: string[] };
}

export interface ReporteIA {
  id: string;
  respuesta_cuestionario_id: string;
  contenido: string;
  version: number;
  es_actual: boolean;
  fecha_generacion: string;
  created_at?: string;
}
