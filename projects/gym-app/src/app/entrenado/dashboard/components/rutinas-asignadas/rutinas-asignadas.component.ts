import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonText, IonNote, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, chevronForwardOutline, playOutline, calendarOutline, flameOutline, calendarClearOutline } from 'ionicons/icons';
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
  imports: [IonLabel,
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    IonText],
  styles: [`
    .rutina-fecha-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 64px;
      border-radius: 12px;
      background: rgba(var(--ion-color-step-100-rgb, 240, 240, 240), 0.7);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(var(--ion-color-step-200-rgb, 220, 220, 220), 0.5);
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      margin-right: 12px;
    }

    .rutina-fecha-badge.es-hoy {
      background: linear-gradient(135deg, rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.15) 0%, rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.05) 100%);
      border: 1px solid rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.4);
      box-shadow: 0 4px 15px rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.15);
    }

    .badge-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 3px 0;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--ion-color-step-600, #666);
      border-bottom: 1px dashed rgba(var(--ion-color-step-300-rgb, 200, 200, 200), 0.3);
    }

    .rutina-fecha-badge.es-hoy .badge-header {
      color: var(--ion-color-success, #2dd36f);
      border-bottom-color: rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.2);
    }

    .badge-header ion-icon {
      font-size: 11px;
    }

    .badge-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
      padding-bottom: 2px;
    }

    .dia-numero {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.1;
      color: var(--ion-color-step-900, #111);
    }

    .rutina-fecha-badge.es-hoy .dia-numero {
      color: var(--ion-color-success-shade, #28bd63);
    }

    .mes-nombre {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ion-color-step-500, #888);
    }

    .rutina-fecha-badge.es-hoy .mes-nombre {
      color: var(--ion-color-success, #2dd36f);
    }

    .dia-numero-large {
      font-size: 20px;
      font-weight: 700;
      color: var(--ion-color-step-400, #999);
    }

    ion-item {
      --padding-start: 8px;
      --padding-end: 8px;
      --inner-padding-end: 4px;
      margin-bottom: 8px;
      border-radius: 14px;
      overflow: hidden;
      --background: rgba(var(--ion-color-step-50-rgb, 250, 250, 250), 0.5);
      border: 1px solid rgba(var(--ion-color-step-150-rgb, 230, 230, 230), 0.3);
      transition: all 0.2s ease;
    }

    ion-item::part(native) {
      border-radius: 14px;
    }

    ion-item:hover {
      --background: rgba(var(--ion-color-step-100-rgb, 240, 240, 240), 0.8);
      transform: translateY(-1px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutinasAsignadasComponent {
  @Input() rutinas: DashboardRutina[] = [];
  @Input() entrenador: EntrenadorInfo | null = null;
  @Output() verDetalle = new EventEmitter<DashboardRutina>();
  @Output() verTodas = new EventEmitter<void>();

  constructor() {
    addIcons({ barbellOutline, chevronForwardOutline, playOutline, calendarOutline, flameOutline, calendarClearOutline });
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
