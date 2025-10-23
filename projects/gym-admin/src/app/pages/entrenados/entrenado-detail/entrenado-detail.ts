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
  RutinaAsignadaService,
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
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  // Usaremos el InvitacionService.aceptarInvitacion implementado en la librería

  // Día actual de la semana (0 = domingo, 1 = lunes, etc.)
  readonly diaActual = new Date().getDay();

  // Función para obtener los próximos 7 días
  private getProximos7Dias(): { fecha: Date; diaNombre: string; diaNumero: number }[] {
    const dias = [];
    const hoy = new Date();

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const diaNumero = fecha.getDay();
      const nombresDias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaNombre = nombresDias[diaNumero];

      dias.push({
        fecha,
        diaNombre,
        diaNumero
      });
    }

    return dias;
  }

  entrenadoId = signal<string>('');

  // Signals para el estado del componente
  readonly isLoading = signal(false);
  readonly mostrarInvitaciones = signal(false);
  readonly mostrarModalSesiones = signal(false);
  readonly rutinaSeleccionada = signal<string>('');

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

    this.entrenadorService.initializeListener();
    this.rutinaService.rutinas();
    this.invitacionService.invitaciones();
    this.rutinaAsignadaService.getRutinasAsignadas();
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

  // Rutinas organizadas por días de la semana (vista semanal)
  readonly rutinasPorDia = computed(() => {
    const rutinasAsignadas = this.rutinasAsignadasConInfo();
    const proximos7Dias = this.getProximos7Dias();

    return proximos7Dias.map(diaInfo => {
      const rutinasDelDia: any[] = [];

      // Agregar rutinas asignadas por día de la semana
      rutinasAsignadas.forEach(item => {
        // Verificar si diaSemana es un array (múltiples días) o un string (día único)
        const diasAsignados = Array.isArray(item.diaSemana) ? item.diaSemana : [item.diaSemana];

        if (diasAsignados.includes(diaInfo.diaNombre)) {
          rutinasDelDia.push({
            ...item,
            tipoAsignacion: 'dia_semana'
          });
        }
      });

      // Agregar rutinas con fecha específica para este día
      rutinasAsignadas.forEach(item => {
        if (item.fechaEspecifica) {
          const fechaRutina = item.fechaEspecifica.toISOString().split('T')[0];
          const fechaDia = diaInfo.fecha.toISOString().split('T')[0];
          if (fechaRutina === fechaDia) {
            rutinasDelDia.push({
              ...item,
              tipoAsignacion: 'fecha_especifica'
            });
          }
        }
      });

      return {
        ...diaInfo,
        rutinas: rutinasDelDia,
        esHoy: diaInfo.fecha.toDateString() === new Date().toDateString(),
        fechaFormateada: diaInfo.fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        })
      };
    });
  });

  // Verificar si no hay rutinas asignadas en toda la semana
  readonly noHayRutinasAsignadas = computed(() => {
    return this.rutinasPorDia().every(dia => dia.rutinas.length === 0);
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