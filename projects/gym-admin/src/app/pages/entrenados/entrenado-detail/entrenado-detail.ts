import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  EntrenadoService,
  UserService,
  RutinaService,
  EntrenadorService,
  InvitacionService,
  SesionRutinaService,
  EjercicioService,
  EstadisticasEntrenadoService,
  RutinaAsignadaService,
  NotificacionService,
  PlanLimitError,
  Invitacion,
  RutinaAsignada
} from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';
import { RutinaSesionModalComponent } from '../rutina-sesion.modal/rutina-sesion.modal';
import { RutinasSemanalComponent } from './rutinas-semanal/rutinas-semanal';
import { InvitacionesComponent } from './invitaciones/invitaciones';

// Tipos locales que extienden los de la librería
type RutinaAsignadaConInfo = RutinaAsignada & {
  rutina?: any;
  tipoAsignacion?: string;
};

interface DiaInfo {
  fecha: Date;
  diaNombre: string;
  diaNumero: number;
  rutinas: RutinaAsignadaConInfo[];
  esHoy: boolean;
  fechaFormateada: string;
}

@Component({
  selector: 'app-entrenado-detail',
  imports: [
  CommonModule,
  ToastComponent,
  RouterModule,
  RutinaSesionModalComponent,
  RutinasSemanalComponent,
  InvitacionesComponent
  ],
  templateUrl: './entrenado-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoDetail implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly rutinaService = inject(RutinaService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly estadisticasService = inject(EstadisticasEntrenadoService);
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  private readonly notificacionService = inject(NotificacionService);
  // Usaremos el InvitacionService.aceptarInvitacion implementado en la librería

    // Día actual de la semana (0 = domingo, 1 = lunes, etc.)
  readonly diaActual = new Date().getDay();

  entrenadoId = signal<string>('');

  // Signals para el estado del componente
  readonly isLoading = signal(false);
  readonly mostrarInvitaciones = signal(false);
  readonly mostrarModalSesiones = signal(false);
  readonly rutinaSeleccionada = signal<string>('');
  readonly navigated = signal(false);

  constructor() {
    // Effect para actualizar el título y manejar navegación
    effect(() => {
      const entrenado = this.entrenado();
      const id = this.entrenadoId();
      if (entrenado) {
        this.pageTitleService.setTitle(`Entrenado: ${entrenado.displayName || id}`);
      } else if (!this.navigated()) {
        this.navigated.set(true);
        this.router.navigate(['/entrenados']);
      }
    });
  }

  entrenado = computed(() => {
    const id = this.entrenadoId();
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === id);
    if (!entrenado) return null;

    const usuario = this.userService.users().find(u => u.uid === entrenado.id);
    const entrenadorId = entrenado.entrenadoresId?.[0];
    const entrenador = entrenadorId ? this.entrenadorService.entrenadores().find(e => e.id === entrenadorId) : null;
    const entrenadorUsuario = entrenador ? this.userService.users().find(u => u.uid === entrenador.id) : null;

    return {
      ...entrenado,
      displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
      email: usuario?.email || '',
      plan: usuario?.plan || 'free',
      entrenadorName: entrenadorUsuario?.nombre || entrenadorUsuario?.email || (entrenadorId ? `Entrenador ${entrenadorId}` : 'Sin asignar')
    };
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.entrenadoId.set(id);
      this.estadisticasService.initializeListener(id);
    }

    this.entrenadorService.initializeListener();
    this.rutinaService.rutinas();
    this.invitacionService.invitaciones();
    this.rutinaAsignadaService.getRutinasAsignadas();
    // Inicializar listener de notificaciones para que se carguen las notificaciones del entrenado
    this.notificacionService.notificaciones();
  }

    // Rutinas asignadas al entrenado con información completa
  readonly rutinasAsignadasConInfo = computed(() => {
    const entrenadoId = this.entrenadoId();
    if (!entrenadoId) return [];

    const rutinasAsignadas = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(entrenadoId)();
    const rutinas = this.rutinaService.rutinas();

    return rutinasAsignadas
      .filter(ra => ra.activa)
      .map(ra => {
        const rutina = rutinas.find(r => r.id === ra.rutinaId);
        return {
          ...ra,
          rutina: rutina || null
        };
      })
      .filter(item => item.rutina !== null);
  });

  // Estadísticas del entrenado
  readonly estadisticas = computed(() => {
    const id = this.entrenadoId();
    return this.estadisticasService.getEstadisticas(id)();
  });

  // Invitaciones pendientes del entrenado
  readonly invitacionesPendientes = computed(() => {
    const id = this.entrenadoId();
    if (!id) return [];

    return this.invitacionService.getInvitacionesPendientesPorEntrenado(id)();
  });

  // Notificaciones del entrenado (solo no leídas)
  readonly notificacionesEntrenado = computed(() => {
    const id = this.entrenadoId();
    if (!id) return [];

    return this.notificacionService.getNotificacionesNoLeidas(id)();
  });

  // Notificaciones no leídas del entrenado
  readonly notificacionesNoLeidas = computed(() => {
    const id = this.entrenadoId();
    if (!id) return 0;

    return this.notificacionService.getContadorNoLeidas(id)();
  });

  // --------------------------------------------
  // Boton volver
  // --------------------------------------------
  goBack() {
    this.router.navigate(['/entrenados']);
  }

  // --------------------------------------------
  // Ver progreso detallado de una rutina
  // --------------------------------------------
  // Método de progreso eliminado. Usar sesiones o estadísticas si es necesario.

  // --------------------------------------------
  // Aceptar invitación
  // --------------------------------------------
  async aceptarInvitacion(invitacionId: string) {
    try {
      await this.invitacionService.aceptarInvitacion(invitacionId);
      this.toastService.log('Invitación aceptada y vinculada correctamente');
    } catch (error: any) {
      console.error('Error al aceptar y vincular invitación:', error);
      if (error instanceof PlanLimitError) {
        this.toastService.log('El entrenador ha alcanzado el límite de clientes para su plan. No se puede aceptar la invitación.');
      } else {
        this.toastService.log(`ERROR: ${error.message}`);
      }
    }
  }

  // --------------------------------------------
  // Rechazar invitación
  // --------------------------------------------
  async rechazarInvitacion(invitacionId: string) {
    try {
      await this.invitacionService.rechazarInvitacion(invitacionId);
      this.toastService.log('Invitación rechazada');
    } catch (error: any) {
      console.error('Error al rechazar invitación:', error);
      this.toastService.log(`ERROR: ${error.message}`);
    }
  }

  // --------------------------------------------
  // Abrir modal de sesiones de rutina
  // --------------------------------------------
  abrirModalSesiones(rutinaId: string) {
    if (!rutinaId || rutinaId.trim() === '') {
      console.error('No se puede abrir el modal: rutinaId está vacío');
      return;
    }

    this.rutinaSeleccionada.set(rutinaId);
    this.mostrarModalSesiones.set(true);
  }

  cerrarModalSesiones() {
    this.mostrarModalSesiones.set(false);
    this.rutinaSeleccionada.set('');
  }

  // --------------------------------------------
  // Handlers para subcomponente de invitaciones
  // --------------------------------------------
  toggleMostrarInvitaciones() {
    this.mostrarInvitaciones.set(!this.mostrarInvitaciones());
  }

  onAceptarInvitacion(invitacionId: string) {
    this.aceptarInvitacion(invitacionId);
  }

  onRechazarInvitacion(invitacionId: string) {
    this.rechazarInvitacion(invitacionId);
  }

  // --------------------------------------------
  // Manejo de notificaciones
  // --------------------------------------------
  async marcarTodasNotificacionesComoLeidas() {
    try {
      const entrenadoId = this.entrenadoId();
      if (entrenadoId) {
        await this.notificacionService.marcarTodasComoLeidas(entrenadoId);
        this.toastService.log('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      this.toastService.log('Error al marcar notificaciones como leídas');
    }
  }
}