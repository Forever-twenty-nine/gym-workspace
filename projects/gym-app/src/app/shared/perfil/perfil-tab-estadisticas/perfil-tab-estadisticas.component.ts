import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { PerfilStatsTeaserComponent } from './components/perfil-stats-teaser/perfil-stats-teaser.component';
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';
import { EntrenadorStatsComponent } from './components/entrenador-stats/entrenador-stats.component';
import { GimnasioStatsComponent } from './components/gimnasio-stats/gimnasio-stats.component';
import { User as LibraryUser, Plan } from 'gym-library';
import { PerfilEstadisticasService } from '../../../core/services/perfil-estadisticas.service';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-perfil-tab-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner,
    PerfilStatsTeaserComponent,
    ProgresoEstadisticasComponent,
    EntrenadorStatsComponent,
    GimnasioStatsComponent
  ],
  templateUrl: './perfil-tab-estadisticas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabEstadisticasComponent {
  user = input.required<User>();
  viewPlansClick = output<void>();

  private readonly perfilEstadisticasService = inject(PerfilEstadisticasService);

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  // 📊 Stats por rol — solo se computan las del rol correspondiente
  readonly estadisticasEntrenado = computed(() =>
    this.user().role === 'entrenado'
      ? this.perfilEstadisticasService.getEstadisticasGenerales(this.user())()
      : null
  );

  readonly historialSesiones = computed(() =>
    this.user().role === 'entrenado'
      ? this.perfilEstadisticasService.getHistorialSesiones(this.user())()
      : []
  );

  readonly dbEstadisticas = computed(() =>
    this.user().role === 'entrenado'
      ? this.perfilEstadisticasService.getDbEstadisticas(this.user())()
      : null
  );

  readonly estadisticasEntrenador = computed(() =>
    this.user().role === 'entrenador'
      ? this.perfilEstadisticasService.getEstadisticasEntrenador(this.user())()
      : null
  );

  readonly estadisticasGimnasio = computed(() =>
    this.user().role === 'gimnasio'
      ? this.perfilEstadisticasService.getEstadisticasGimnasio(this.user())()
      : null
  );
}