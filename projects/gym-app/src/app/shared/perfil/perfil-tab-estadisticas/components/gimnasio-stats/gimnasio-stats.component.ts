import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonText, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, fitnessOutline, trendingUpOutline, trophyOutline, schoolOutline } from 'ionicons/icons';
import { EstadisticasGeneralesGimnasio } from '../../../../../core/services/perfil-estadisticas.service';

@Component({
  selector: 'app-gimnasio-stats',
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonText, IonIcon
  ],
  templateUrl: './gimnasio-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GimnasioStatsComponent {
  stats = input.required<EstadisticasGeneralesGimnasio>();

  selectedSegment = signal<'entrenadores' | 'entrenados'>('entrenadores');

  // % por objetivo (helper)
  pctSalud = computed(() => this.pct(this.stats().distribucionObjetivo.salud));
  pctVolumen = computed(() => this.pct(this.stats().distribucionObjetivo.volumen));
  pctDefinicion = computed(() => this.pct(this.stats().distribucionObjetivo.definicion));
  pctFuerza = computed(() => this.pct(this.stats().distribucionObjetivo.fuerza));

  private pct(value: number): number {
    const tot = this.stats().distribucionObjetivo.total;
    return tot > 0 ? Math.round((value / tot) * 100) : 0;
  }

  // % por nivel (helper)
  pctNivelPrincipiante = computed(() => {
    const t = this.stats().distribucionNivel.total;
    return t > 0 ? Math.round((this.stats().distribucionNivel.principiante / t) * 100) : 0;
  });
  pctNivelIntermedio = computed(() => {
    const t = this.stats().distribucionNivel.total;
    return t > 0 ? Math.round((this.stats().distribucionNivel.intermedio / t) * 100) : 0;
  });
  pctNivelAvanzado = computed(() => {
    const t = this.stats().distribucionNivel.total;
    return t > 0 ? Math.round((this.stats().distribucionNivel.avanzado / t) * 100) : 0;
  });

  constructor() {
    addIcons({ peopleOutline, fitnessOutline, trendingUpOutline, trophyOutline, schoolOutline });
  }

  setSegment(value: 'entrenadores' | 'entrenados') {
    this.selectedSegment.set(value);
  }
}