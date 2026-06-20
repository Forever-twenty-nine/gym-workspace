import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invitacion } from 'gym-library';
import { IonAvatar, IonIcon, IonItem, IonLabel, IonList, IonCard, IonCardContent, IonItemSliding, IonItemOption, IonItemOptions, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-invitaciones-pendientes',
  templateUrl: './invitaciones-pendientes.component.html',
  imports: [IonNote, IonItemOptions, IonItemOption, IonItemSliding, IonCard,
    CommonModule,
    IonAvatar,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonCardContent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitacionesPendientesComponent {
  // Invitaciones
  @Input() invitaciones: Invitacion[] = [];
  // outputs para acciones
  @Output() aceptar = new EventEmitter<Invitacion>();
  @Output() rechazar = new EventEmitter<Invitacion>();

  constructor() {
    addIcons({ checkmarkCircle, closeCircleOutline });
  }
}
