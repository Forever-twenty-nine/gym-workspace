import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilePlanStatusComponent } from './components/profile-plan-status/profile-plan-status.component';
import { ProfilePlanActionsComponent } from './components/profile-plan-actions/profile-plan-actions.component';
import { User as LibraryUser, SolicitudPlan, Plan } from 'gym-library';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-profile-tab-plan',
  standalone: true,
  imports: [
    CommonModule,
    ProfilePlanStatusComponent,
    ProfilePlanActionsComponent
  ],
  templateUrl: './profile-tab-plan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileTabPlanComponent {
  user = input.required<User>();
  ultimaSolicitud = input<SolicitudPlan | null>();

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  openPremiumModal = output<void>();
}