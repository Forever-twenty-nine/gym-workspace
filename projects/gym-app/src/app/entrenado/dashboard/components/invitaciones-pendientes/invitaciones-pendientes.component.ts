import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardContent, 
  IonAvatar, 
  IonButton, 
  IonIcon, 
  IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircleOutline, notificationsCircle, chevronUp, chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-invitaciones-pendientes',
  templateUrl: './invitaciones-pendientes.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonButton,
    IonIcon,
    IonBadge
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitacionesPendientesComponent {
  @Input() invitaciones: any[] = [];
  @Input() mostrar: boolean = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() aceptar = new EventEmitter<any>();
  @Output() rechazar = new EventEmitter<any>();
  @Input() formatearFechaFn!: (f: any) => string;

  constructor() {
    addIcons({ checkmarkCircle, closeCircleOutline, notificationsCircle, chevronUp, chevronDown });
  }

  formatearFecha(fecha: any) {
    return this.formatearFechaFn ? this.formatearFechaFn(fecha) : fecha;
  }
}
