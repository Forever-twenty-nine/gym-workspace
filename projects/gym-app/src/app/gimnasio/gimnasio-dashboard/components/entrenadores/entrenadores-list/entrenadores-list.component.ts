import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemove, closeCircle, eye, add } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-entrenadores-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    EmptyStateComponent
  ],
  templateUrl: './entrenadores-list.component.html'
})
export class EntrenadoresListComponent {
  entrenadores = input<any[]>([]);
  invitaciones = input<any[]>([]);
  desvincular = output<any>();
  cancelar = output<string>();
  verDetalles = output<any>();
  invitar = output<void>();

  constructor() {
    addIcons({ personRemove, closeCircle, eye, add });
  }
}
