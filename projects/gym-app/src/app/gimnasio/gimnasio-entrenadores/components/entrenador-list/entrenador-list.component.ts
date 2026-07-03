import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonButton, 
  IonIcon,
  IonText,
  IonCard
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemove } from 'ionicons/icons';

@Component({
  selector: 'app-entrenador-list',
  standalone: true,
  imports: [
    CommonModule, 
    IonList, 
    IonItem, 
    IonAvatar, 
    IonLabel, 
    IonButton, 
    IonIcon,
    IonText,
    IonCard
  ],
  templateUrl: './entrenador-list.component.html'
})
export class EntrenadorListComponent {
  entrenadores = input<any[]>([]);
  desvincular = output<any>();

  constructor() {
    addIcons({ personRemove });
  }
}
