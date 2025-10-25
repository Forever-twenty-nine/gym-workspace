import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invitacion } from 'gym-library';

@Component({
  selector: 'app-invitaciones',
  imports: [CommonModule],
  templateUrl: './invitaciones.html',
})
export class InvitacionesComponent {

  // Inputs
  invitacionesPendientes = input.required<Invitacion[]>();
  mostrarInvitaciones = input.required<boolean>();

  // Outputs
  toggleMostrarInvitaciones = output<void>();
  aceptarInvitacionEvent = output<string>(); // Emite el ID de la invitación
  rechazarInvitacionEvent = output<string>(); // Emite el ID de la invitación

  // Método para formatear fecha
  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Handlers para emitir eventos
  onToggleMostrarInvitaciones() {
    this.toggleMostrarInvitaciones.emit();
  }

  onAceptarInvitacion(invitacionId: string) {
    this.aceptarInvitacionEvent.emit(invitacionId);
  }

  onRechazarInvitacion(invitacionId: string) {
    this.rechazarInvitacionEvent.emit(invitacionId);
  }
}