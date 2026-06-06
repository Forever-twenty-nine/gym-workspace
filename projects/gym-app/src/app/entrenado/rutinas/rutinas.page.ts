import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
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
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { Router, RouterModule } from '@angular/router';
import { RutinaDetalleModalComponent } from './components/rutina-detalle-modal/rutina-detalle-modal.component';
import { EncuentroDetalleModalComponent } from './components/encuentro-detalle-modal/encuentro-detalle-modal.component';
import { RutinasSemanaComponent } from './components/rutinas-semana/rutinas-semana.component';

import { AlertController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [IonContent, NgOptimizedImage, RouterModule, RutinaDetalleModalComponent, EncuentroDetalleModalComponent, RutinasSemanaComponent],
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
  private convocatoriaService = inject(ConvocatoriaService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  private todasLasRutinas = signal<Rutina[]>([]);
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<any>(null);
  readonly esFuturoSeleccionado = signal<boolean>(false);
  readonly encuentroModalAbierto = signal(false);
  readonly encuentroSeleccionado = signal<any>(null);

  rutinasAsignadas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    const entrenado = this.entrenadoService.getEntrenado(userId)();
    const idsAsignadas = entrenado?.rutinasAsignadasIds || [];
    const idsCreadas = entrenado?.rutinasCreadas || [];
    const todas = this.todasLasRutinas();

    // Incluir rutinas asignadas, creadas (legacy) y por creadorId (como en Creaciones)
    const map = new Map<string, Rutina>();
    todas
      .filter(r => idsAsignadas.includes(r.id) || idsCreadas.includes(r.id) || r.creadorId === userId)
      .forEach(r => map.set(r.id, r));
    return Array.from(map.values());
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

    const userId = this.authService.currentUser()?.uid;
    if (userId) {
      this.entrenadoService.getEntrenado(userId);
      this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId);
    }
  }

  ejerciciosCompletos = computed(() => {
    const r = this.rutinaSeleccionada();
    const todos = this.ejercicioService.ejercicios();
    return (r?.ejerciciosIds || []).map((ej: any) => typeof ej === 'string' ? todos.find(e => e.id === ej) : ej).filter((e: any) => !!e);
  });

  private readonly encuentrosPorFecha = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return new Map<string, any[]>();

    const entrenado = this.entrenadoService.getEntrenado(user.uid)();
    const misEntrenadores = new Set<string>(entrenado?.entrenadoresId || []);
    const gymId = user.gimnasioId;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 7);

    const mapa = new Map<string, any[]>();

    this.convocatoriaService.convocatorias()
      .filter(c => {
        if (!c.activo) return false;
        if (gymId && c.gimnasioId !== gymId) return false;

        const esMio = c.creadorId === user.uid;
        const esDelEntrenador = misEntrenadores.has(c.creadorId);
        if (!esMio && !esDelEntrenador) return false;

        const f = c.fechaEntrenamiento instanceof Date ? c.fechaEntrenamiento : new Date(c.fechaEntrenamiento as any);
        return f >= hoy && f <= limite;
      })
      .forEach(enc => {
        const f = enc.fechaEntrenamiento instanceof Date ? enc.fechaEntrenamiento : new Date(enc.fechaEntrenamiento as any);
        const fechaKey = f.toISOString().split('T')[0];
        const lista = mapa.get(fechaKey) || [];
        lista.push(enc);
        mapa.set(fechaKey, lista);
      });

    return mapa;
  });

  readonly semanaUnificada = computed(() => {
    const user = this.authService.currentUser();
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(user?.uid || '')();
    const diasRutinas = this.rutinaAsignadaService.organizarRutinasSemanales(this.rutinasAsignadas(), asignaciones);
    const encuentrosMap = this.encuentrosPorFecha();

    return diasRutinas.map(dia => {
      const fechaKey = dia.fecha.toISOString().split('T')[0];
      return {
        ...dia,
        encuentros: encuentrosMap.get(fechaKey) || []
      };
    });
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
              const fechaVencimiento = new Date();
              fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

              await this.desafioService.save({
                id: crypto.randomUUID(),
                creadorId: user.uid,
                creadorNombre: user.nombre || 'Atleta',
                creadorFoto: user.photoURL || null,
                gimnasioId: user.gimnasioId || '',
                titulo: `¿Quién se suma a entrenar la rutina "${rutina.nombre}" hoy? 🏋️‍♂️💪`,
                disciplina: 'Fuerza',
                fechaCreacion: new Date(),
                fechaVencimiento,
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

  abrirDetallesEncuentro(enc: any) {
    this.encuentroSeleccionado.set(enc);
    this.encuentroModalAbierto.set(true);
  }

  cerrarModalEncuentro() {
    this.encuentroModalAbierto.set(false);
    setTimeout(() => this.encuentroSeleccionado.set(null), 300);
  }

  irASocialDesdeEncuentro() {
    this.cerrarModalEncuentro();
    setTimeout(() => {
      this.router.navigateByUrl('/entrenado-tabs/social').catch(console.error);
    }, 300);
  }
}
