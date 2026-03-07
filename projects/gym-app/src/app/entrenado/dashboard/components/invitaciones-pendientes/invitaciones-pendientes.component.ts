import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormatFechaPipe } from '../../../../shared/pipes/format-fecha.pipe';
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
  @Input() invitaciones: any[] = [];
  @Input() mostrar: boolean = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() aceptar = new EventEmitter<any>();
  @Output() rechazar = new EventEmitter<any>();

  constructor() {
    addIcons({ checkmarkCircle, closeCircleOutline, notificationsCircle, chevronUp, chevronDown });
  }
}
