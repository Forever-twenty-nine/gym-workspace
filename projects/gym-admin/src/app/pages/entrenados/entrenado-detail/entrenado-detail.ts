import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EntrenadoService,
  UserService,
  RutinaService,
  EntrenadorService,
  InvitacionService
} from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-entrenado-detail',
  imports: [
    CommonModule,
    ToastComponent
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

  ngOnInit() {
    // Los listeners se inicializan automáticamente cuando se accede a las señales
    this.entrenadorService.initializeListener();
    // Inicializar listeners de invitaciones
    this.invitacionService.invitaciones();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.entrenadoId.set(id);
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

  // Rutinas asignadas al entrenado
  readonly rutinasAsignadas = computed(() => {
    const entrenado = this.entrenado();
    if (!entrenado?.rutinasAsignadas) return [];

    return this.rutinaService.rutinas()
      .filter(rutina => entrenado.rutinasAsignadas!.includes(rutina.id))
      .map(rutina => ({
        ...rutina
      }));
  });

  // Invitaciones pendientes del entrenado
  readonly invitacionesPendientes = computed(() => {
    const id = this.entrenadoId();
    if (!id) return [];

    return this.invitacionService.getInvitacionesPendientesPorEntrenado(id)();
  });

  // Estadísticas computadas
  // Estadísticas eliminadas: sección removida del template

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
  // Marcar rutina como completada
  // --------------------------------------------
  async marcarRutinaCompletada(rutina: any) {
    try {
      const rutinaActualizada = {
        ...rutina,
        completado: !rutina.completado
      };

      await this.rutinaService.save(rutinaActualizada);
      this.toastService.log(`Rutina ${rutina.completado ? 'desmarcada' : 'marcada'} como completada`);
    } catch (error: any) {
      console.error('Error al actualizar rutina:', error);
      this.toastService.log(`ERROR: ${error.message}`);
    }
  }

  // --------------------------------------------
  // Aceptar invitación
  // --------------------------------------------
  async aceptarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.aceptarInvitacion(invitacion.id);
      this.toastService.log('Invitación aceptada y vinculada correctamente');
    } catch (error: any) {
      console.error('Error al aceptar y vincular invitación:', error);
      this.toastService.log(`ERROR: ${error.message}`);
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
}