import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  fitnessOutline, playOutline, timeOutline, calendarOutline,
  checkmarkCircle, timerOutline, notificationsOutline, arrowBackOutline,
  todayOutline, bedOutline, playCircle, repeatOutline, syncCircleOutline, lockClosed
} from 'ionicons/icons';
import { Rutina } from 'gym-library';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { RutinaService } from '../../core/services/rutina.service';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { Router, RouterModule } from '@angular/router';
import { RutinaDetalleModalComponent } from './components/rutina-detalle-modal/rutina-detalle-modal.component';
import { RutinasSemanaComponent } from './components/rutinas-semana/rutinas-semana.component';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [IonContent, RouterModule, RutinaDetalleModalComponent, RutinasSemanaComponent, HeaderTabsComponent],
})
export class RutinasPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private injector = inject(Injector);
  private rutinaAsignadaService = inject(RutinaAsignadaService);

  private todasLasRutinas = signal<Rutina[]>([]);
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<any>(null);
  readonly esFuturoSeleccionado = signal<boolean>(false);

  rutinasAsignadas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    const ids = this.entrenadoService.getEntrenado(userId || '')()?.rutinasAsignadasIds || [];
    return this.todasLasRutinas().filter(r => ids.includes(r.id));
  });

  constructor() {
    addIcons({
      fitnessOutline, playOutline, timeOutline, calendarOutline, checkmarkCircle,
      timerOutline, notificationsOutline, arrowBackOutline, todayOutline, bedOutline, playCircle,
      repeatOutline, syncCircleOutline, lockClosed
    });
  }

  ngOnInit() {
    effect(() => this.todasLasRutinas.set(this.rutinaService.rutinas()), { injector: this.injector });
  }

  ejerciciosCompletos = computed(() => {
    const r = this.rutinaSeleccionada();
    const todos = this.ejercicioService.ejercicios();
    return (r?.ejerciciosIds || []).map((ej: any) => typeof ej === 'string' ? todos.find(e => e.id === ej) : ej).filter((e: any) => !!e);
  });

  readonly rutinasPorDia = computed(() => {
    const user = this.authService.currentUser();
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(user?.uid || '')();
    return this.rutinaAsignadaService.organizarRutinasSemanales(this.rutinasAsignadas(), asignaciones);
  });

  abrirDetalles(data: { rutina: any, esFuturo: boolean }) {
    this.rutinaSeleccionada.set(data.rutina);
    this.esFuturoSeleccionado.set(data.esFuturo);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    setTimeout(() => this.rutinaSeleccionada.set(null), 300);
  }

  iniciarEntrenamiento(rutina: any) {
    if (this.modalAbierto()) this.cerrarModal();
    const delay = this.modalAbierto() ? 350 : 0;
    (document.activeElement as HTMLElement)?.blur();
    setTimeout(() => this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`).catch(console.error), delay);
  }

  iniciarEntrenamientoDirecto(event: Event, rutina: any) {
    event.stopPropagation();
    (document.activeElement as HTMLElement)?.blur();
    this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`).catch(console.error);
  }
}
