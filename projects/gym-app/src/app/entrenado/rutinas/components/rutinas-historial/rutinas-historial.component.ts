import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, trashOutline, calendarOutline } from 'ionicons/icons';
import { SesionRutina } from 'gym-library';

@Component({
  selector: 'app-rutinas-historial',
  templateUrl: './rutinas-historial.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class RutinasHistorialComponent {
  @Input() sesiones: SesionRutina[] = [];
  @Output() verDetalle = new EventEmitter<SesionRutina>();
  @Output() eliminar = new EventEmitter<{ sesion: SesionRutina, event: Event }>();

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      trashOutline,
      calendarOutline
    });
  }

  onVerDetalle(sesion: SesionRutina) {
    this.verDetalle.emit(sesion);
  }

  onEliminar(sesion: SesionRutina, event: Event) {
    this.eliminar.emit({ sesion, event });
  }

  formatearFechaSesion(fecha: Date | string | number | undefined): string {
    if (!fecha) return 'Sin fecha';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  redondearMinutos(segundos: number): number {
    return Math.round((segundos || 0) / 60);
  }
}
