import { Component, inject, computed, Signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Plan, User } from 'gym-library';

@Component({
  selector: 'app-page-background',
  templateUrl: './page-background.component.html',
  standalone: true,
  imports: [NgOptimizedImage],
})
export class PageBackgroundComponent {
  private authService = inject(AuthService);

  private currentUser = this.authService.currentUser as Signal<User | null>;

  isPremium = computed(() => this.currentUser()?.plan === Plan.PREMIUM);
}
