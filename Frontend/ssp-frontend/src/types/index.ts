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
  rol: 'admin' | 'personal' | 'docente' | 'alumno';
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

export interface Persona {
  id: number;
  tipo_persona: string;
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
  rol: 'admin' | 'personal' | 'docente' | 'alumno';
  is_active: boolean;
  programas?: any[];
  grupos?: any[];
}

export interface PersonaCreate {
  tipo_persona: 'alumno' | 'docente' | 'administrativo' | 'otro';
  sexo: 'masculino' | 'femenino' | 'otro';
  genero: 'masculino' | 'femenino' | 'no_binario' | 'otro';
  edad: number;
  estado_civil: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre' | 'otro';
  religion?: string;
  trabaja: boolean;
  lugar_trabajo?: string;
  lugar_origen: string;
  colonia_residencia_actual: string;
  celular: string;
  correo_institucional: string;
  discapacidad?: string;
  observaciones?: string;
  matricula?: string;
  semestre?: number;
  numero_hijos: number;
  grupo_etnico?: string;
  rol: 'admin' | 'personal' | 'docente' | 'alumno';
  password: string;
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
