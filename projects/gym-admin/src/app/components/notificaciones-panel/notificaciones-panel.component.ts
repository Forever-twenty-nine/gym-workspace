import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notificacion, TipoNotificacion } from 'gym-library';

@Component({
  selector: 'app-notificaciones-panel',
  imports: [CommonModule],
  templateUrl: './notificaciones-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificacionesPanelComponent {
  // Inputs
  readonly notificaciones = input.required<Notificacion[]>();
  
  // Outputs
  readonly marcarTodasComoLeidas = output<void>();
  readonly aceptarInvitacion = output<string>();
  readonly rechazarInvitacion = output<string>();
  readonly verDetallesInvitacion = output<string>(); // ID de la invitación para abrir modal

  // Computed
  readonly notificacionesNoLeidas = computed(() => 
    this.notificaciones().filter(n => !n.leida).length
  );

  /**
   * Obtiene el icono SVG según el tipo de notificación
   */
  getIconoNotificacion(tipo: string): string {
    switch (tipo) {
      case TipoNotificacion.RUTINA_ASIGNADA:
        return 'rutina';
      case TipoNotificacion.INVITACION_PENDIENTE:
      case TipoNotificacion.INVITACION_ACEPTADA:
      case TipoNotificacion.INVITACION_RECHAZADA:
        return 'invitacion';
      case TipoNotificacion.MENSAJE_NUEVO:
        return 'mensaje';
      case TipoNotificacion.LOGRO:
        return 'logro';
      default:
        return 'info';
    }
  }

  /**
   * Obtiene el color del icono según el tipo
   */
  getColorIcono(tipo: string): string {
    switch (tipo) {
      case TipoNotificacion.RUTINA_ASIGNADA:
        return 'text-green-500';
      case TipoNotificacion.INVITACION_PENDIENTE:
        return 'text-blue-500';
      case TipoNotificacion.INVITACION_ACEPTADA:
        return 'text-green-500';
      case TipoNotificacion.INVITACION_RECHAZADA:
        return 'text-red-500';
      case TipoNotificacion.MENSAJE_NUEVO:
        return 'text-purple-500';
      case TipoNotificacion.LOGRO:
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Handler para marcar todas como leídas
   */
  onMarcarTodasComoLeidas(): void {
    this.marcarTodasComoLeidas.emit();
  }

  onAceptarInvitacion(notificacion: Notificacion): void {
    const invitacionId = notificacion.datos?.['invitacionId'] as string | undefined;
    if (invitacionId) this.aceptarInvitacion.emit(invitacionId);
  }

  onRechazarInvitacion(notificacion: Notificacion): void {
    const invitacionId = notificacion.datos?.['invitacionId'] as string | undefined;
    if (invitacionId) this.rechazarInvitacion.emit(invitacionId);
  }

  onVerDetallesInvitacion(notificacion: Notificacion): void {
    const invitacionId = notificacion.datos?.['invitacionId'] as string | undefined;
    if (invitacionId) this.verDetallesInvitacion.emit(invitacionId);
  }
}
