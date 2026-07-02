import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonText, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, barbellOutline, fitnessOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { EstadisticasGeneralesEntrenador } from '../../../../../core/services/perfil-estadisticas.service';

@Component({
  selector: 'app-entrenador-stats',
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonText, IonIcon
  ],
  templateUrl: './entrenador-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadorStatsComponent {
  stats = input.required<EstadisticasGeneralesEntrenador>();

  constructor() {
    addIcons({ peopleOutline, barbellOutline, fitnessOutline, calendarOutline, timeOutline });
  }
}