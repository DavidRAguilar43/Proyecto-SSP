import axios from 'axios';
import type { LoginCredentials, AuthResponse } from '../types';

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
  getAll: async (params?: { skip?: number; limit?: number; rol?: string }) => {
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

  // Validar si un email está disponible
  validateEmail: async (email: string) => {
    const response = await api.get(`/personas/validate-email/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Validar si una matrícula está disponible
  validateMatricula: async (matricula: string) => {
    const response = await api.get(`/personas/validate-matricula/${encodeURIComponent(matricula)}`);
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

// API para Catálogos
export const catalogosApi = {
  // Religiones
  religiones: {
    getAll: async (activo?: boolean) => {
      const params = activo !== undefined ? { activo } : {};
      const response = await api.get('/catalogos/religiones/', { params });
      return response.data;
    },
    getActivas: async () => {
      const response = await api.get('/catalogos/religiones/activas/');
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/catalogos/religiones/', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/catalogos/religiones/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/catalogos/religiones/${id}`);
      return response.data;
    },
    bulkDelete: async (ids: number[]) => {
      const response = await api.post('/catalogos/religiones/bulk-delete', { ids });
      return response.data;
    }
  },

  // Grupos Étnicos
  gruposEtnicos: {
    getAll: async (activo?: boolean) => {
      const params = activo !== undefined ? { activo } : {};
      const response = await api.get('/catalogos/grupos-etnicos/', { params });
      return response.data;
    },
    getActivos: async () => {
      const response = await api.get('/catalogos/grupos-etnicos/activos/');
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/catalogos/grupos-etnicos/', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/catalogos/grupos-etnicos/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/catalogos/grupos-etnicos/${id}`);
      return response.data;
    },
    bulkDelete: async (ids: number[]) => {
      const response = await api.post('/catalogos/grupos-etnicos/bulk-delete', { ids });
      return response.data;
    }
  },

  // Discapacidades
  discapacidades: {
    getAll: async (activo?: boolean) => {
      const params = activo !== undefined ? { activo } : {};
      const response = await api.get('/catalogos/discapacidades/', { params });
      return response.data;
    },
    getActivas: async () => {
      const response = await api.get('/catalogos/discapacidades/activas/');
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/catalogos/discapacidades/', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/catalogos/discapacidades/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/catalogos/discapacidades/${id}`);
      return response.data;
    },
    bulkDelete: async (ids: number[]) => {
      const response = await api.post('/catalogos/discapacidades/bulk-delete', { ids });
      return response.data;
    }
  },

  // Endpoints especiales
  getPendientes: async () => {
    const response = await api.get('/catalogos/pendientes/');
    return response.data;
  },

  createElementoPersonalizado: async (data: any) => {
    const response = await api.post('/catalogos/elemento-personalizado/', data);
    return response.data;
  },

  activarMultiples: async (elementos: any) => {
    const response = await api.post('/catalogos/activar-multiples/', elementos);
    return response.data;
  },

  // Procesar elementos personalizados después del envío exitoso del formulario
  procesarElementosPersonalizados: async (formData: any) => {
    const elementosPersonalizados = [];

    // Verificar religión personalizada
    if (formData.religion && formData.religion !== 'otro' && formData.religion.trim()) {
      elementosPersonalizados.push({
        titulo: formData.religion.trim(),
        tipo_catalogo: 'religion'
      });
    }

    // Verificar grupo étnico personalizado
    if (formData.grupo_etnico && formData.grupo_etnico !== 'otro' && formData.grupo_etnico.trim()) {
      elementosPersonalizados.push({
        titulo: formData.grupo_etnico.trim(),
        tipo_catalogo: 'grupo_etnico'
      });
    }

    // Verificar discapacidad personalizada
    if (formData.discapacidad && formData.discapacidad !== 'otro' && formData.discapacidad.trim()) {
      elementosPersonalizados.push({
        titulo: formData.discapacidad.trim(),
        tipo_catalogo: 'discapacidad'
      });
    }

    // Crear elementos personalizados en el backend
    const resultados = [];
    for (const elemento of elementosPersonalizados) {
      try {
        const resultado = await catalogosApi.createElementoPersonalizado(elemento);
        resultados.push(resultado);
      } catch (error) {
        console.error('Error creating custom element:', error);
        // Continuar con los demás elementos aunque uno falle
      }
    }

    return resultados;
  }
};

// API para Programas Educativos
export const programasEducativosApi = {
  // Obtener todos los programas educativos (público, sin autenticación)
  getPublico: async () => {
    const response = await api.get('/programas-educativos/publico/');
    return response.data;
  },

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

  // Eliminar múltiples programas educativos
  bulkDelete: async (ids: number[]) => {
    const response = await api.post('/programas-educativos/bulk-delete', { ids });
    return response.data;
  },
};

// API para Unidades
export const unidadesApi = {
  // Obtener todas las unidades (público, sin autenticación)
  getPublico: async () => {
    const response = await api.get('/unidades/publico/');
    return response.data;
  },

  // Obtener todas las unidades
  getAll: async () => {
    const response = await api.get('/unidades/');
    return response.data;
  },

  // Obtener una unidad por ID
  getById: async (id: number) => {
    const response = await api.get(`/unidades/${id}`);
    return response.data;
  },

  // Crear una nueva unidad
  create: async (unidad: any) => {
    const response = await api.post('/unidades/', unidad);
    return response.data;
  },

  // Actualizar una unidad
  update: async (id: number, unidad: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(unidad).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/unidades/${id}`, cleanData);
    return response.data;
  },

  // Eliminar una unidad
  delete: async (id: number) => {
    const response = await api.delete(`/unidades/${id}`);
    return response.data;
  },

  // Eliminar múltiples unidades
  bulkDelete: async (ids: number[]) => {
    const response = await api.delete('/unidades/bulk-delete/', { data: { ids } });
    return response.data;
  },
};

// API para Departamentos
export const departamentosApi = {
  // Obtener todos los departamentos activos (público, sin autenticación)
  getPublico: async () => {
    const response = await api.get('/departamentos/publico/');
    return response.data;
  },

  // Obtener todos los departamentos
  getAll: async () => {
    const response = await api.get('/departamentos/');
    return response.data;
  },

  // Obtener un departamento por ID
  getById: async (id: number) => {
    const response = await api.get(`/departamentos/${id}`);
    return response.data;
  },

  // Crear un nuevo departamento
  create: async (departamento: any) => {
    const response = await api.post('/departamentos/', departamento);
    return response.data;
  },

  // Actualizar un departamento
  update: async (id: number, departamento: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(departamento).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );

    const response = await api.put(`/departamentos/${id}`, cleanData);
    return response.data;
  },

  // Eliminar un departamento
  delete: async (id: number) => {
    const response = await api.delete(`/departamentos/${id}`);
    return response.data;
  },

  // Eliminar múltiples departamentos
  bulkDelete: async (ids: number[]) => {
    const response = await api.delete('/departamentos/bulk-delete/', { data: { ids } });
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

  // Eliminar múltiples grupos
  bulkDelete: async (ids: number[]) => {
    const response = await api.post('/grupos/bulk-delete', { ids });
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

  // DEPRECATED: Usar citasApi en su lugar
  // Estas funciones se mantienen temporalmente para compatibilidad
  create: async (atencion: any) => {
    console.warn('atencionesApi.create está deprecado. Usar citasApi.create');
    const response = await api.post('/citas/', atencion);
    return response.data;
  },

  update: async (id: number, atencion: any) => {
    console.warn('atencionesApi.update está deprecado. Usar citasApi.update');
    const cleanData = Object.fromEntries(
      Object.entries(atencion).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );
    const response = await api.put(`/citas/${id}`, cleanData);
    return response.data;
  },

  delete: async (id: number) => {
    console.warn('atencionesApi.delete está deprecado. Usar citasApi.delete');
    const response = await api.delete(`/citas/${id}`);
    return response.data;
  },

  bulkDelete: async (ids: number[]) => {
    console.warn('atencionesApi.bulkDelete está deprecado. Usar citasApi.bulkDelete');
    const response = await api.post('/citas/bulk-delete', { ids });
    return response.data;
  },
};

// API para gestión de citas (fusionado con atenciones)
export const citasApi = {
  // ============================================================================
  // ENDPOINTS CRUD COMPLETOS
  // ============================================================================

  // Obtener todas las citas con filtros
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    estado?: string;
    tipo_cita?: string;
    id_alumno?: number;
    id_personal?: number;
    id_grupo?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    const response = await api.get('/citas/', { params });
    return response.data;
  },

  // Obtener una cita por ID
  getById: async (citaId: number) => {
    const response = await api.get(`/citas/${citaId}`);
    return response.data;
  },

  // Crear una nueva cita (admin/coordinador)
  create: async (data: any) => {
    const response = await api.post('/citas/', data);
    return response.data;
  },

  // Actualizar una cita (admin/coordinador)
  update: async (citaId: number, data: any) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) =>
        value !== '' && value !== null && value !== undefined
      )
    );
    const response = await api.put(`/citas/${citaId}`, cleanData);
    return response.data;
  },

  // Eliminar una cita (solo admin)
  delete: async (citaId: number) => {
    const response = await api.delete(`/citas/${citaId}`);
    return response.data;
  },

  // Buscar citas por texto
  search: async (query: string) => {
    const response = await api.get('/citas/search/', { params: { q: query } });
    return response.data;
  },

  // Operaciones masivas
  bulkCreate: async (items: any[]) => {
    const response = await api.post('/citas/bulk-create', { items });
    return response.data;
  },

  bulkUpdate: async (items: any[]) => {
    const response = await api.put('/citas/bulk-update', { items });
    return response.data;
  },

  bulkDelete: async (ids: number[]) => {
    const response = await api.post('/citas/bulk-delete', { ids });
    return response.data;
  },

  // ============================================================================
  // ENDPOINTS ESPECÍFICOS DEL FLUJO DE CITAS
  // ============================================================================

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
  },

  // Eliminar múltiples citas
  bulkDelete: async (ids: number[]) => {
    const response = await api.post('/citas/bulk-delete', { ids });
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
    const response = await api.get('/cuestionario-psicopedagogico/estudiantes-con-cuestionarios');
    return response.data;
  },

  // Obtener reporte de un estudiante específico (solo admin/personal)
  getReporte: async (idPersona: number) => {
    const response = await api.get(`/cuestionario-psicopedagogico/reporte/${idPersona}`);
    return response.data;
  }
};

// Servicio de notificaciones de registro
export const notificacionesApi = {
  // Obtener notificaciones de registros pendientes
  getNotificacionesRegistros: async (params?: {
    skip?: number;
    limit?: number;
    solo_pendientes?: boolean;
    tipo_notificacion?: string;
  }) => {
    const response = await api.get('/notificaciones/registros', { params });
    return response.data;
  },

  // Marcar notificación como leída
  marcarComoLeida: async (notificacionId: number) => {
    const response = await api.patch(`/notificaciones/${notificacionId}/marcar-leida`);
    return response.data;
  },

  // Procesar notificación (aprobar/rechazar)
  procesarNotificacion: async (notificacionId: number, datos: {
    aprobada: boolean;
    observaciones_admin?: string;
  }) => {
    const response = await api.post(`/notificaciones/${notificacionId}/procesar`, datos);
    return response.data;
  },

  // Obtener estadísticas de notificaciones
  getEstadisticas: async () => {
    const response = await api.get('/notificaciones/estadisticas');
    return response.data;
  }
};

// API para gestión de cuestionarios administrativos
export const cuestionariosAdminApi = {
  // Obtener todos los cuestionarios con filtros
  getAll: async (filtros?: {
    titulo?: string;
    estado?: string;
    tipo_usuario?: string;
    fecha_creacion_desde?: string;
    fecha_creacion_hasta?: string;
    creado_por?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get('/cuestionarios-admin', { params: filtros });
    return response.data;
  },

  // Obtener cuestionario por ID
  getById: async (id: string) => {
    const response = await api.get(`/cuestionarios-admin/${id}`);
    return response.data;
  },

  // Crear nuevo cuestionario
  create: async (data: any) => {
    const response = await api.post('/cuestionarios-admin/', data);
    return response.data;
  },

  // Actualizar cuestionario existente
  update: async (id: string, data: any) => {
    const response = await api.put(`/cuestionarios-admin/${id}`, data);
    return response.data;
  },

  // Eliminar cuestionario
  delete: async (id: string) => {
    const response = await api.delete(`/cuestionarios-admin/${id}`);
    return response.data;
  },

  // Duplicar cuestionario
  duplicate: async (id: string, nuevoTitulo?: string) => {
    const response = await api.post(`/cuestionarios-admin/${id}/duplicar`, {
      nuevo_titulo: nuevoTitulo
    });
    return response.data;
  },

  // Obtener estadísticas de un cuestionario
  getEstadisticas: async (id: string) => {
    const response = await api.get(`/cuestionarios-admin/${id}/estadisticas`);
    return response.data;
  },

  // Asignación masiva de cuestionarios
  asignacionMasiva: async (data: {
    cuestionario_ids: string[];
    tipos_usuario: string[];
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    const response = await api.post('/cuestionarios-admin/asignacion-masiva', data);
    return response.data;
  },

  // Validar cuestionario antes de guardar
  validar: async (data: any) => {
    const response = await api.post('/cuestionarios-admin/validar', data);
    return response.data;
  },

  // Cambiar estado de cuestionario (activar/desactivar)
  cambiarEstado: async (id: string, estado: string) => {
    const response = await api.patch(`/cuestionarios-admin/${id}/estado`, { estado });
    return response.data;
  },

  // Obtener todas las respuestas de cuestionarios administrativos
  getAllRespuestas: async (filtros?: {
    cuestionario_id?: string;
    usuario_id?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get('/cuestionarios-admin/respuestas/todas', { params: filtros });
    return response.data;
  }
};

// API para usuarios finales (responder cuestionarios)
export const cuestionariosUsuarioApi = {
  // Obtener cuestionarios asignados al usuario actual
  getCuestionariosAsignados: async (filtros?: {
    estado?: string;
    tipo?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get('/cuestionarios-usuario/asignados', { params: filtros });
    return response.data;
  },

  // Obtener cuestionario específico para responder
  getCuestionarioParaResponder: async (cuestionarioId: string) => {
    const response = await api.get(`/cuestionarios-usuario/${cuestionarioId}/responder`);
    return response.data;
  },

  // Guardar respuestas (progreso parcial o completar)
  guardarRespuestas: async (cuestionarioId: string, respuestas: any, estado: 'en_progreso' | 'completado' = 'en_progreso', progreso: number = 0) => {
    const response = await api.post(`/cuestionarios-usuario/${cuestionarioId}/responder`, {
      respuestas,
      estado,
      progreso
    });
    return response.data;
  },

  // Completar cuestionario (envío final) - usa el mismo endpoint que guardarRespuestas
  completarCuestionario: async (cuestionarioId: string, respuestas: any, progreso: number = 100) => {
    const response = await api.post(`/cuestionarios-usuario/${cuestionarioId}/responder`, {
      respuestas,
      estado: 'completado',
      progreso
    });
    return response.data;
  },

  // Obtener respuestas guardadas de un cuestionario
  getRespuestasGuardadas: async (cuestionarioId: string) => {
    const response = await api.get(`/cuestionarios-usuario/${cuestionarioId}/mi-respuesta`);
    return response.data;
  },

  // Obtener historial de cuestionarios completados
  getHistorialCompletados: async (filtros?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get('/cuestionarios-usuario/historial', { params: filtros });
    return response.data;
  }
};

export default api;
