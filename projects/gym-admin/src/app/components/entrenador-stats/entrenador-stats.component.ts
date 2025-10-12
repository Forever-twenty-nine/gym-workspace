import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MensajeService,
  RutinaService,
  EjercicioService,
  InvitacionService,
  EntrenadorService,
  Rol
} from 'gym-library';

@Component({
  selector: 'app-entrenador-stats',
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <!-- Estadísticas de Mensajes -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Mensajes</p>
            <p class="text-2xl font-bold">{{ totalMensajes() }}</p>
          </div>
          <div class="text-3xl">💬</div>
        </div>
      </div>

      <!-- Estadísticas de Rutinas -->
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Rutinas</p>
            <p class="text-2xl font-bold">{{ totalRutinas() }}</p>
          </div>
          <div class="text-3xl">📋</div>
        </div>
      </div>

      <!-- Estadísticas de Ejercicios -->
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Ejercicios</p>
            <p class="text-2xl font-bold">{{ totalEjercicios() }}</p>
          </div>
          <div class="text-3xl">🏋️</div>
        </div>
      </div>

      <!-- Estadísticas de Invitaciones -->
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Invitaciones</p>
            <p class="text-2xl font-bold">{{ totalInvitaciones() }}</p>
          </div>
          <div class="text-3xl">📨</div>
        </div>
      </div>
    </div>
  `
})
export class EntrenadorStatsComponent {
  private mensajeService = inject(MensajeService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private invitacionService = inject(InvitacionService);
  private entrenadorService = inject(EntrenadorService);

  // Lista de IDs de entrenadores para filtrar
  private entrenadorIds = computed(() => 
    this.entrenadorService.entrenadores().map(e => e.id)
  );

  totalMensajes = computed(() => {
    return this.mensajeService.mensajes().filter(m => m.remitenteTipo === Rol.ENTRENADOR).length;
  });

  totalRutinas = computed(() => {
    const ids = this.entrenadorIds();
    return this.rutinaService.rutinas().filter(r => 
      r.creadorTipo === Rol.ENTRENADOR || ids.includes(r.creadorId || '')
    ).length;
  });

  totalEjercicios = computed(() => {
    const ids = this.entrenadorIds();
    return this.ejercicioService.ejercicios().filter(e => 
      e.creadorTipo === Rol.ENTRENADOR || ids.includes(e.creadorId || '')
    ).length;
  });

  totalInvitaciones = computed(() => {
    return this.invitacionService.invitaciones().length;
  });
}