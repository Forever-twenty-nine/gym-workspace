import { Component } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { inject, computed } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Plan } from 'gym-library';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  fitnessOutline,
  fitness,
  personOutline,
  barbellOutline,
  barbell,
  person,
  statsChartOutline,
  statsChart,
  calendarOutline,
  calendar,
  peopleOutline,
  people
} from 'ionicons/icons';

@Component({
  selector: 'app-entrenado-tabs',
  templateUrl: './entrenado-tabs.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ]
})
export class EntrenadoTabsPage {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  readonly isPremium = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;

    // Check if the plan is premium in the User object
    return user.plan === Plan.PREMIUM;
  });

  constructor() {
    addIcons({ homeOutline, home, calendarOutline, barbellOutline, barbell, calendar, statsChartOutline, statsChart, fitnessOutline, fitness, personOutline, person, peopleOutline, people, });
  }
}
