import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { IonContent, IonCard } from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
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
import { DesafioService } from '../../core/services/desafio.service';
import { Router, RouterModule } from '@angular/router';
import { RutinaDetalleModalComponent } from './components/rutina-detalle-modal/rutina-detalle-modal.component';
import { RutinasSemanaComponent } from './components/rutinas-semana/rutinas-semana.component';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [IonContent, NgOptimizedImage, RouterModule, RutinaDetalleModalComponent, RutinasSemanaComponent, HeaderTabsComponent],
})
export class RutinasPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private injector = inject(Injector);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private desafioService = inject(DesafioService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  private todasLasRutinas = signal<Rutina[]>([]);
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<any>(null);
  readonly esFuturoSeleccionado = signal<boolean>(false);

  rutinasAsignadas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    const entrenado = this.entrenadoService.getEntrenado(userId || '')();
    const idsAsignadas = entrenado?.rutinasAsignadasIds || [];
    const idsCreadas = entrenado?.rutinasCreadas || [];
    const allIds = [...new Set([...idsAsignadas, ...idsCreadas])];
    return this.todasLasRutinas().filter(r => allIds.includes(r.id));
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

  async publicarComoDesafio(rutina: any) {
    const confirmAlert = await this.alertController.create({
      header: '¿Buscar Gymbro?',
      message: `¿Estás seguro de que deseas publicar la rutina "${rutina.nombre}" en la sección social para encontrar un compañero hoy?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Compartir',
          handler: async () => {
            const user = this.currentUserSignal();
            if (!user) return;

            try {
              await this.desafioService.save({
                id: crypto.randomUUID(),
                creadorId: user.uid,
                creadorNombre: user.nombre || 'Atleta',
                creadorFoto: user.photoURL || undefined,
                titulo: `¿Quién se suma a entrenar la rutina "${rutina.nombre}" hoy? 🏋️‍♂️💪`,
                disciplina: 'Fuerza',
                fechaCreacion: new Date(),
                activo: true
              });

              const toast = await this.toastController.create({
                message: '¡Rutina publicada en el muro social para buscar Gymbro!',
                duration: 2500,
                position: 'top',
                color: 'success'
              });
              await toast.present();
              this.cerrarModal();
            } catch (e) {
              console.error('Error al publicar desafío:', e);
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });

    await confirmAlert.present();
  }
}
