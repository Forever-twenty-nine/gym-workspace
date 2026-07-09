import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, alertCircleOutline, timeOutline, checkmarkCircleOutline, trophyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-profile-plan-actions',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  templateUrl: './profile-plan-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePlanActionsComponent {
    isPremium = input.required<boolean>();
    ultimaSolicitud = input<any>();

    openPremiumModal = output<void>();

    constructor() {
        addIcons({ starOutline, alertCircleOutline, timeOutline, checkmarkCircleOutline, trophyOutline });
    }
}
