import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invitacion } from 'gym-library';
import { IonAvatar, IonIcon, IonItem, IonLabel, IonList, IonCard, IonCardContent, IonItemSliding, IonItemOption, IonItemOptions } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircleOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-invitaciones-pendientes',
  templateUrl: './invitaciones-pendientes.component.html',
  imports: [
    CommonModule,
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonCard,
    IonAvatar,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonCardContent,
    EmptyStateComponent
  ],
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
