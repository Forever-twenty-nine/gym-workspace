import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormatFechaPipe } from '../../../../shared/pipes/format-fecha.pipe';
import { Invitacion } from 'gym-library';
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
    IonBadge,
    FormatFechaPipe,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitacionesPendientesComponent {
  @Input() invitaciones: Invitacion[] = [];
  @Input() mostrar: boolean = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() aceptar = new EventEmitter<Invitacion>();
  @Output() rechazar = new EventEmitter<Invitacion>();

  constructor() {
    addIcons({ checkmarkCircle, closeCircleOutline, notificationsCircle, chevronUp, chevronDown });
  }
}
