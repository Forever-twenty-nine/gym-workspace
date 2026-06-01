import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-proximos-entrenados',
  templateUrl: './proximos-entrenados.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonIcon
  ]
})
export class ProximosEntrenadosComponent {
  entrenados = input.required<any[]>();
  getUserName = input.required<(id: string) => string>();

  constructor() {
    addIcons({ calendarOutline });
  }
}
