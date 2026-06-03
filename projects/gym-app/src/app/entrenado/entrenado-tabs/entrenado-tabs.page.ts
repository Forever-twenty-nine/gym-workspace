import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon
} from '@ionic/angular/standalone';
import { inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
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
  addCircleOutline,
  addCircle,
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
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon
  ]
})
export class EntrenadoTabsPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private routerSubscription?: Subscription;

  isCenterTabActive = signal(false);

  constructor() {
    addIcons({ 
      homeOutline, home, calendarOutline, barbellOutline, barbell, calendar, 
      statsChartOutline, statsChart, fitnessOutline, fitness, personOutline, person, 
      peopleOutline, people, addOutline, add, addCircleOutline, addCircle, closeOutline, close 
    });
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
    this.isCenterTabActive.set(url.includes('/creaciones'));
  }
}
