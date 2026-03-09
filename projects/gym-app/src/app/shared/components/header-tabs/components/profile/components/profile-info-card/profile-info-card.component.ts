import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle,
  IonItem, IonLabel, IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, alertCircleOutline, starOutline, checkmarkCircle, personOutline, mailOutline, fitnessOutline, statsChartOutline, shieldOutline, } from 'ionicons/icons';

import { User as LibraryUser, SolicitudPlan } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-profile-info-card',
  templateUrl: './profile-info-card.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle,
    IonItem, IonLabel, IonList
  ],
})
export class ProfileInfoCardComponent {
  @Input() user: User | null = null;
  @Input() ultimasolicitud: SolicitudPlan | null = null;
  @Input() entrenadoData: any = null;

  @Output() openPremiumModalClicked = new EventEmitter<void>();

  constructor() {
    addIcons({
      trophyOutline, alertCircleOutline, starOutline, checkmarkCircle,
      personOutline, mailOutline, fitnessOutline, statsChartOutline, shieldOutline
    });
  }

  openPremiumModal() {
    this.openPremiumModalClicked.emit();
  }
}
