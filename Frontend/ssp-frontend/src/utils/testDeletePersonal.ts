/**
 * Script de prueba para eliminar personal/docentes desde la consola del navegador
 * Úsalo para debuggear problemas específicos con eliminación de staff
 */

import { personasService } from '@/services/api';
import { logAuthDiagnostic, enableRequestDebugging } from './authDiagnostic';

/**
 * Función para probar eliminación de personal específico
 * Ejecuta desde la consola del navegador: testDeletePersonal(7)
 */
export const testDeletePersonal = async (personaId: number) => {
  console.group(`🧪 PRUEBA DE ELIMINACIÓN - PERSONA ID: ${personaId}`);
  
  try {
    // 1. Diagnóstico inicial
    console.log('📋 1. Ejecutando diagnóstico de autenticación...');
    const diagnostic = await logAuthDiagnostic();
    
    if (!diagnostic.hasToken) {
      console.error('❌ No hay token de autenticación');
      return;
    }
    
    if (diagnostic.tokenExpired) {
      console.error('❌ Token expirado');
      return;
    }
    
    // 2. Obtener información de la persona
    console.log('📋 2. Obteniendo información de la persona...');
    let persona;
    try {
      persona = await personasService.getById(personaId);
      console.log('👤 Persona encontrada:', persona);
    } catch (error: any) {
      console.error('❌ Error al obtener persona:', error);
      return;
    }
    
    // 3. Activar debugging detallado
    console.log('📋 3. Activando debugging de requests...');
    const disableDebugging = enableRequestDebugging();
    
    // 4. Intentar eliminación
    console.log('📋 4. Intentando eliminación...');
    try {
      await personasService.delete(personaId);
      console.log('✅ ELIMINACIÓN EXITOSA');
    } catch (error: any) {
      console.error('❌ ERROR EN ELIMINACIÓN:', error);
      
      // Análisis detallado del error
      console.group('🔍 ANÁLISIS DETALLADO DEL ERROR');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Data:', error.response?.data);
      console.log('Headers:', error.response?.headers);
      console.log('Config:', error.config);
      console.groupEnd();
      
      // Sugerencias basadas en el error
      if (error.response?.status === 403) {
        console.warn('💡 SUGERENCIA: Error 403 - Verificar permisos de usuario');
        console.log('   - ¿El usuario actual tiene rol "admin"?');
        console.log('   - ¿El token contiene los permisos correctos?');
      } else if (error.response?.status === 401) {
        console.warn('💡 SUGERENCIA: Error 401 - Problema de autenticación');
        console.log('   - Token inválido o expirado');
        console.log('   - Cerrar sesión y volver a iniciar');
      } else if (error.response?.status === 500) {
        console.warn('💡 SUGERENCIA: Error 500 - Problema del servidor');
        console.log('   - Verificar logs del backend');
        console.log('   - Posible error en la base de datos');
      }
    } finally {
      disableDebugging();
    }
    
  } finally {
    console.groupEnd();
  }
};

/**
 * Función para probar eliminación de múltiples personas
 */
export const testBulkDeletePersonal = async (personaIds: number[]) => {
  console.group(`🧪 PRUEBA DE ELIMINACIÓN MASIVA - IDs: [${personaIds.join(', ')}]`);
  
  try {
    // Diagnóstico inicial
    const diagnostic = await logAuthDiagnostic();
    
    if (!diagnostic.hasToken || diagnostic.tokenExpired) {
      console.error('❌ Problema de autenticación');
      return;
    }
    
    // Activar debugging
    const disableDebugging = enableRequestDebugging();
    
    try {
      await personasService.bulkDelete(personaIds);
      console.log('✅ ELIMINACIÓN MASIVA EXITOSA');
    } catch (error: any) {
      console.error('❌ ERROR EN ELIMINACIÓN MASIVA:', error);
    } finally {
      disableDebugging();
    }
    
  } finally {
    console.groupEnd();
  }
};

/**
 * Función para comparar eliminación de estudiante vs personal
 */
export const compareDeletePermissions = async (estudianteId: number, personalId: number) => {
  console.group('🔄 COMPARACIÓN DE PERMISOS DE ELIMINACIÓN');
  
  const diagnostic = await logAuthDiagnostic();
  
  if (!diagnostic.hasToken || diagnostic.tokenExpired) {
    console.error('❌ Problema de autenticación');
    return;
  }
  
  const disableDebugging = enableRequestDebugging();
  
  try {
    // Probar eliminación de estudiante
    console.log('📋 Probando eliminación de ESTUDIANTE...');
    try {
      // Solo simular - obtener info sin eliminar
      const estudiante = await personasService.getById(estudianteId);
      console.log('✅ Estudiante accesible:', estudiante.correo_institucional, estudiante.rol);
    } catch (error: any) {
      console.error('❌ Error con estudiante:', error.response?.status);
    }
    
    // Probar eliminación de personal
    console.log('📋 Probando eliminación de PERSONAL...');
    try {
      const personal = await personasService.getById(personalId);
      console.log('✅ Personal accesible:', personal.correo_institucional, personal.rol);
    } catch (error: any) {
      console.error('❌ Error con personal:', error.response?.status);
    }
    
  } finally {
    disableDebugging();
    console.groupEnd();
  }
};

// Hacer las funciones disponibles globalmente para uso en consola
if (typeof window !== 'undefined') {
  (window as any).testDeletePersonal = testDeletePersonal;
  (window as any).testBulkDeletePersonal = testBulkDeletePersonal;
  (window as any).compareDeletePermissions = compareDeletePermissions;
  (window as any).logAuthDiagnostic = logAuthDiagnostic;
  (window as any).enableRequestDebugging = enableRequestDebugging;
}
