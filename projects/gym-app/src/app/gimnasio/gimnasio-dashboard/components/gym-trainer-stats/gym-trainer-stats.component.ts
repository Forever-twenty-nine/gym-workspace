import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gym-trainer-stats',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText],
  templateUrl: './gym-trainer-stats.component.html',
  styles: [`
    ion-col {
      padding: 0 4px;
    }
    ion-row {
      margin: 0 -4px;
    }
  `]
})
export class GymTrainerStatsComponent {
  totalTrainers = input<number>(0);
  activeTrainers = input<number>(0);
  avgTraineesPerTrainer = input<number>(0);
  routinesCreatedByTrainers = input<number>(0);
  pendingInvitations = input<number>(0);
}
