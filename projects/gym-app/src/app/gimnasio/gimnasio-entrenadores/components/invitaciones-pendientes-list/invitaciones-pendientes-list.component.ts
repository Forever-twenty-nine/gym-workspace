import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonButton, 
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-invitaciones-pendientes-list',
  standalone: true,
  imports: [
    CommonModule, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonList, 
    IonItem, 
    IonAvatar, 
    IonLabel, 
    IonButton, 
    IonIcon
  ],
  templateUrl: './invitaciones-pendientes-list.component.html'
})
export class InvitacionesPendientesListComponent {
  invitaciones = input<any[]>([]);
  cancelar = output<string>();

  constructor() {
    addIcons({ closeCircleOutline });
  }
}
