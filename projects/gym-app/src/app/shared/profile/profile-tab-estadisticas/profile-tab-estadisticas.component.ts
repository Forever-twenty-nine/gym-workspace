import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { ProfileStatsTeaserComponent } from './components/profile-stats-teaser/profile-stats-teaser.component';
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';
import { EntrenadorStatsComponent } from './components/entrenador-stats/entrenador-stats.component';
import { GimnasioStatsComponent } from './components/gimnasio-stats/gimnasio-stats.component';
import { User as LibraryUser, Plan } from 'gym-library';
import { ProfileStatsService } from '../../../core/services/profile-stats.service';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-profile-tab-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner,
    ProfileStatsTeaserComponent,
    ProgresoEstadisticasComponent,
    EntrenadorStatsComponent,
    GimnasioStatsComponent
  ],
  templateUrl: './profile-tab-estadisticas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileTabEstadisticasComponent {
  user = input.required<User>();
  viewPlansClick = output<void>();

  private readonly profileStatsService = inject(ProfileStatsService);

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  // 📊 Stats por rol — solo se computan las del rol correspondiente
  readonly estadisticasEntrenado = computed(() =>
    this.user().role === 'entrenado'
      ? this.profileStatsService.getEstadisticasGenerales(this.user())()
      : null
  );

  readonly historialSesiones = computed(() =>
    this.user().role === 'entrenado'
      ? this.profileStatsService.getHistorialSesiones(this.user())()
      : []
  );

  readonly dbEstadisticas = computed(() =>
    this.user().role === 'entrenado'
      ? this.profileStatsService.getDbEstadisticas(this.user())()
      : null
  );

  readonly estadisticasEntrenador = computed(() =>
    this.user().role === 'entrenador'
      ? this.profileStatsService.getEstadisticasEntrenador(this.user())()
      : null
  );

  readonly estadisticasGimnasio = computed(() =>
    this.user().role === 'gimnasio'
      ? this.profileStatsService.getEstadisticasGimnasio(this.user())()
      : null
  );
}