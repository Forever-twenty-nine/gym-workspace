import { Component, inject, signal, computed } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Router, Event } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  calendarOutline,
  peopleOutline,
  addCircleOutline,
  personOutline
} from 'ionicons/icons';

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
export class EntrenadoTabsPage {
  private router = inject(Router);
  private routerEvent = toSignal<Event>(this.router.events);

  isCenterTabActive = computed(() => {
    this.routerEvent();
    return this.router.url.includes('/creaciones');
  });

  constructor() {
    addIcons({
      homeOutline,
      calendarOutline,
      peopleOutline,
      addCircleOutline,
      personOutline
    });
  }
}

