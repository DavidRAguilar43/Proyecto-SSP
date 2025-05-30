import axios from 'axios';
import type { LoginCredentials, AuthResponse } from '@/types';

// Crear una instancia de axios con la URL base de la API
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
