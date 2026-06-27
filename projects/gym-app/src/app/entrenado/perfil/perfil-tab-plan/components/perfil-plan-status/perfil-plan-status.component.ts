import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-perfil-plan-status',
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, CommonModule],
  templateUrl: './perfil-plan-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilPlanStatusComponent {
  plan = input<string>();
  isPremium = input.required<boolean>();
}
