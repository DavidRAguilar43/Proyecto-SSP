/**
 * Servicio para gestionar el estado de lectura de notificaciones de citas
 * Utiliza localStorage para persistir qué notificaciones han sido vistas por cada usuario
 */

interface NotificacionCitaLeida {
  id_cita: number;
  fecha_leido: string;
  usuario_id: number;
}

class CitasNotificationService {
  private readonly STORAGE_KEY = 'citas_notificaciones_leidas';

  /**
   * Obtiene la lista de notificaciones de citas leídas del localStorage
   */
  private getNotificacionesLeidas(): NotificacionCitaLeida[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al leer notificaciones leídas del localStorage:', error);
      return [];
    }
  }

  /**
   * Guarda la lista de notificaciones leídas en localStorage
   */
  private setNotificacionesLeidas(notificaciones: NotificacionCitaLeida[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notificaciones));
    } catch (error) {
      console.error('Error al guardar notificaciones leídas en localStorage:', error);
    }
  }

  /**
   * Marca una notificación de cita como leída
   */
  marcarComoLeida(idCita: number, usuarioId: number): void {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    
    // Verificar si ya está marcada como leída
    const yaLeida = notificacionesLeidas.some(
      n => n.id_cita === idCita && n.usuario_id === usuarioId
    );

    if (!yaLeida) {
      const nuevaNotificacion: NotificacionCitaLeida = {
        id_cita: idCita,
        fecha_leido: new Date().toISOString(),
        usuario_id: usuarioId
      };

      notificacionesLeidas.push(nuevaNotificacion);
      this.setNotificacionesLeidas(notificacionesLeidas);
    }
  }

  /**
   * Marca todas las notificaciones de citas como leídas para un usuario
   */
  marcarTodasComoLeidas(notificaciones: any[], usuarioId: number): void {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    let cambios = false;

    notificaciones.forEach(notif => {
      const yaLeida = notificacionesLeidas.some(
        n => n.id_cita === notif.id_cita && n.usuario_id === usuarioId
      );

      if (!yaLeida) {
        notificacionesLeidas.push({
          id_cita: notif.id_cita,
          fecha_leido: new Date().toISOString(),
          usuario_id: usuarioId
        });
        cambios = true;
      }
    });

    if (cambios) {
      this.setNotificacionesLeidas(notificacionesLeidas);
    }
  }

  /**
   * Verifica si una notificación específica está marcada como leída
   */
  estaLeida(idCita: number, usuarioId: number): boolean {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    return notificacionesLeidas.some(
      n => n.id_cita === idCita && n.usuario_id === usuarioId
    );
  }

  /**
   * Obtiene los IDs de las notificaciones leídas para un usuario específico
   */
  getNotificacionesLeidasPorUsuario(usuarioId: number): number[] {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    return notificacionesLeidas
      .filter(n => n.usuario_id === usuarioId)
      .map(n => n.id_cita);
  }

  /**
   * Calcula cuántas notificaciones no han sido leídas
   */
  contarNoLeidas(notificaciones: any[], usuarioId: number): number {
    const leidasIds = this.getNotificacionesLeidasPorUsuario(usuarioId);
    return notificaciones.filter(n => !leidasIds.includes(n.id_cita)).length;
  }

  /**
   * Limpia las notificaciones leídas para un usuario específico
   */
  limpiarNotificacionesUsuario(usuarioId: number): void {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    const filtradas = notificacionesLeidas.filter(n => n.usuario_id !== usuarioId);
    this.setNotificacionesLeidas(filtradas);
  }

  /**
   * Limpia notificaciones antiguas (más de 90 días)
   */
  limpiarNotificacionesAntiguas(): void {
    const notificacionesLeidas = this.getNotificacionesLeidas();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 90);

    const filtradas = notificacionesLeidas.filter(n => {
      const fechaLeido = new Date(n.fecha_leido);
      return fechaLeido > fechaLimite;
    });

    if (filtradas.length !== notificacionesLeidas.length) {
      this.setNotificacionesLeidas(filtradas);
    }
  }

  /**
   * Obtiene estadísticas de lectura para un usuario
   */
  getEstadisticas(usuarioId: number): {
    totalLeidas: number;
    fechaUltimaLectura: string | null;
  } {
    const notificacionesLeidas = this.getNotificacionesLeidas()
      .filter(n => n.usuario_id === usuarioId);

    const fechaUltimaLectura = notificacionesLeidas.length > 0
      ? notificacionesLeidas
          .sort((a, b) => new Date(b.fecha_leido).getTime() - new Date(a.fecha_leido).getTime())[0]
          .fecha_leido
      : null;

    return {
      totalLeidas: notificacionesLeidas.length,
      fechaUltimaLectura
    };
  }
}

// Exportar una instancia singleton del servicio
export const citasNotificationService = new CitasNotificationService();

// Exportar el tipo para uso en otros componentes
export type { NotificacionCitaLeida };
