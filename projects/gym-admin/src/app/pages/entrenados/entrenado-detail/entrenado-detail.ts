import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
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
  PlanLimitError
} from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';
import { RutinaSesionModalComponent } from '../rutina-sesion.modal/rutina-sesion.modal';

@Component({
  selector: 'app-entrenado-detail',
  imports: [
  CommonModule,
  ToastComponent,
  RouterModule,
  RutinaSesionModalComponent
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
  // Usaremos el InvitacionService.aceptarInvitacion implementado en la librería

  entrenadoId = signal<string>('');

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

  // Signals para el estado del componente
  readonly isLoading = signal(false);
  readonly mostrarInvitaciones = signal(false);
  readonly mostrarModalSesiones = signal(false);
  readonly rutinaSeleccionada = signal<string>('');

  ngOnInit() {
    // Los listeners se inicializan automáticamente cuando se accede a las señales
    this.entrenadorService.initializeListener();
    this.rutinaService.rutinas(); // Forzar inicialización del listener de rutinas
    // Inicializar listeners de invitaciones
    this.invitacionService.invitaciones();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.entrenadoId.set(id);
      // Inicializar listener de estadísticas para este entrenado
      this.estadisticasService.initializeListener(id);
      setTimeout(() => {
        const entrenado = this.entrenado();
        if (entrenado) {
          this.pageTitleService.setTitle(`Entrenado: ${entrenado.displayName || id}`);
        } else {
          this.router.navigate(['/entrenados']);
        }
      }, 0);
    } else {
      this.router.navigate(['/entrenados']);
    }
  }

  // Rutinas asignadas al entrenado con sesiones
  readonly rutinasAsignadas = computed(() => {
    const entrenado = this.entrenado();
    if (!entrenado?.rutinasAsignadas) return [];

    return this.rutinaService.rutinas()
      .filter(rutina => entrenado.rutinasAsignadas!.includes(rutina.id))
      .map(rutina => {
        // Buscar la última sesión de esta rutina para este entrenado
        const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(entrenado.id)().filter(s => s.rutinaResumen.id === rutina.id);
        // Derivar estado de progreso desde la última sesión
        const ultimaSesion = sesiones && sesiones.length > 0 ? sesiones[sesiones.length - 1] : null;
        return {
          ...rutina,
          sesion: ultimaSesion
        };
      });
  });

  // Rutinas organizadas por días de la semana (solo semana actual)
  readonly rutinasPorDia = computed(() => {
    const rutinas = this.rutinasAsignadas();
    const hoy = new Date();

    // Calcular fechas para la próxima semana (7 días)
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(fecha);
    }

    // Organizar por día
    const rutinasOrganizadas: { [key: string]: { fecha: Date; rutinas: any[]; diaCorto: string; diaCompleto: string; esHoy: boolean; } } = {};

    fechas.forEach(fecha => {
      // Usar los mismos valores que se guardan en el modal (sin tildes)
      const diaSemanaIndex = fecha.getDay();
      const diasSemanaSinTilde = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diasSemanaConTilde = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const diasSemanaCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      const diaSemana = diasSemanaSinTilde[diaSemanaIndex]; // Usar sin tilde para comparación
      const diaCorto = diasSemanaCorto[diaSemanaIndex];
      const diaCompleto = diasSemanaConTilde[diaSemanaIndex]; // Mostrar con tilde
      const fechaKey = fecha.toISOString().split('T')[0];

      if (!rutinasOrganizadas[fechaKey]) {
        rutinasOrganizadas[fechaKey] = {
          fecha: new Date(fecha),
          rutinas: [],
          diaCorto,
          diaCompleto,
          esHoy: fecha.toDateString() === hoy.toDateString()
        };
      }

      // Agregar rutinas que corresponden a este día
      rutinas.forEach(rutina => {
        if (rutina.DiasSemana && rutina.DiasSemana.includes(diaSemana)) {
          rutinasOrganizadas[fechaKey].rutinas.push(rutina);
        }
      });
    });

    // Convertir a array y ordenar por fecha
    return Object.values(rutinasOrganizadas).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
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

  // --------------------------------------------
  // Boton volver
  // --------------------------------------------
  goBack() {
    this.router.navigate(['/entrenados']);
  }

  // --------------------------------------------
  // Formatear fecha
  // --------------------------------------------
  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // --------------------------------------------
  // Ver progreso detallado de una rutina
  // --------------------------------------------
  // Método de progreso eliminado. Usar sesiones o estadísticas si es necesario.

  // --------------------------------------------
  // Aceptar invitación
  // --------------------------------------------
  async aceptarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.aceptarInvitacion(invitacion.id);
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
  async rechazarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.rechazarInvitacion(invitacion.id);
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
}