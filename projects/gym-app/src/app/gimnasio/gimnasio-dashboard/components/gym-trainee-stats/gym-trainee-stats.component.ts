import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonGrid, 
  IonRow, 
  IonCol,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-gym-trainee-stats',
  standalone: true,
  imports: [
    CommonModule, 
    IonGrid, 
    IonRow, 
    IonCol,
    IonText
  ],
  templateUrl: './gym-trainee-stats.component.html',
  styles: [`
    ion-row {
      margin: 0 -4px;
    }
  `]
})
export class GymTraineeStatsComponent {
  totalTrainees = input<number>(0);
  activeTrainees = input<number>(0);
  traineesWithoutTrainer = input<number>(0);
}
