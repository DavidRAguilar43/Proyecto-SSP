/**
 * Utilidad para diagnosticar problemas de autenticación
 * Especialmente útil para debuggear problemas con eliminación de personal/docentes
 */

import { api } from '@/services/api';

export interface AuthDiagnosticResult {
  hasToken: boolean;
  tokenValue: string | null;
  tokenExpired: boolean;
  userInfo: any;
  serverReachable: boolean;
  authHeaderSent: boolean;
  error?: string;
}

/**
 * Ejecuta un diagnóstico completo de autenticación
 */
export const runAuthDiagnostic = async (): Promise<AuthDiagnosticResult> => {
  const result: AuthDiagnosticResult = {
    hasToken: false,
    tokenValue: null,
    tokenExpired: false,
    userInfo: null,
    serverReachable: false,
    authHeaderSent: false,
  };

  try {
    // 1. Verificar si existe token en localStorage
    const token = localStorage.getItem('token');
    result.hasToken = !!token;
    result.tokenValue = token;

    if (!token) {
      result.error = 'No hay token en localStorage';
      return result;
    }

    // 2. Verificar si el token está expirado (decodificar JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      result.tokenExpired = payload.exp < currentTime;
      
      if (result.tokenExpired) {
        result.error = `Token expirado. Expira: ${new Date(payload.exp * 1000).toLocaleString()}`;
      }
    } catch (e) {
      result.error = 'Token malformado - no se puede decodificar';
      return result;
    }

    // 3. Verificar conectividad con el servidor
    try {
      const response = await api.get('/auth/test-token');
      result.serverReachable = true;
      result.userInfo = response.data;
      result.authHeaderSent = true;
    } catch (error: any) {
      result.serverReachable = true; // El servidor respondió, aunque con error
      
      if (error.response?.status === 401) {
        result.error = 'Token inválido o expirado según el servidor';
      } else if (error.response?.status === 403) {
        result.error = 'Token válido pero sin permisos suficientes';
      } else {
        result.error = `Error del servidor: ${error.response?.status} - ${error.message}`;
      }
    }

  } catch (error: any) {
    result.error = `Error inesperado: ${error.message}`;
  }

  return result;
};

/**
 * Prueba específica para eliminar una persona (simulación)
 */
export const testDeletePermission = async (personaId: number): Promise<{
  canDelete: boolean;
  error?: string;
  statusCode?: number;
}> => {
  try {
    // Hacer una petición HEAD o GET para verificar permisos sin eliminar realmente
    const response = await api.get(`/personas/${personaId}`);
    
    // Si podemos obtener la persona, intentamos verificar permisos de eliminación
    // Nota: Esto no garantiza que podamos eliminar, pero es un primer paso
    return {
      canDelete: true,
    };
  } catch (error: any) {
    return {
      canDelete: false,
      error: error.message,
      statusCode: error.response?.status,
    };
  }
};

/**
 * Función para mostrar diagnóstico en consola de forma legible
 */
export const logAuthDiagnostic = async () => {
  console.group('🔍 DIAGNÓSTICO DE AUTENTICACIÓN');
  
  const diagnostic = await runAuthDiagnostic();
  
  console.log('📋 Resultados:');
  console.table({
    'Token presente': diagnostic.hasToken ? '✅' : '❌',
    'Token expirado': diagnostic.tokenExpired ? '❌' : '✅',
    'Servidor alcanzable': diagnostic.serverReachable ? '✅' : '❌',
    'Header Auth enviado': diagnostic.authHeaderSent ? '✅' : '❌',
  });

  if (diagnostic.tokenValue) {
    console.log('🔑 Token (primeros 50 chars):', diagnostic.tokenValue.substring(0, 50) + '...');
  }

  if (diagnostic.userInfo) {
    console.log('👤 Info del usuario:', diagnostic.userInfo);
  }

  if (diagnostic.error) {
    console.error('❌ Error:', diagnostic.error);
  }

  console.groupEnd();
  
  return diagnostic;
};

/**
 * Función para limpiar y renovar autenticación
 */
export const refreshAuth = () => {
  console.log('🔄 Limpiando autenticación...');
  localStorage.removeItem('token');
  window.location.reload();
};

/**
 * Interceptor temporal para debuggear peticiones
 */
export const enableRequestDebugging = () => {
  // Interceptor para requests
  const requestInterceptor = api.interceptors.request.use(
    (config) => {
      console.group(`🚀 REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Headers:', config.headers);
      console.log('Data:', config.data);
      console.groupEnd();
      return config;
    },
    (error) => {
      console.error('❌ REQUEST ERROR:', error);
      return Promise.reject(error);
    }
  );

  // Interceptor para responses
  const responseInterceptor = api.interceptors.response.use(
    (response) => {
      console.group(`✅ RESPONSE: ${response.status} ${response.config.url}`);
      console.log('Data:', response.data);
      console.groupEnd();
      return response;
    },
    (error) => {
      console.group(`❌ RESPONSE ERROR: ${error.response?.status} ${error.config?.url}`);
      console.log('Error:', error.response?.data);
      console.log('Headers:', error.response?.headers);
      console.groupEnd();
      return Promise.reject(error);
    }
  );

  // Función para desactivar debugging
  return () => {
    api.interceptors.request.eject(requestInterceptor);
    api.interceptors.response.eject(responseInterceptor);
    console.log('🔇 Request debugging desactivado');
  };
};
