import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilPlanStatusComponent } from '../components/perfil-plan-status/perfil-plan-status.component';
import { PerfilPlanActionsComponent } from '../components/perfil-plan-actions/perfil-plan-actions.component';

@Component({
  selector: 'app-perfil-tab-plan',
  standalone: true,
  imports: [
    CommonModule,
    PerfilPlanStatusComponent,
    PerfilPlanActionsComponent
  ],
  templateUrl: './perfil-tab-plan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabPlanComponent {
  user = input.required<any>();
  isPremium = input.required<boolean>();
  ultimaSolicitud = input<any>();

  openPremiumModal = output<void>();
}