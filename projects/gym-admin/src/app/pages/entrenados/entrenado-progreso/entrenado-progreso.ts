import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProgresoService, RutinaService, Rutina } from 'gym-library';

@Component({
  selector: 'app-entrenado-progreso',
  imports: [DatePipe, RouterModule],
  templateUrl: './entrenado-progreso.html',
})
export class EntrenadoProgreso {
  private readonly route = inject(ActivatedRoute);
  private readonly progresoService = inject(ProgresoService);
  private readonly rutinaService = inject(RutinaService);

  readonly entrenadoId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly estadisticas = computed(() => {
    const id = this.entrenadoId();
    return this.progresoService.getEstadisticas(id)();
  });

  readonly rutinasCompletadasConNombre = computed(() => {
    const id = this.entrenadoId();
    const completadas = this.progresoService.getRutinasCompletadas(id)();
    const rutinas = this.rutinaService.rutinas();
    return completadas.map(progreso => {
      const rutina = rutinas.find(r => r.id === progreso.rutinaId);
      return {
        ...progreso,
        nombre: rutina?.nombre || 'Sin nombre',
        descripcion: rutina?.descripcion || '',
      };
    });
  });
}
