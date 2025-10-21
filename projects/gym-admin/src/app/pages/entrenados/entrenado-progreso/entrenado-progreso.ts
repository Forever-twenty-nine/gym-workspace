import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SesionRutinaService, RutinaService, Rutina, EstadisticasEntrenadoService } from 'gym-library';

@Component({
  selector: 'app-entrenado-progreso',
  imports: [DatePipe, RouterModule],
  templateUrl: './entrenado-progreso.html',
})
export class EntrenadoProgreso {
  private readonly route = inject(ActivatedRoute);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly estadisticasService = inject(EstadisticasEntrenadoService);
  private readonly rutinaService = inject(RutinaService);

  readonly entrenadoId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly estadisticas = computed(() => {
    const id = this.entrenadoId();
    return this.estadisticasService.getEstadisticas(id)();
  });

  readonly rutinasCompletadasConNombre = computed(() => {
    const id = this.entrenadoId();
    // Buscar todas las sesiones completadas de este entrenado
    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(id)().filter(s => s.completada);
    const rutinas = this.rutinaService.rutinas();
    return sesiones.map((sesion: any) => {
      const rutina = rutinas.find((r: any) => r.id === sesion.rutinaId);
      return {
        ...sesion,
        nombre: rutina?.nombre || 'Sin nombre',
        descripcion: rutina?.descripcion || '',
      };
    });
  });
}
