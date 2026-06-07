import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonIcon, 
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, chevronForwardOutline, playOutline } from 'ionicons/icons';
import { Rutina } from 'gym-library';

export interface DashboardRutina extends Rutina {
  esEjecutable?: boolean;
  diaCorto?: string;
  asignadoPor?: string;
}

type EntrenadorInfo = Partial<import('gym-library').User> & { photoURL?: string };

@Component({
  selector: 'app-rutinas-asignadas',
  templateUrl: './rutinas-asignadas.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon, 
    IonButton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutinasAsignadasComponent {
  @Input() rutinas: DashboardRutina[] = [];
  @Input() entrenador: EntrenadorInfo | null = null;
  @Output() verDetalle = new EventEmitter<DashboardRutina>();
  @Output() verTodas = new EventEmitter<void>();

  constructor() {
    addIcons({ barbellOutline, chevronForwardOutline, playOutline });
  }
}
