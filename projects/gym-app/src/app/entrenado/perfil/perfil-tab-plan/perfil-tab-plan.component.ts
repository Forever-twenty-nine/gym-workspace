import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilPlanStatusComponent } from './components/perfil-plan-status/perfil-plan-status.component';
import { PerfilPlanActionsComponent } from './components/perfil-plan-actions/perfil-plan-actions.component';
import { User as LibraryUser, SolicitudPlan, Plan } from 'gym-library';

export interface User extends LibraryUser {
  photoURL?: string;
}

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
  user = input.required<User>();
  ultimaSolicitud = input<SolicitudPlan | null>();

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  openPremiumModal = output<void>();
}