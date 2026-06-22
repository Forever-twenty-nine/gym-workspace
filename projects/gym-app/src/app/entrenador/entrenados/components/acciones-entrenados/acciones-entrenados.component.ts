import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosed } from 'ionicons/icons';

@Component({
  selector: 'app-acciones-entrenados',
  templateUrl: './acciones-entrenados.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class AccionesEntrenadosComponent {
  hasReachedLimit = input.required<boolean>();
  limitMessage = input.required<string>();

  openInvitacionModal = output<void>();

  constructor() {
    addIcons({ mailOutline, lockClosed });
  }

  onInvitacion() {
    this.openInvitacionModal.emit();
  }
}
