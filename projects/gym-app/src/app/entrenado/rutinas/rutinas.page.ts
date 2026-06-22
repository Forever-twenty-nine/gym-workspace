import { Component, signal, inject, computed, effect } from '@angular/core';
import {
  IonContent, IonHeader, IonSegment, IonSegmentButton, IonLabel,
  SegmentCustomEvent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PageBackgroundComponent } from '../../shared/components/page-background/page-background.component';
import { Rutina, Plan, Convocatoria, SesionRutina } from 'gym-library';
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
import { RutinasHistorialComponent } from './components/rutinas-historial/rutinas-historial.component';
import { ProgresoHistorialDetalleComponent } from './components/progreso-historial-detalle/progreso-historial-detalle.component';
import { AlertController } from '@ionic/angular/standalone';
import { closeModalWithAnimation, blurActiveElement } from '../../core/utils/modal.utils';



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
    RouterModule,
    RutinaDetalleModalComponent,
    EncuentroDetalleModalComponent,
    RutinasSemanaComponent,
    RutinasHistorialComponent,
    ProgresoHistorialDetalleComponent,
    PageBackgroundComponent
  ],
})
export class RutinasPage {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private convocatoriaService = inject(ConvocatoriaService);
  private sesionRutinaService = inject(SesionRutinaService);
  private alertController = inject(AlertController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === Plan.PREMIUM);

  selectedTab = signal<'rutinas' | 'historial'>('rutinas');
  sesionSeleccionada = signal<SesionRutina | null>(null);

  private todasLasRutinas = signal<Rutina[]>([]);
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<Rutina | null>(null);
  readonly esFuturoSeleccionado = signal<boolean>(false);
  readonly encuentroModalAbierto = signal(false);
  readonly encuentroSeleccionado = signal<Convocatoria | null>(null);

  rutinasAsignadas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    const entrenado = this.entrenadoService.getEntrenado(userId)();
    const idsAsignadas = entrenado?.rutinasAsignadasIds || [];
    const legacyCreadas = entrenado?.rutinasCreadas || [];
    const todas = this.todasLasRutinas();

    // Owned (creadas por el usuario) usando helper centralizado
    const owned = this.rutinaService.getCreatedByUser(userId, legacyCreadas)();
    const ownedIds = new Set(owned.map(r => r.id));

    // Incluir rutinas asignadas + las creadas por el usuario (nuevo + legacy)
    const map = new Map<string, Rutina>();
    todas
      .filter(r => idsAsignadas.includes(r.id) || ownedIds.has(r.id))
      .forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  });

  constructor() {
    // Sync the full rutinas list into local signal, preferring gym-scoped
    effect(() => {
      const gymId = this.authService.currentUser()?.gimnasioId;
      const list = gymId 
        ? this.rutinaService.getRutinasForGym(gymId)() 
        : this.rutinaService.rutinas();
      this.todasLasRutinas.set(list);
    });

    // Preload user-specific listeners early (same as before, but in proper context)
    const userId = this.authService.currentUser()?.uid;
    if (userId) {
      this.entrenadoService.getEntrenado(userId);
      this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId);
      this.sesionRutinaService.getSesionesPorEntrenado(userId);
    }
  }

  ejerciciosCompletos = computed(() => {
    const r = this.rutinaSeleccionada();
    const todos = this.ejercicioService.ejercicios();
    const ids = r?.ejerciciosIds ?? [];
    return ids
      .map(id => typeof id === 'string' ? todos.find(e => e.id === id) : id)
      .filter((e): e is import('gym-library').Ejercicio => !!e);
  });

  private readonly encuentrosPorFecha = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return new Map<string, Convocatoria[]>();

    const entrenado = this.entrenadoService.getEntrenado(user.uid)();
    const misEntrenadores = new Set<string>(entrenado?.entrenadoresId || []);
    const gymId = user.gimnasioId;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 7);

    const mapa = new Map<string, Convocatoria[]>();

    const convos = gymId 
      ? this.convocatoriaService.getConvocatoriasForGym(gymId)() 
      : this.convocatoriaService.convocatorias();

    convos
      .filter(c => {
        if (!c.activo) return false;
        if (gymId && c.gimnasioId !== gymId) return false;

        const esMio = c.creadorId === user.uid;
        const esDelEntrenador = misEntrenadores.has(c.creadorId);
        if (!esMio && !esDelEntrenador) return false;

        const f = c.fechaEntrenamiento instanceof Date ? c.fechaEntrenamiento : new Date(c.fechaEntrenamiento);
        return f >= hoy && f <= limite;
      })
      .forEach(enc => {
        const f = enc.fechaEntrenamiento instanceof Date ? enc.fechaEntrenamiento : new Date(enc.fechaEntrenamiento);
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

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'rutinas' | 'historial' | undefined;
    if (val) this.selectedTab.set(val);
  }

  abrirDetalleSesion(sesion: SesionRutina) {
    this.sesionSeleccionada.set(sesion);
  }

  cerrarDetalleSesion() {
    this.sesionSeleccionada.set(null);
  }

  async eliminarSesion(sesion: SesionRutina, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const rutinaNombre = sesion.rutinaResumen?.nombre || 'Rutina';

    const alert = await this.alertController.create({
      header: 'Eliminar rutina del historial',
      message: `¿Eliminar el entrenamiento de "${rutinaNombre}" del historial? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.sesionRutinaService.eliminarSesion(sesion.id);
            } catch (e) {
              console.error('Error eliminando sesión:', e);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  abrirDetalles(data: { rutina: Rutina, esFuturo: boolean }) {
    this.rutinaSeleccionada.set(data.rutina);
    this.esFuturoSeleccionado.set(data.esFuturo);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    closeModalWithAnimation(this.modalAbierto, this.rutinaSeleccionada, 300);
  }

  iniciarEntrenamiento(rutina: Rutina) {
    if (this.modalAbierto()) this.cerrarModal();
    blurActiveElement();
    // Defer navigation one tick so the modal close animation can start
    setTimeout(() => {
      this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`).catch(console.error);
    }, 0);
  }

  iniciarEntrenamientoDirecto(event: Event, rutina: Rutina) {
    event.stopPropagation();
    blurActiveElement();
    this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`).catch(console.error);
  }

  abrirDetallesEncuentro(enc: Convocatoria) {
    this.encuentroSeleccionado.set(enc);
    this.encuentroModalAbierto.set(true);
  }

  cerrarModalEncuentro() {
    closeModalWithAnimation(this.encuentroModalAbierto, this.encuentroSeleccionado, 300);
  }

  irASocialDesdeEncuentro() {
    this.cerrarModalEncuentro();
    setTimeout(() => {
      this.router.navigateByUrl('/entrenado-tabs/social').catch(console.error);
    }, 0);
  }
}
