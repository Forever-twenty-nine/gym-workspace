import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-profile-plan-status',
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, CommonModule],
  templateUrl: './profile-plan-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePlanStatusComponent {
  plan = input<string>();
  isPremium = input.required<boolean>();
}
