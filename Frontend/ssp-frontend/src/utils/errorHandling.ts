/**
 * Utilidades para manejo de errores en el sistema de cuestionarios
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Procesa errores de la API y los convierte en mensajes amigables para el usuario
 */
export const processApiError = (error: any): ErrorInfo => {
  // Error de red
  if (!error.response) {
    return {
      message: error.message || 'Error de conexión',
      userMessage: 'No se pudo conectar con el servidor. Verifique su conexión a internet.',
      severity: 'error'
    };
  }

  const { status, data } = error.response;

  // Errores específicos por código de estado
  switch (status) {
    case 400:
      return {
        message: data?.detail || 'Solicitud inválida',
        code: 'BAD_REQUEST',
        details: data,
        userMessage: data?.detail || 'Los datos enviados no son válidos. Verifique la información.',
        severity: 'error'
      };

    case 401:
      return {
        message: 'No autorizado',
        code: 'UNAUTHORIZED',
        userMessage: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        severity: 'error'
      };

    case 403:
      return {
        message: 'Acceso denegado',
        code: 'FORBIDDEN',
        userMessage: 'No tiene permisos para realizar esta acción.',
        severity: 'error'
      };

    case 404:
      return {
        message: 'Recurso no encontrado',
        code: 'NOT_FOUND',
        userMessage: 'El elemento solicitado no existe o ha sido eliminado.',
        severity: 'error'
      };

    case 409:
      return {
        message: data?.detail || 'Conflicto',
        code: 'CONFLICT',
        details: data,
        userMessage: data?.detail || 'Ya existe un elemento con esos datos.',
        severity: 'error'
      };

    case 422:
      return {
        message: 'Datos de validación incorrectos',
        code: 'VALIDATION_ERROR',
        details: data,
        userMessage: 'Los datos proporcionados no son válidos. Revise los campos marcados.',
        severity: 'error'
      };

    case 429:
      return {
        message: 'Demasiadas solicitudes',
        code: 'RATE_LIMIT',
        userMessage: 'Ha realizado demasiadas solicitudes. Espere un momento antes de intentar nuevamente.',
        severity: 'warning'
      };

    case 500:
      return {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        userMessage: 'Ocurrió un error en el servidor. Inténtelo más tarde.',
        severity: 'error'
      };

    case 503:
      return {
        message: 'Servicio no disponible',
        code: 'SERVICE_UNAVAILABLE',
        userMessage: 'El servicio no está disponible temporalmente. Inténtelo más tarde.',
        severity: 'error'
      };

    default:
      return {
        message: data?.detail || `Error HTTP ${status}`,
        code: `HTTP_${status}`,
        details: data,
        userMessage: 'Ocurrió un error inesperado. Inténtelo nuevamente.',
        severity: 'error'
      };
  }
};

/**
 * Errores específicos del sistema de cuestionarios
 */
export const CuestionarioErrors = {
  CUESTIONARIO_NOT_FOUND: {
    message: 'Cuestionario no encontrado',
    userMessage: 'El cuestionario solicitado no existe o ha sido eliminado.',
    severity: 'error' as const
  },
  CUESTIONARIO_NOT_ASSIGNED: {
    message: 'Cuestionario no asignado',
    userMessage: 'Este cuestionario no está asignado a su tipo de usuario.',
    severity: 'error' as const
  },
  CUESTIONARIO_EXPIRED: {
    message: 'Cuestionario expirado',
    userMessage: 'El plazo para responder este cuestionario ha vencido.',
    severity: 'warning' as const
  },
  CUESTIONARIO_ALREADY_COMPLETED: {
    message: 'Cuestionario ya completado',
    userMessage: 'Ya ha completado este cuestionario anteriormente.',
    severity: 'info' as const
  },
  INVALID_QUESTION_TYPE: {
    message: 'Tipo de pregunta inválido',
    userMessage: 'El tipo de pregunta especificado no es válido.',
    severity: 'error' as const
  },
  MISSING_REQUIRED_ANSWERS: {
    message: 'Faltan respuestas obligatorias',
    userMessage: 'Debe responder todas las preguntas marcadas como obligatorias.',
    severity: 'warning' as const
  },
  VALIDATION_FAILED: {
    message: 'Error de validación',
    userMessage: 'Los datos proporcionados no cumplen con los requisitos.',
    severity: 'error' as const
  }
};

/**
 * Maneja errores específicos de cuestionarios
 */
export const handleCuestionarioError = (errorCode: string, details?: any): ErrorInfo => {
  const errorInfo = CuestionarioErrors[errorCode as keyof typeof CuestionarioErrors];
  
  if (errorInfo) {
    return {
      ...errorInfo,
      code: errorCode,
      details
    };
  }

  return {
    message: `Error desconocido: ${errorCode}`,
    code: errorCode,
    details,
    userMessage: 'Ocurrió un error inesperado. Contacte al administrador.',
    severity: 'error'
  };
};

/**
 * Formatea errores de validación para mostrar al usuario
 */
export const formatValidationErrors = (errors: { [key: string]: string[] }): string[] => {
  const formattedErrors: string[] = [];
  
  Object.entries(errors).forEach(([field, fieldErrors]) => {
    fieldErrors.forEach(error => {
      formattedErrors.push(`${field}: ${error}`);
    });
  });
  
  return formattedErrors;
};

/**
 * Determina si un error es recuperable (el usuario puede intentar nuevamente)
 */
export const isRecoverableError = (errorInfo: ErrorInfo): boolean => {
  const nonRecoverableCodes = [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR'
  ];
  
  return !errorInfo.code || !nonRecoverableCodes.includes(errorInfo.code);
};

/**
 * Genera un ID único para tracking de errores
 */
export const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log de errores para debugging (en desarrollo)
 */
export const logError = (error: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
    console.error('Original error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.groupEnd();
  }
};

/**
 * Hook personalizado para manejo de errores (para usar con React)
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string): ErrorInfo => {
    logError(error, context);
    return processApiError(error);
  };

  return { handleError };
};

/**
 * Retry automático para operaciones fallidas
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // No reintentar para ciertos tipos de errores
      const errorInfo = processApiError(error);
      if (!isRecoverableError(errorInfo)) {
        throw error;
      }
      
      // Esperar antes del siguiente intento (excepto en el último)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

/**
 * Timeout para operaciones que pueden colgarse
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operación timeout')), timeoutMs)
    )
  ]);
};
