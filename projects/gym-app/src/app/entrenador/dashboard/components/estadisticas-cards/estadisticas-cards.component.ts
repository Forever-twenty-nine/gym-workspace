import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, barbellOutline, fitnessOutline } from 'ionicons/icons';

@Component({
  selector: 'app-estadisticas-cards',
  templateUrl: './estadisticas-cards.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon
  ]
})
export class EstadisticasCardsComponent {
  entrenadosCount = input<number>(0);
  ejerciciosCount = input<number>(0);
  rutinasCount = input<number>(0);
  isPremium = input<boolean>(false);

  constructor() {
    addIcons({ peopleOutline, barbellOutline, fitnessOutline });
  }
}
