import { Component, input, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenadoService, UserService, EntrenadorService } from 'gym-library';

@Component({
  selector: 'app-entrenado-modal',
  imports: [
    CommonModule
  ],
  templateUrl: './entrenado-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoModalComponent {
  // Servicios inyectados
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly entrenadorService = inject(EntrenadorService);

  // Inputs
  isOpen = input<boolean>(false);
  entrenadoId = input<string>('');
  entrenadorId = input<string>('');

  // Outputs
  close = output<void>();

  // Computed para obtener el entrenado con información de usuario
  readonly entrenado = computed(() => {
    const id = this.entrenadoId();
    if (!id) return null;

    const entrenado = this.entrenadoService.entrenados().find(e => e.id === id);
    if (!entrenado) return null;

    const usuario = this.userService.users().find(u => u.uid === entrenado.id);
    return {
      ...entrenado,
      displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
      email: usuario?.email || '',
      plan: usuario?.plan || 'free'
    };
  });

  // Método para cerrar el modal
  onClose() {
    this.close.emit();
  }

  // Computed para obtener las rutinas del entrenador
  readonly rutinasEntrenador = computed(() => {
    const entrenadorId = this.entrenadorId();
    if (!entrenadorId) return [];
    return this.entrenadorService.getRutinasByEntrenador(entrenadorId)();
  });

  // Computed para separar rutinas asignadas y disponibles
  readonly rutinasAsignadas = computed(() => {
    const entrenado = this.entrenado();
    const rutinasEntrenador = this.rutinasEntrenador();
    if (!entrenado || !rutinasEntrenador) return [];

    const asignadasIds = [...new Set(entrenado.rutinasAsignadas || [])]; // Eliminar duplicados
    return rutinasEntrenador.filter(rutina => asignadasIds.includes(rutina.id));
  });

  readonly rutinasDisponibles = computed(() => {
    const entrenado = this.entrenado();
    const rutinasEntrenador = this.rutinasEntrenador();
    if (!rutinasEntrenador) return [];

    const asignadasIds = [...new Set(entrenado?.rutinasAsignadas || [])]; // Eliminar duplicados
    return rutinasEntrenador.filter(rutina => !asignadasIds.includes(rutina.id));
  });

  // Método para verificar si una rutina está asignada al entrenado
  isRutinaAsignada(rutinaId: string): boolean {
    const entrenado = this.entrenado();
    return entrenado?.rutinasAsignadas?.includes(rutinaId) || false;
  }

  // Método para asignar rutina
  async asignarRutina(rutinaId: string) {
    const entrenado = this.entrenado();
    if (!entrenado) return;

    try {
      await this.entrenadoService.asignarRutina(entrenado.id, rutinaId);
      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error al asignar rutina:', error);
    }
  }

  // Método para desasignar rutina
  async desasignarRutina(rutinaId: string) {
    const entrenado = this.entrenado();
    if (!entrenado) return;

    try {
      await this.entrenadoService.desasignarRutina(entrenado.id, rutinaId);
      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error al desasignar rutina:', error);
    }
  }
}