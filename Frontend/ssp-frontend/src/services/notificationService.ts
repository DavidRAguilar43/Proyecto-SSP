/**
 * Servicio para manejar el estado de notificaciones y cuestionarios leídos
 */

interface CuestionarioLeido {
  id_cuestionario: number;
  fecha_leido: string;
  usuario_id: number;
}

class NotificationService {
  private readonly STORAGE_KEY = 'cuestionarios_leidos';

  /**
   * Obtiene la lista de cuestionarios leídos del localStorage
   */
  private getCuestionariosLeidos(): CuestionarioLeido[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al leer cuestionarios leídos del localStorage:', error);
      return [];
    }
  }

  /**
   * Guarda la lista de cuestionarios leídos en localStorage
   */
  private setCuestionariosLeidos(cuestionarios: CuestionarioLeido[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cuestionarios));
    } catch (error) {
      console.error('Error al guardar cuestionarios leídos en localStorage:', error);
    }
  }

  /**
   * Marca un cuestionario como leído
   */
  marcarComoLeido(idCuestionario: number, usuarioId: number): void {
    const cuestionariosLeidos = this.getCuestionariosLeidos();
    
    // Verificar si ya está marcado como leído
    const yaLeido = cuestionariosLeidos.some(
      c => c.id_cuestionario === idCuestionario && c.usuario_id === usuarioId
    );

    if (!yaLeido) {
      const nuevoCuestionario: CuestionarioLeido = {
        id_cuestionario: idCuestionario,
        fecha_leido: new Date().toISOString(),
        usuario_id: usuarioId
      };

      cuestionariosLeidos.push(nuevoCuestionario);
      this.setCuestionariosLeidos(cuestionariosLeidos);
    }
  }

  /**
   * Verifica si un cuestionario ha sido leído
   */
  estaLeido(idCuestionario: number, usuarioId: number): boolean {
    const cuestionariosLeidos = this.getCuestionariosLeidos();
    return cuestionariosLeidos.some(
      c => c.id_cuestionario === idCuestionario && c.usuario_id === usuarioId
    );
  }

  /**
   * Obtiene la lista de IDs de cuestionarios leídos para un usuario
   */
  getCuestionariosLeidosPorUsuario(usuarioId: number): number[] {
    const cuestionariosLeidos = this.getCuestionariosLeidos();
    return cuestionariosLeidos
      .filter(c => c.usuario_id === usuarioId)
      .map(c => c.id_cuestionario);
  }

  /**
   * Calcula cuántos cuestionarios no han sido leídos
   */
  contarNoLeidos(cuestionarios: any[], usuarioId: number): number {
    const leidosIds = this.getCuestionariosLeidosPorUsuario(usuarioId);
    return cuestionarios.filter(c => !leidosIds.includes(c.id_cuestionario)).length;
  }

  /**
   * Limpia los cuestionarios leídos para un usuario específico
   */
  limpiarCuestionariosUsuario(usuarioId: number): void {
    const cuestionariosLeidos = this.getCuestionariosLeidos();
    const filtrados = cuestionariosLeidos.filter(c => c.usuario_id !== usuarioId);
    this.setCuestionariosLeidos(filtrados);
  }

  /**
   * Limpia cuestionarios leídos antiguos (más de 30 días)
   */
  limpiarCuestionariosAntiguos(): void {
    const cuestionariosLeidos = this.getCuestionariosLeidos();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const filtrados = cuestionariosLeidos.filter(c => {
      const fechaLeido = new Date(c.fecha_leido);
      return fechaLeido > fechaLimite;
    });

    this.setCuestionariosLeidos(filtrados);
  }

  /**
   * Obtiene estadísticas de lectura
   */
  getEstadisticas(usuarioId: number): {
    totalLeidos: number;
    fechaUltimaLectura: string | null;
  } {
    const cuestionariosLeidos = this.getCuestionariosLeidos()
      .filter(c => c.usuario_id === usuarioId);

    const fechaUltimaLectura = cuestionariosLeidos.length > 0
      ? cuestionariosLeidos
          .sort((a, b) => new Date(b.fecha_leido).getTime() - new Date(a.fecha_leido).getTime())[0]
          .fecha_leido
      : null;

    return {
      totalLeidos: cuestionariosLeidos.length,
      fechaUltimaLectura
    };
  }
}

// Exportar una instancia singleton del servicio
export const notificationService = new NotificationService();

// Exportar el tipo para uso en otros componentes
export type { CuestionarioLeido };
