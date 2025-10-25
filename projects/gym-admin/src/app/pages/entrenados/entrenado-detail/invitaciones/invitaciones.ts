import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invitacion } from 'gym-library';

@Component({
  selector: 'app-invitaciones-modal',
  imports: [CommonModule],
  templateUrl: './invitaciones.html',
})
export class InvitacionesModalComponent {

  // Inputs
  invitacion = input.required<Invitacion | null>();
  open = input.required<boolean>();

  // Outputs
  openChange = output<boolean>();
  aceptarInvitacion = output<string>();
  rechazarInvitacion = output<string>();

  // Computed para verificar si hay invitación válida
  hasInvitacion = computed(() => !!this.invitacion());

  cerrarModal() {
    this.openChange.emit(false);
  }

  onAceptar() {
    const inv = this.invitacion();
    if (inv?.id) {
      this.aceptarInvitacion.emit(inv.id);
      this.cerrarModal();
    }
  }

  onRechazar() {
    const inv = this.invitacion();
    if (inv?.id) {
      this.rechazarInvitacion.emit(inv.id);
      this.cerrarModal();
    }
  }

  formatearFecha(timestamp: any): string {
    if (!timestamp) return 'Fecha no disponible';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  }
}