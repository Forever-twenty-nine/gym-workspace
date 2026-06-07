import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon
} from '@ionic/angular/standalone';
import { inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { AuthService } from '../../core/services/auth.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
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
  private userService = inject(UserService); // preload users/photos as early as possible (when entering the main app tabs)
  private entrenadoService = inject(EntrenadoService); // preload athlete profiles early for discover suggestions
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private routerSubscription?: Subscription;

  isCenterTabActive = signal(false);

  constructor() {
    // Preload services early (as soon as entering the entrenado area after login).
    // This ensures user photos and athlete profiles are loading in background before you even navigate to the social / descubrir tab.
    // Solves the "first load of descubrir shows only initials" race condition.
    this.userService.users;

    // Preload gym-scoped entrenados (clave para sugerencias de MatchService en Descubrir)
    // y listas de contenido (rutinas/ejercicios para creaciones y rutinas)
    const gymId = this.authService.currentUser()?.gimnasioId;
    if (gymId) {
      this.entrenadoService.getEntrenadosForGym?.(gymId) ?? this.entrenadoService.entrenados;
      this.rutinaService.getRutinasForGym(gymId);
      this.ejercicioService.getEjerciciosForGym(gymId);
    } else {
      this.entrenadoService.entrenados;
      this.rutinaService.rutinas();
      this.ejercicioService.ejercicios();
    }

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
      .subscribe((event: NavigationEnd) => {
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
