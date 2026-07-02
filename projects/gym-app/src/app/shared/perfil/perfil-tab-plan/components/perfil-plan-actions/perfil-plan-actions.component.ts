import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil-plan-actions',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  templateUrl: './perfil-plan-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilPlanActionsComponent {
  isPremium = input.required<boolean>();
  ultimaSolicitud = input<any>();

  openPremiumModal = output<void>();
}
