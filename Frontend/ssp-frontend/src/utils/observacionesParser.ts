/**
 * Utilidades para parsear y construir el campo observaciones con información específica por rol.
 * 
 * Formato esperado en observaciones:
 * "Campo: Valor | Campo: Valor | Otras observaciones"
 */

export interface CamposAlumno {
  programaEducativo?: string;
  grupo?: string;
}

export interface CamposDocente {
  facultad?: string;
  materiasAsignadas?: string;
  carrerasAsignadas?: string;
}

export interface CamposPersonal {
  departamento?: string;
  puesto?: string;
}

export type CamposEspecificos = CamposAlumno | CamposDocente | CamposPersonal;

/**
 * Parsea el campo observaciones y extrae los campos específicos según el rol.
 * 
 * @param observaciones - String con las observaciones del usuario
 * @param rol - Rol del usuario (alumno, docente, personal)
 * @returns Objeto con los campos específicos extraídos y las observaciones restantes
 */
export function parseObservaciones(
  observaciones: string | null | undefined,
  rol: 'alumno' | 'docente' | 'personal'
): { campos: CamposEspecificos; observacionesRestantes: string } {
  if (!observaciones) {
    return { campos: {}, observacionesRestantes: '' };
  }

  const partes = observaciones.split('|').map(p => p.trim());
  const campos: any = {};
  const observacionesRestantes: string[] = [];

  for (const parte of partes) {
    const match = parte.match(/^([^:]+):\s*(.+)$/);
    
    if (match) {
      const [, clave, valor] = match;
      const claveNormalizada = clave.trim().toLowerCase();

      // Reason: Mapear claves a campos específicos según el rol
      if (rol === 'alumno') {
        if (claveNormalizada.includes('programa')) {
          campos.programaEducativo = valor.trim();
        } else if (claveNormalizada.includes('grupo')) {
          campos.grupo = valor.trim();
        } else {
          observacionesRestantes.push(parte);
        }
      } else if (rol === 'docente') {
        if (claveNormalizada.includes('facultad')) {
          campos.facultad = valor.trim();
        } else if (claveNormalizada.includes('materias')) {
          campos.materiasAsignadas = valor.trim();
        } else if (claveNormalizada.includes('carreras')) {
          campos.carrerasAsignadas = valor.trim();
        } else {
          observacionesRestantes.push(parte);
        }
      } else if (rol === 'personal') {
        if (claveNormalizada.includes('departamento')) {
          campos.departamento = valor.trim();
        } else if (claveNormalizada.includes('puesto')) {
          campos.puesto = valor.trim();
        } else {
          observacionesRestantes.push(parte);
        }
      }
    } else {
      // Reason: Si no tiene formato "Clave: Valor", es una observación general
      observacionesRestantes.push(parte);
    }
  }

  return {
    campos,
    observacionesRestantes: observacionesRestantes.join(' | ')
  };
}

/**
 * Construye el campo observaciones combinando campos específicos y observaciones generales.
 * 
 * @param campos - Campos específicos según el rol
 * @param rol - Rol del usuario (alumno, docente, personal)
 * @param observacionesGenerales - Observaciones adicionales del usuario
 * @returns String formateado para el campo observaciones
 */
export function buildObservaciones(
  campos: CamposEspecificos,
  rol: 'alumno' | 'docente' | 'personal',
  observacionesGenerales?: string
): string {
  const partes: string[] = [];

  // Reason: Construir partes específicas según el rol
  if (rol === 'alumno') {
    const camposAlumno = campos as CamposAlumno;
    if (camposAlumno.programaEducativo) {
      partes.push(`Programa Educativo: ${camposAlumno.programaEducativo}`);
    }
    if (camposAlumno.grupo) {
      partes.push(`Grupo: ${camposAlumno.grupo}`);
    }
  } else if (rol === 'docente') {
    const camposDocente = campos as CamposDocente;
    if (camposDocente.facultad) {
      partes.push(`Facultad: ${camposDocente.facultad}`);
    }
    if (camposDocente.materiasAsignadas) {
      partes.push(`Materias: ${camposDocente.materiasAsignadas}`);
    }
    if (camposDocente.carrerasAsignadas) {
      partes.push(`Carreras: ${camposDocente.carrerasAsignadas}`);
    }
  } else if (rol === 'personal') {
    const camposPersonal = campos as CamposPersonal;
    if (camposPersonal.departamento) {
      partes.push(`Departamento: ${camposPersonal.departamento}`);
    }
    if (camposPersonal.puesto) {
      partes.push(`Puesto: ${camposPersonal.puesto}`);
    }
  }

  // Reason: Agregar observaciones generales al final
  if (observacionesGenerales && observacionesGenerales.trim()) {
    partes.push(observacionesGenerales.trim());
  }

  return partes.join(' | ');
}

