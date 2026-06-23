import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonLabel, IonCardHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, chevronForward, playCircle, calendarOutline, flameOutline, calendarClearOutline } from 'ionicons/icons';
import { Rutina } from 'gym-library';
import { DateBadgeComponent } from '../../../../shared/components/date-badge/date-badge.component';

export interface DashboardRutina extends Rutina {
  esEjecutable?: boolean;
  diaCorto?: string;
  asignadoPor?: string;
  fecha?: Date;
}

type EntrenadorInfo = Partial<import('gym-library').User> & { photoURL?: string };

@Component({
  selector: 'app-rutinas-asignadas',
  templateUrl: './rutinas-asignadas.component.html',
  standalone: true,
  imports: [IonCardHeader, 
    IonLabel,
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    DateBadgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RutinasAsignadasComponent {
  @Input() rutinas: DashboardRutina[] = [];
  @Input() entrenador: EntrenadorInfo | null = null;
  @Output() verDetalle = new EventEmitter<DashboardRutina>();
  @Output() verTodas = new EventEmitter<void>();

  constructor() {
    addIcons({ barbellOutline, chevronForward, playCircle, calendarOutline, flameOutline, calendarClearOutline });
  }

  getIcono(rutina: DashboardRutina): string {
    if (rutina.esEjecutable) {
      return 'flame-outline';
    }
    if (rutina.fecha) {
      return 'calendar-outline';
    }
    return 'calendar-clear-outline';
  }
}
