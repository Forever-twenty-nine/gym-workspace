import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para formatear y mostrar datos
 * Elimina la duplicación de funciones helper en componentes
 */
@Injectable({
  providedIn: 'root'
})
export class DisplayHelperService {
  
  /**
   * Obtiene el Material Icon y texto para un tipo de notificación
   */
  getTipoNotificacionDisplay(tipo: string): string {
    const tipoMap: Record<string, string> = {
      'rutina_asignada': '<span class="material-icons text-base align-text-bottom mr-1">assignment</span> Rutina',
      'mensaje_nuevo': '<span class="material-icons text-base align-text-bottom mr-1">chat</span> Mensaje',
      'invitacion': '<span class="material-icons text-base align-text-bottom mr-1">mail</span> Invitación',
      'ejercicio_completado': '<span class="material-icons text-base align-text-bottom mr-1">check_circle</span> Ejercicio',
      'sesion_programada': '<span class="material-icons text-base align-text-bottom mr-1">event</span> Sesión',
      'info': '<span class="material-icons text-base align-text-bottom mr-1">info</span> Info'
    };
    return tipoMap[tipo] || tipoMap['info'];
  }

  /**
   * Obtiene el Material Icon y texto para un estado de invitación
   */
  getEstadoInvitacionDisplay(estado: string): string {
    const estadoMap: Record<string, string> = {
      'pendiente': '<span class="material-icons text-base align-text-bottom mr-1">schedule</span> Pendiente',
      'aceptada': '<span class="material-icons text-base align-text-bottom mr-1">check_circle</span> Aceptada',
      'rechazada': '<span class="material-icons text-base align-text-bottom mr-1">cancel</span> Rechazada'
    };
    return estadoMap[estado] || estadoMap['pendiente'];
  }

  /**
   * Obtiene el Material Icon y texto para una franja horaria
   */
  getFranjaHorariaDisplay(franja?: string): string {
    if (!franja) {
      return '<span class="material-icons text-base align-text-bottom mr-1">person</span> General';
    }

    const tipoMap: Record<string, string> = {
      'mañana': '<span class="material-icons text-base align-text-bottom mr-1">light_mode</span> Mañana',
      'tarde': '<span class="material-icons text-base align-text-bottom mr-1">wb_twilight</span> Tarde',
      'noche': '<span class="material-icons text-base align-text-bottom mr-1">dark_mode</span> Noche'
    };
    return tipoMap[franja] || tipoMap['mañana'];
  }

  /**
   * Genera un título descriptivo para un mensaje según su tipo
   */
  getTituloMensaje(tipo: string): string {
    const tituloMap: Record<string, string> = {
      'texto': 'Texto',
      'imagen': 'Imagen compartida',
      'video': 'Video compartido',
      'audio': 'Audio compartido'
    };
    return tituloMap[tipo] || 'Mensaje';
  }
}
