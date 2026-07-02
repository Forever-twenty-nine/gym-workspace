import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, calendarOutline } from 'ionicons/icons';
import { SesionRutina } from 'gym-library';
import { DateBadgeComponent } from '../../../../shared/components/date-badge/date-badge.component';

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
    IonItemOption,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonCardSubtitle,
    IonText,
    DateBadgeComponent
  ]
})
export class RutinasHistorialComponent {
  @Input() sesiones: SesionRutina[] = [];
  @Output() verDetalle = new EventEmitter<SesionRutina>();
  @Output() eliminar = new EventEmitter<{ sesion: SesionRutina, event: Event }>();

  constructor() {
    addIcons({
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


  redondearMinutos(segundos: number): number {
    return Math.round((segundos || 0) / 60);
  }
}
