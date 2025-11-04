/**
 * Utilidades para obtener etiquetas personalizadas según el rol del usuario
 * Centraliza la lógica de personalización de campos para diferentes roles
 */

export interface FieldLabels {
  semestre: string;
  programa: string;
  grupo: string;
}

export interface FieldHelperTexts {
  semestre: string;
  programa: string;
  grupo: string;
}

/**
 * Obtiene las etiquetas de campos personalizadas según el rol del usuario
 */
export const getFieldLabels = (rol: string): FieldLabels => {
  switch (rol) {
    case 'personal':
      return {
        semestre: 'Departamento',
        programa: 'Puesto',
        grupo: 'Área'
      };
    case 'docente':
      return {
        semestre: 'Facultad',
        programa: 'Carrera',
        grupo: 'Materias asignadas'
      };
    case 'alumno':
    default:
      return {
        semestre: 'Semestre Actual',
        programa: 'Programa Educativo',
        grupo: 'Grupo'
      };
  }
};

/**
 * Obtiene los textos de ayuda personalizados según el rol del usuario
 */
export const getFieldHelperTexts = (rol: string): FieldHelperTexts => {
  switch (rol) {
    case 'personal':
      return {
        semestre: 'Departamento al que pertenece',
        programa: 'Puesto que desempeña',
        grupo: 'Extensión o lugar de contacto'
      };
    case 'docente':
      return {
        semestre: 'Facultad donde labora',
        programa: 'Carrera que imparte',
        grupo: 'Materias que tiene asignadas'
      };
    case 'alumno':
    default:
      return {
        semestre: 'Semestre actual que cursa',
        programa: 'Programa educativo inscrito',
        grupo: 'Grupo asignado'
      };
  }
};

/**
 * Obtiene los valores formateados de los campos según el rol del usuario
 */
export const getFieldValues = (user: any, rol: string) => {
  switch (rol) {
    case 'personal':
      return {
        semestre: user.semestre ? `Departamento ${user.semestre}` : 'No especificado',
        programa: user.programas && user.programas.length > 0 
          ? user.programas[0].nombre_programa 
          : 'Pendiente de asignación',
        grupo: user.grupos && user.grupos.length > 0 
          ? user.grupos[0].nombre_grupo 
          : 'Pendiente de asignación'
      };
    case 'docente':
      return {
        semestre: user.semestre ? `Facultad ${user.semestre}` : 'No especificado',
        programa: user.programas && user.programas.length > 0 
          ? user.programas[0].nombre_programa 
          : 'Pendiente de asignación',
        grupo: user.grupos && user.grupos.length > 0 
          ? user.grupos[0].nombre_grupo 
          : 'Pendiente de asignación'
      };
    case 'alumno':
    default:
      return {
        semestre: user.semestre ? `${user.semestre}° Semestre` : 'No especificado',
        programa: user.programas && user.programas.length > 0 
          ? user.programas[0].nombre_programa 
          : 'Pendiente de asignación',
        grupo: user.grupos && user.grupos.length > 0 
          ? user.grupos[0].nombre_grupo 
          : 'Pendiente de asignación'
      };
  }
};

/**
 * Obtiene el título del perfil según el rol del usuario
 */
export const getProfileTitle = (rol: string): string => {
  switch (rol) {
    case 'personal':
      return 'Mi Perfil de Personal';
    case 'docente':
      return 'Mi Perfil Docente';
    case 'alumno':
    default:
      return 'Mi Perfil Estudiantil';
  }
};

/**
 * Obtiene la descripción del perfil según el rol del usuario
 */
export const getProfileDescription = (rol: string): string => {
  switch (rol) {
    case 'personal':
      return 'Bienvenido a tu espacio personal en el Sistema de Seguimiento Psicopedagógico';
    case 'docente':
      return 'Bienvenido a tu espacio docente en el Sistema de Seguimiento Psicopedagógico';
    case 'alumno':
    default:
      return 'Bienvenido a tu espacio personal en el Sistema de Seguimiento Psicopedagógico';
  }
};
