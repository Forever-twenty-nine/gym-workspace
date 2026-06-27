import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { PerfilUserHeaderComponent } from '../components/perfil-user-header/perfil-user-header.component';
import { PerfilGoalsComponent } from '../components/perfil-goals/perfil-goals.component';
import { PerfilStatsTeaserComponent } from '../components/perfil-stats-teaser/perfil-stats-teaser.component';
import { ProgresoEstadisticasComponent } from '../components/progreso-estadisticas/progreso-estadisticas.component';

@Component({
  selector: 'app-perfil-tab-info',
  standalone: true,
  imports: [
    CommonModule, 
    IonButton, 
    IonIcon, 
    IonSpinner,
    PerfilUserHeaderComponent,
    PerfilGoalsComponent,
    PerfilStatsTeaserComponent,
    ProgresoEstadisticasComponent
  ],
  templateUrl: './perfil-tab-info.component.html',
  styles: [`
    .initials-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--ion-color-light);
      color: var(--ion-color-medium);
      font-weight: 600;
      font-size: 1.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabInfoComponent {
  user = input.required<any>();
  initials = input.required<string>();
  roleDisplayName = input.required<string>();
  currentEntrenado = input<any>();
  isPremium = input.required<boolean>();
  estadisticasGenerales = input<any>();
  historialSesiones = input<any[]>([]);
  dbEstadisticas = input<any>();

  editClick = output<void>();
  viewPlansClick = output<void>();
  logoutClick = output<void>();
}