import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { PerfilStatsTeaserComponent } from './components/perfil-stats-teaser/perfil-stats-teaser.component';
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';
import { User as LibraryUser, SesionRutina, Plan } from 'gym-library';
import { PerfilEstadisticasService, EstadisticasGenerales } from '../../../core/services/perfil-estadisticas.service';

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
    ProgresoEstadisticasComponent
  ],
  templateUrl: './perfil-tab-estadisticas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabEstadisticasComponent {
  user = input.required<User>();
  viewPlansClick = output<void>();

  private readonly perfilEstadisticasService = inject(PerfilEstadisticasService);

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  // Derivar las señales directamente desde el nuevo servicio centralizado
  readonly estadisticasGenerales = computed(() => this.perfilEstadisticasService.getEstadisticasGenerales(this.user())());
  readonly historialSesiones = computed(() => this.perfilEstadisticasService.getHistorialSesiones(this.user())());
  readonly dbEstadisticas = computed(() => this.perfilEstadisticasService.getDbEstadisticas(this.user())());
}
