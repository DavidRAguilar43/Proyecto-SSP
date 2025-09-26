import type {
  CuestionarioAdminCreate,
  CuestionarioAdminUpdate,
  Pregunta,
  ValidacionCuestionario,
  ValidacionPregunta,
  TipoPregunta
} from '@/types/cuestionarios';

/**
 * Utilidades para validación de cuestionarios y preguntas
 */

/**
 * Valida una pregunta individual
 */
export const validarPregunta = (pregunta: Pregunta): ValidacionPregunta => {
  const errores: string[] = [];

  // Validar texto de la pregunta
  if (!pregunta.texto || !pregunta.texto.trim()) {
    errores.push('El texto de la pregunta es obligatorio');
  } else if (pregunta.texto.length > 500) {
    errores.push('El texto de la pregunta no puede exceder 500 caracteres');
  }

  // Validar orden
  if (pregunta.orden < 1) {
    errores.push('El orden de la pregunta debe ser mayor a 0');
  }

  // Validaciones específicas por tipo de pregunta
  switch (pregunta.tipo) {
    case 'abierta':
      if (pregunta.configuracion.limite_caracteres && pregunta.configuracion.limite_caracteres < 1) {
        errores.push('El límite de caracteres debe ser mayor a 0');
      }
      if (pregunta.configuracion.longitud_minima && pregunta.configuracion.longitud_minima < 0) {
        errores.push('La longitud mínima no puede ser negativa');
      }
      if (pregunta.configuracion.limite_caracteres && pregunta.configuracion.longitud_minima &&
          pregunta.configuracion.longitud_minima > pregunta.configuracion.limite_caracteres) {
        errores.push('La longitud mínima no puede ser mayor al límite de caracteres');
      }
      break;

    case 'opcion_multiple':
    case 'select':
    case 'checkbox':
    case 'radio_button':
      if (!pregunta.configuracion.opciones || pregunta.configuracion.opciones.length < 2) {
        errores.push('Debe tener al menos 2 opciones');
      } else {
        const opcionesVacias = pregunta.configuracion.opciones.filter(op => !op.trim()).length;
        if (opcionesVacias > 0) {
          errores.push('Las opciones no pueden estar vacías');
        }

        const opcionesDuplicadas = pregunta.configuracion.opciones.filter(
          (op, index, arr) => arr.indexOf(op) !== index
        );
        if (opcionesDuplicadas.length > 0) {
          errores.push('No puede haber opciones duplicadas');
        }

        // Validar límites específicos
        if (pregunta.tipo === 'select' && pregunta.configuracion.opciones.length > 15) {
          errores.push('Las listas desplegables no pueden tener más de 15 opciones');
        } else if (pregunta.configuracion.opciones.length > 10) {
          errores.push('No puede tener más de 10 opciones');
        }
      }

      // Validaciones específicas para checkbox
      if (pregunta.tipo === 'checkbox') {
        if (pregunta.configuracion.minimo_selecciones && pregunta.configuracion.minimo_selecciones < 0) {
          errores.push('El mínimo de selecciones no puede ser negativo');
        }
        if (pregunta.configuracion.maximo_selecciones && pregunta.configuracion.maximo_selecciones < 1) {
          errores.push('El máximo de selecciones debe ser mayor a 0');
        }
        if (pregunta.configuracion.minimo_selecciones && pregunta.configuracion.maximo_selecciones &&
            pregunta.configuracion.minimo_selecciones > pregunta.configuracion.maximo_selecciones) {
          errores.push('El mínimo de selecciones no puede ser mayor al máximo');
        }
        if (pregunta.configuracion.opciones && pregunta.configuracion.maximo_selecciones &&
            pregunta.configuracion.maximo_selecciones > pregunta.configuracion.opciones.length) {
          errores.push('El máximo de selecciones no puede ser mayor al número de opciones');
        }
      }
      break;

    case 'escala_likert':
      if (!pregunta.configuracion.puntos_escala || pregunta.configuracion.puntos_escala < 3) {
        errores.push('La escala debe tener al menos 3 puntos');
      } else if (pregunta.configuracion.puntos_escala > 10) {
        errores.push('La escala no puede tener más de 10 puntos');
      }
      break;

    case 'verdadero_falso':
      // No requiere validaciones adicionales
      break;

    default:
      errores.push('Tipo de pregunta no válido');
  }

  return {
    es_valida: errores.length === 0,
    errores
  };
};

/**
 * Valida un cuestionario completo
 */
export const validarCuestionario = (
  cuestionario: CuestionarioAdminCreate | CuestionarioAdminUpdate
): ValidacionCuestionario => {
  const errores_generales: string[] = [];
  const errores_preguntas: { [pregunta_id: string]: string[] } = {};

  // Validaciones generales
  if (cuestionario.titulo !== undefined) {
    if (!cuestionario.titulo.trim()) {
      errores_generales.push('El título es obligatorio');
    } else if (cuestionario.titulo.length > 100) {
      errores_generales.push('El título no puede exceder 100 caracteres');
    }
  }

  if (cuestionario.descripcion !== undefined) {
    if (!cuestionario.descripcion.trim()) {
      errores_generales.push('La descripción es obligatoria');
    } else if (cuestionario.descripcion.length > 500) {
      errores_generales.push('La descripción no puede exceder 500 caracteres');
    }
  }

  if (cuestionario.preguntas !== undefined) {
    if (cuestionario.preguntas.length === 0) {
      errores_generales.push('Debe agregar al menos una pregunta');
    } else if (cuestionario.preguntas.length > 50) {
      errores_generales.push('No puede exceder 50 preguntas por cuestionario');
    }

    // Validar cada pregunta
    cuestionario.preguntas.forEach((pregunta, index) => {
      const validacionPregunta = validarPregunta(pregunta);
      if (!validacionPregunta.es_valida) {
        errores_preguntas[pregunta.id] = validacionPregunta.errores;
      }
    });

    // Validar órdenes únicos
    const ordenes = cuestionario.preguntas.map(p => p.orden);
    const ordenesDuplicados = ordenes.filter((orden, index) => ordenes.indexOf(orden) !== index);
    if (ordenesDuplicados.length > 0) {
      errores_generales.push('Los órdenes de las preguntas deben ser únicos');
    }
  }

  if (cuestionario.tipos_usuario_asignados !== undefined) {
    if (cuestionario.tipos_usuario_asignados.length === 0) {
      errores_generales.push('Debe asignar el cuestionario a al menos un tipo de usuario');
    }

    const tiposValidos = ['alumno', 'docente', 'personal'];
    const tiposInvalidos = cuestionario.tipos_usuario_asignados.filter(
      tipo => !tiposValidos.includes(tipo)
    );
    if (tiposInvalidos.length > 0) {
      errores_generales.push(`Tipos de usuario inválidos: ${tiposInvalidos.join(', ')}`);
    }
  }

  // Validar fechas
  if (cuestionario.fecha_inicio && cuestionario.fecha_fin) {
    const fechaInicio = new Date(cuestionario.fecha_inicio);
    const fechaFin = new Date(cuestionario.fecha_fin);
    
    if (fechaInicio >= fechaFin) {
      errores_generales.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
  }

  return {
    es_valido: errores_generales.length === 0 && Object.keys(errores_preguntas).length === 0,
    errores_generales,
    errores_preguntas
  };
};

/**
 * Valida una respuesta de usuario
 */
export const validarRespuesta = (pregunta: Pregunta, respuesta: any): { esValida: boolean; error?: string } => {
  // Si la pregunta no es obligatoria y no hay respuesta, es válida
  if (!pregunta.obligatoria && (respuesta === undefined || respuesta === '' || respuesta === null)) {
    return { esValida: true };
  }

  // Si la pregunta es obligatoria, debe tener respuesta
  if (pregunta.obligatoria && (respuesta === undefined || respuesta === '' || respuesta === null)) {
    return { esValida: false, error: 'Esta pregunta es obligatoria' };
  }

  // Validaciones específicas por tipo
  switch (pregunta.tipo) {
    case 'abierta':
      if (typeof respuesta !== 'string') {
        return { esValida: false, error: 'La respuesta debe ser texto' };
      }
      if (pregunta.configuracion.longitud_minima && respuesta.length < pregunta.configuracion.longitud_minima) {
        return { esValida: false, error: `Mínimo ${pregunta.configuracion.longitud_minima} caracteres` };
      }
      if (pregunta.configuracion.limite_caracteres && respuesta.length > pregunta.configuracion.limite_caracteres) {
        return { esValida: false, error: `Máximo ${pregunta.configuracion.limite_caracteres} caracteres` };
      }
      break;

    case 'checkbox':
      if (!Array.isArray(respuesta)) {
        return { esValida: false, error: 'Debe seleccionar al menos una opción' };
      }
      if (pregunta.configuracion.minimo_selecciones && respuesta.length < pregunta.configuracion.minimo_selecciones) {
        return { esValida: false, error: `Debe seleccionar al menos ${pregunta.configuracion.minimo_selecciones} opciones` };
      }
      if (pregunta.configuracion.maximo_selecciones && respuesta.length > pregunta.configuracion.maximo_selecciones) {
        return { esValida: false, error: `No puede seleccionar más de ${pregunta.configuracion.maximo_selecciones} opciones` };
      }
      break;

    case 'escala_likert':
      const valor = Number(respuesta);
      if (isNaN(valor) || valor < 1 || valor > (pregunta.configuracion.puntos_escala || 5)) {
        return { esValida: false, error: 'Valor de escala inválido' };
      }
      break;

    case 'opcion_multiple':
    case 'select':
    case 'radio_button':
    case 'verdadero_falso':
      if (!respuesta) {
        return { esValida: false, error: 'Debe seleccionar una opción' };
      }
      break;
  }

  return { esValida: true };
};

/**
 * Función utilitaria para obtener el tipo de pregunta por defecto
 */
export const getTipoPreguntaPorDefecto = (): TipoPregunta => 'abierta';

/**
 * Función para generar configuración por defecto según el tipo de pregunta
 */
export const getConfiguracionPorDefecto = (tipo: TipoPregunta) => {
  switch (tipo) {
    case 'abierta':
      return { limite_caracteres: 500 };
    case 'opcion_multiple':
      return { opciones: ['Opción 1', 'Opción 2'], seleccion_multiple: false };
    case 'select':
      return { opciones: ['Opción 1', 'Opción 2'] };
    case 'checkbox':
      return { opciones: ['Opción 1', 'Opción 2'], minimo_selecciones: 1 };
    case 'radio_button':
      return { opciones: ['Opción 1', 'Opción 2'] };
    case 'escala_likert':
      return { 
        puntos_escala: 5, 
        etiqueta_minima: 'Muy en desacuerdo', 
        etiqueta_maxima: 'Muy de acuerdo',
        mostrar_numeros: true 
      };
    case 'verdadero_falso':
      return {};
    default:
      return {};
  }
};
