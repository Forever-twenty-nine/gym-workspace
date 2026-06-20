import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, chevronForward, playCircle, calendarOutline, flameOutline, calendarClearOutline } from 'ionicons/icons';
import { Rutina } from 'gym-library';

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
  imports: [
    IonLabel,
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
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
    addIcons({ barbellOutline, chevronForward, playCircle, calendarOutline, flameOutline, calendarClearOutline });
  }

  getDiaNombre(rutina: DashboardRutina): string {
    if (rutina.esEjecutable) {
      return 'HOY';
    }
    if (rutina.fecha) {
      const fechaObj = new Date(rutina.fecha);
      const opciones: Intl.DateTimeFormatOptions = { weekday: 'short' };
      return fechaObj.toLocaleDateString('es-ES', opciones).toUpperCase().replace('.', '');
    }
    return rutina.diaCorto || 'PRÓX';
  }

  getDiaNumero(rutina: DashboardRutina): string {
    if (rutina.fecha) {
      return new Date(rutina.fecha).getDate().toString();
    }
    return '';
  }

  getMesNombre(rutina: DashboardRutina): string {
    if (rutina.fecha) {
      const fechaObj = new Date(rutina.fecha);
      const opciones: Intl.DateTimeFormatOptions = { month: 'short' };
      return fechaObj.toLocaleDateString('es-ES', opciones).toUpperCase().replace('.', '');
    }
    return '';
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
