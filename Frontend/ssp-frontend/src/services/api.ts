import axios from 'axios';
import type { LoginCredentials, AuthResponse } from '@/types';

// Crear una instancia de axios con la URL base de la API
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exportar la instancia de api para uso directo
export { api };

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authService = {
  // Función para iniciar sesión
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Función para obtener el usuario actual
  getCurrentUser: async () => {
    const response = await api.get('/auth/test-token');
    return response.data;
  },
};

// Servicio de personas
export const personasService = {
  // Obtener todas las personas
  getAll: async (params?: { skip?: number; limit?: number; tipo_persona?: string; rol?: string }) => {
    const response = await api.get('/personas', { params });
    return response.data;
  },

  // Obtener una persona por ID
  getById: async (id: number) => {
    const response = await api.get(`/personas/${id}`);
    return response.data;
  },

  // Crear una nueva persona
  create: async (persona: any) => {
    const response = await api.post('/personas', persona);
    return response.data;
  },

  // Actualizar una persona
  update: async (id: number, persona: any) => {
    // Filtrar campos vacíos o undefined para la actualización
    const cleanData = Object.fromEntries(
      Object.entries(persona).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/personas/${id}`, cleanData);
    return response.data;
  },

  // Eliminar una persona
  delete: async (id: number) => {
    const response = await api.delete(`/personas/${id}`);
    return response.data;
  },

  // Eliminar múltiples personas
  bulkDelete: async (ids: number[]) => {
    const response = await api.post('/personas/bulk-delete', { ids });
    return response.data;
  },

  // Buscar personas
  search: async (query: string) => {
    const response = await api.get('/personas/search', { params: { q: query } });
    return response.data;
  },

  // Obtener solo estudiantes/alumnos
  getEstudiantes: async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get('/personas/list/estudiantes', { params });
    return response.data;
  },

  // Auto-registro para alumnos (sin autenticación)
  registroAlumno: async (data: any) => {
    const response = await api.post('/personas/registro-alumno/', data);
    return response.data;
  },

  // Obtener mi perfil (para alumnos)
  getMiPerfil: async () => {
    const response = await api.get('/personas/mi-perfil');
    return response.data;
  },

  // Actualizar mi perfil (para alumnos)
  updateMiPerfil: async (data: any) => {
    const response = await api.put('/personas/mi-perfil', data);
    return response.data;
  },
};

// API para Cohortes
export const cohortesApi = {
  // Obtener todas las cohortes
  getAll: async (params?: { skip?: number; limit?: number; activo?: boolean }) => {
    const response = await api.get('/cohortes', { params });
    return response.data;
  },

  // Obtener cohortes activas
  getActivas: async () => {
    const response = await api.get('/cohortes/activas');
    return response.data;
  },

  // Generar opciones de cohortes automáticamente
  generarOpciones: async () => {
    const response = await api.post('/cohortes/generar-opciones');
    return response.data;
  },

  // Obtener cohorte por ID
  getById: async (id: number) => {
    const response = await api.get(`/cohortes/${id}`);
    return response.data;
  },

  // Crear cohorte
  create: async (data: any) => {
    const response = await api.post('/cohortes', data);
    return response.data;
  },

  // Actualizar cohorte
  update: async (id: number, data: any) => {
    const response = await api.put(`/cohortes/${id}`, data);
    return response.data;
  },

  // Eliminar cohorte
  delete: async (id: number) => {
    const response = await api.delete(`/cohortes/${id}`);
    return response.data;
  },

  // Buscar cohortes
  search: async (query: string) => {
    const response = await api.get('/cohortes/search', { params: { q: query } });
    return response.data;
  },
};

// Alias para mantener compatibilidad
export const personasApi = personasService;

// API para Programas Educativos
export const programasEducativosApi = {
  // Obtener todos los programas educativos
  getAll: async () => {
    const response = await api.get('/programas-educativos/');
    return response.data;
  },

  // Obtener un programa educativo por ID
  getById: async (id: number) => {
    const response = await api.get(`/programas-educativos/${id}`);
    return response.data;
  },

  // Crear un nuevo programa educativo
  create: async (programa: any) => {
    const response = await api.post('/programas-educativos/', programa);
    return response.data;
  },

  // Actualizar un programa educativo
  update: async (id: number, programa: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(programa).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/programas-educativos/${id}`, cleanData);
    return response.data;
  },

  // Eliminar un programa educativo
  delete: async (id: number) => {
    const response = await api.delete(`/programas-educativos/${id}`);
    return response.data;
  },
};

// API para Grupos
export const gruposApi = {
  // Obtener todos los grupos
  getAll: async () => {
    const response = await api.get('/grupos/');
    return response.data;
  },

  // Obtener un grupo por ID
  getById: async (id: number) => {
    const response = await api.get(`/grupos/${id}`);
    return response.data;
  },

  // Crear un nuevo grupo
  create: async (grupo: any) => {
    const response = await api.post('/grupos/', grupo);
    return response.data;
  },

  // Actualizar un grupo
  update: async (id: number, grupo: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(grupo).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/grupos/${id}`, cleanData);
    return response.data;
  },

  // Eliminar un grupo
  delete: async (id: number) => {
    const response = await api.delete(`/grupos/${id}`);
    return response.data;
  },
};

// API para Atenciones
export const atencionesApi = {
  // Obtener todas las atenciones
  getAll: async () => {
    const response = await api.get('/atenciones/');
    return response.data;
  },

  // Obtener una atención por ID
  getById: async (id: number) => {
    const response = await api.get(`/atenciones/${id}`);
    return response.data;
  },

  // Crear una nueva atención
  create: async (atencion: any) => {
    const response = await api.post('/atenciones/', atencion);
    return response.data;
  },

  // Actualizar una atención
  update: async (id: number, atencion: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(atencion).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/atenciones/${id}`, cleanData);
    return response.data;
  },

  // Eliminar una atención
  delete: async (id: number) => {
    const response = await api.delete(`/atenciones/${id}`);
    return response.data;
  },
};

// API para gestión de citas
export const citasApi = {
  // Solicitar una cita (solo alumnos)
  solicitar: async (data: any) => {
    const response = await api.post('/citas/solicitar', data);
    return response.data;
  },

  // Obtener mis citas (solo alumnos)
  getMisCitas: async () => {
    const response = await api.get('/citas/mis-citas');
    return response.data;
  },

  // Obtener solicitudes de citas (solo admin/personal)
  getSolicitudes: async (estado?: string) => {
    const params = estado ? { estado } : {};
    const response = await api.get('/citas/solicitudes', { params });
    return response.data;
  },

  // Confirmar/actualizar una cita (solo admin/personal)
  confirmar: async (citaId: number, data: any) => {
    const response = await api.put(`/citas/${citaId}/confirmar`, data);
    return response.data;
  },

  // Obtener notificaciones de citas (solo alumnos)
  getNotificaciones: async () => {
    const response = await api.get('/citas/notificaciones');
    return response.data;
  },

  // Obtener estadísticas de citas (solo admin/personal)
  getEstadisticas: async () => {
    const response = await api.get('/citas/estadisticas');
    return response.data;
  }
};

// API para cuestionario psicopedagógico
export const cuestionarioPsicopedagogicoApi = {
  // Obtener preguntas del cuestionario
  getPreguntas: async () => {
    const response = await api.get('/cuestionario-psicopedagogico/preguntas');
    return response.data;
  },

  // Completar cuestionario
  completar: async (data: any) => {
    const response = await api.post('/cuestionario-psicopedagogico/completar', data);
    return response.data;
  },

  // Obtener estado del cuestionario para el estudiante actual
  getEstado: async () => {
    const response = await api.get('/cuestionario-psicopedagogico/estado');
    return response.data;
  },

  // Obtener estudiantes con cuestionarios (solo admin/personal)
  getEstudiantesConCuestionarios: async () => {
    const response = await api.get('/cuestionario-psicopedagogico/estudiantes');
    return response.data;
  },

  // Obtener reporte de un estudiante específico (solo admin/personal)
  getReporte: async (idPersona: number) => {
    const response = await api.get(`/cuestionario-psicopedagogico/reporte/${idPersona}`);
    return response.data;
  }
};

export default api;
