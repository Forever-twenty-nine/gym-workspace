import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  ActionSheetController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { inject, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
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
  people,
  addOutline,
  add,
  closeOutline,
  close
} from 'ionicons/icons';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-entrenado-tabs',
  templateUrl: './entrenado-tabs.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon
  ]
})
export class EntrenadoTabsPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private actionSheetCtrl = inject(ActionSheetController);
  private router = inject(Router);
  private routerSubscription?: Subscription;

  readonly isPremium = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;

    // Check if the plan is premium in the User object
    return user.plan === Plan.PREMIUM;
  });

  isCenterTabActive = signal(false);

  constructor() {
    addIcons({ homeOutline, home, calendarOutline, barbellOutline, barbell, calendar, statsChartOutline, statsChart, fitnessOutline, fitness, personOutline, person, peopleOutline, people, addOutline, add, closeOutline, close });
  }

  ngOnInit() {
    this.checkIfCenterTabActive(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfCenterTabActive(event.urlAfterRedirects);
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkIfCenterTabActive(url: string) {
    this.isCenterTabActive.set(url.includes('/ejercicios') || url.includes('/mis-rutinas'));
  }

  async openPremiumMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones Premium',
      buttons: [
        {
          text: 'Mis Rutinas',
          icon: 'fitness-outline',
          handler: () => {
            this.router.navigate(['/entrenado-tabs/mis-rutinas']);
          }
        },
        {
          text: 'Ejercicios',
          icon: 'barbell-outline',
          handler: () => {
            this.router.navigate(['/entrenado-tabs/ejercicios']);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
}
