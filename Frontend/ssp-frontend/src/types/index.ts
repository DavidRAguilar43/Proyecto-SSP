// Re-export notification types
export * from './notifications';

// Re-export table types
export * from './table';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  correo_institucional: string;
  matricula?: string;
  rol: 'admin' | 'coordinador' | 'personal' | 'docente' | 'alumno';
  is_active: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export interface Cohorte {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface Persona {
  id: number;
  sexo?: string;
  genero?: string;
  edad?: number;
  estado_civil?: string;
  religion?: string;
  trabaja?: boolean;
  lugar_trabajo?: string;
  lugar_origen?: string;
  colonia_residencia_actual?: string;
  celular?: string;
  correo_institucional: string;
  discapacidad?: string;
  observaciones?: string;
  matricula?: string;
  semestre?: number;
  numero_hijos?: number;
  grupo_etnico?: string;
  rol: 'admin' | 'coordinador' | 'personal' | 'docente' | 'alumno';
  is_active: boolean;
  cohorte_id?: number;
  programas?: any[];
  grupos?: any[];
  cohorte?: Cohorte;
}

export interface PersonaCreate {
  sexo: 'no_decir' | 'masculino' | 'femenino' | 'otro';
  genero: 'no_decir' | 'masculino' | 'femenino' | 'no_binario' | 'otro';
  edad: number;
  estado_civil: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre' | 'otro';
  religion?: string;
  trabaja: boolean;
  lugar_trabajo?: string;
  lugar_origen: string;
  colonia_residencia_actual?: string;
  celular: string;
  correo_institucional: string;
  discapacidad?: string;
  observaciones?: string;
  matricula: string;
  semestre?: number;
  numero_hijos: number;
  grupo_etnico?: string;
  rol: 'admin' | 'coordinador' | 'personal' | 'docente' | 'alumno';
  password: string;
  // Campos de cohorte simplificados
  cohorte_ano?: number;  // Año de cohorte (ej: 2024, 2025)
  cohorte_periodo?: number;  // Período de cohorte (1 o 2)
  programas_ids?: number[];
  grupos_ids?: number[];
}

// Programa Educativo
export interface ProgramaEducativo {
  id: number;
  nombre_programa: string;
  clave_programa: string;
}

export interface ProgramaEducativoCreate {
  nombre_programa: string;
  clave_programa: string;
}

// Grupo
export interface Grupo {
  id: number;
  nombre_grupo: string;
  tipo_grupo: string;
  observaciones_grupo?: string;
  cohorte?: string;
  fecha_creacion_registro?: string;
}

export interface GrupoCreate {
  nombre_grupo: string;
  tipo_grupo: string;
  observaciones_grupo?: string;
  cohorte?: string;
}

// Atención
export interface Atencion {
  id: number;
  id_personal?: number;
  fecha_atencion: string;
  motivo_psicologico: boolean;
  motivo_academico: boolean;
  salud_en_general: boolean;
  id_cuestionario?: number;
  requiere_seguimiento: boolean;
  requiere_canalizacion_externa: boolean;
  estatus_canalizacion_externa?: string;
  observaciones?: string;
  fecha_proxima_sesion?: string;
  id_persona?: number;
  id_grupo?: number;
  atendido: boolean;
  ultima_fecha_contacto?: string;
  persona?: Persona;
}

export interface AtencionCreate {
  id_personal?: number;
  fecha_atencion: string;
  motivo_psicologico: boolean;
  motivo_academico: boolean;
  salud_en_general: boolean;
  id_cuestionario?: number;
  requiere_seguimiento: boolean;
  requiere_canalizacion_externa: boolean;
  estatus_canalizacion_externa?: string;
  observaciones?: string;
  fecha_proxima_sesion?: string;
  id_persona?: number;
  id_grupo?: number;
  atendido: boolean;
  ultima_fecha_contacto?: string;
}

// Tipos para el sistema de citas
export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
export type TipoCita = 'psicologica' | 'academica' | 'general';

export interface CitaCreate {
  tipo_cita: TipoCita;
  motivo: string;
  fecha_propuesta_alumno?: string;
  observaciones_alumno?: string;
}

export interface CitaUpdate {
  estado?: EstadoCita;
  fecha_confirmada?: string;
  observaciones_personal?: string;
  ubicacion?: string;
  id_personal?: number;
}

export interface Cita {
  id_cita: number;
  id_alumno: number;
  id_personal?: number;
  tipo_cita: TipoCita;
  motivo: string;
  estado: EstadoCita;
  fecha_solicitud: string;
  fecha_propuesta_alumno?: string;
  fecha_confirmada?: string;
  fecha_completada?: string;
  observaciones_alumno?: string;
  observaciones_personal?: string;
  ubicacion?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;

  // Información del alumno
  alumno_nombre?: string;
  alumno_email?: string;
  alumno_celular?: string;
  alumno_matricula?: string;

  // Información del personal
  personal_nombre?: string;
  personal_email?: string;
}

export interface SolicitudCita {
  id_cita: number;
  tipo_cita: TipoCita;
  motivo: string;
  estado: EstadoCita;
  fecha_solicitud: string;
  fecha_propuesta_alumno?: string;
  observaciones_alumno?: string;

  // Información del alumno
  id_alumno: number;
  alumno_nombre: string;
  alumno_email: string;
  alumno_celular?: string;
  alumno_matricula?: string;
  alumno_semestre?: number;
}

export interface NotificacionCita {
  id_cita: number;
  tipo_notificacion: string;
  mensaje: string;
  fecha_cita?: string;
  ubicacion?: string;
  personal_nombre?: string;
}

export interface EstadisticasCitas {
  total_solicitudes: number;
  pendientes: number;
  confirmadas: number;
  canceladas: number;
  completadas: number;
  por_tipo: Record<string, number>;
}

// Tipos para cuestionario psicopedagógico
export interface CuestionarioPsicopedagogicoEstudianteOut {
  id_cuestionario: number;
  fecha_creacion: string;
  fecha_completado: string | null;
  completado: boolean;
  persona_nombre?: string;
  persona_email?: string;
}

export interface ReportePsicopedagogicoOut {
  id_cuestionario: number;
  fecha_completado: string;
  reporte_ia: string;
  persona_nombre?: string;
  persona_email?: string;
}

// Interfaces para Catálogos
export interface CatalogoBase {
  id: number;
  titulo: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Religion extends CatalogoBase {}

export interface GrupoEtnico extends CatalogoBase {}

export interface Discapacidad extends CatalogoBase {}

export interface CatalogoCreate {
  titulo: string;
  activo?: boolean;
}

export interface CatalogoUpdate {
  titulo?: string;
  activo?: boolean;
}

export interface ElementosPendientes {
  religiones: Religion[];
  grupos_etnicos: GrupoEtnico[];
  discapacidades: Discapacidad[];
  total: number;
}

export interface ElementoPersonalizado {
  titulo: string;
  tipo_catalogo: 'religion' | 'grupo_etnico' | 'discapacidad';
}
