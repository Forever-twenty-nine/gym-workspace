import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import {
  IonContent, IonHeader, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  fitnessOutline, playOutline, timeOutline, calendarOutline,
  checkmarkCircle, timerOutline, notificationsOutline, arrowBackOutline,
  todayOutline, bedOutline, playCircle, repeatOutline, syncCircleOutline, lockClosed,
  trashOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { Rutina } from 'gym-library';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { RutinaService } from '../../core/services/rutina.service';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { Router, RouterModule } from '@angular/router';
import { RutinaDetalleModalComponent } from './components/rutina-detalle-modal/rutina-detalle-modal.component';
import { EncuentroDetalleModalComponent } from './components/encuentro-detalle-modal/encuentro-detalle-modal.component';
import { RutinasSemanaComponent } from './components/rutinas-semana/rutinas-semana.component';
import { ProgresoHistorialDetalleComponent } from '../progreso/components/progreso-historial-detalle/progreso-historial-detalle.component';
import { AlertController } from '@ionic/angular/standalone';



@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    NgOptimizedImage,
    RouterModule,
    RutinaDetalleModalComponent,
    EncuentroDetalleModalComponent,
    RutinasSemanaComponent,
    ProgresoHistorialDetalleComponent
  ],
})
export class RutinasPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private injector = inject(Injector);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private convocatoriaService = inject(ConvocatoriaService);
  private sesionRutinaService = inject(SesionRutinaService);
  private alertController = inject(AlertController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  selectedTab = signal<'rutinas' | 'historial'>('rutinas');
  sesionSeleccionada = signal<any>(null);

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
      repeatOutline, syncCircleOutline, lockClosed, trashOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    effect(() => this.todasLasRutinas.set(this.rutinaService.rutinas()), { injector: this.injector });

    const userId = this.authService.currentUser()?.uid;
    if (userId) {
      this.entrenadoService.getEntrenado(userId);
      this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId);
      // Inicializa listener del historial de sesiones (completadas)
      this.sesionRutinaService.getSesionesPorEntrenado(userId);
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

  // Historial solo de rutinas completadas (para la pestaña Historial)
  historialCompletadas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(userId)();
    return sesiones
      .filter(s => s.completada === true)
      .sort((a, b) => {
        const da = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio);
        const db = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio);
        return db.getTime() - da.getTime();
      });
  });

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
  }

  abrirDetalleSesion(sesion: any) {
    this.sesionSeleccionada.set(sesion);
  }

  cerrarDetalleSesion() {
    this.sesionSeleccionada.set(null);
  }

  async eliminarSesion(sesionId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertController.create({
      header: 'Eliminar registro',
      message: '¿Eliminar este entrenamiento del historial? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.sesionRutinaService.eliminarSesion(sesionId);
            } catch (e) {
              console.error('Error eliminando sesión:', e);
            }
          }
        }
      ]
    });
    await alert.present();
  }

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

  // Helpers para el historial (ion-list)
  formatearFechaSesion(fecha: any): string {
    if (!fecha) return 'Sin fecha';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  redondearMinutos(segundos: number): number {
    return Math.round((segundos || 0) / 60);
  }
}
