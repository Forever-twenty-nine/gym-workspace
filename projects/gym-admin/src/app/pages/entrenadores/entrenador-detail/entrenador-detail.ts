import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EntrenadorService, EjercicioService, RutinaService, NotificacionService, InvitacionService } from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { RutinaModalComponent } from '../../../components/rutina-modal/rutina-modal.component';
import { EjercicioModalComponent } from '../../../components/ejercicio-modal/ejercicio-modal.component';
import { MensajesModalComponent } from '../../../components/mensajes-modal/mensajes-modal.component';
import { InvitacionesModalComponent } from '../../../components/invitaciones-modal/invitaciones-modal.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-entrenador-detail',
  imports: [
    CommonModule,
    ToastComponent,
    RutinaModalComponent,
    EjercicioModalComponent,
    MensajesModalComponent,
    InvitacionesModalComponent
  ],
  templateUrl: './entrenador-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadorDetail implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  readonly entrenadorService = inject(EntrenadorService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly rutinaService = inject(RutinaService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly invitacionService = inject(InvitacionService);


  entrenadorId = signal<string>('');

  entrenador = computed(() => {
    const id = this.entrenadorId();
    return this.entrenadorService.getEntrenadoresWithUserInfo()().find(e => e.id === id);
  });

  // Signals para el estado del componente
  readonly isLoading = signal(false);

  // Signals para rutinas
  readonly isRutinaModalOpen = signal(false);
  readonly isRutinaCreating = signal(false);
  readonly rutinaToEdit = signal<any>(null);

  // Signals para ejercicios
  readonly isEjercicioModalOpen = signal(false);
  readonly isEjercicioCreating = signal(false);
  readonly ejercicioToEdit = signal<any>(null);

  // Signals para mensajes
  readonly isMensajeModalOpen = signal(false);
  readonly isMensajeCreating = signal(false);

  // Signals para invitaciones
  readonly isInvitacionModalOpen = signal(false);

  ngOnInit() {
    this.entrenadorService.initializeListener();
    // Inicializar listener de notificaciones para que se carguen las invitaciones
    this.notificacionService.notificaciones();
    // Inicializar listener de invitaciones
    this.invitacionService.invitaciones();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.entrenadorId.set(id);
      setTimeout(() => {
        const entrenador = this.entrenador();
        if (entrenador) {
          this.pageTitleService.setTitle(`Entrenador: ${entrenador.displayName || id}`);
        } else {
          this.router.navigate(['/entrenadores']);
        }
      }, 0);
    } else {
      this.router.navigate(['/entrenadores']);
    }
  }

  // --------------------------------------------
  // Rutinas
  // --------------------------------------------

  readonly rutinas = computed(() => this.entrenadorService.getRutinasByEntrenador(this.entrenadorId())());

  toggleModalRutinas(rutina?: any) {
    if (this.isRutinaModalOpen()) {
      this.isRutinaModalOpen.set(false);
      this.isRutinaCreating.set(false);
      this.rutinaToEdit.set(null);
    } else {
      this.isRutinaModalOpen.set(true);
      if (rutina) {
        this.isRutinaCreating.set(false);
        this.rutinaToEdit.set(rutina);
      } else {
        this.isRutinaCreating.set(true);
        this.rutinaToEdit.set(null);
      }
    }
  }

  // --------------------------------------------
  // Ejercicios
  // --------------------------------------------

  readonly ejercicios = computed(() => this.entrenadorService.getEjerciciosByEntrenador(this.entrenadorId())());

  toggleModalEjercicios(ejercicio?: any) {
    if (this.isEjercicioModalOpen()) {
      this.isEjercicioModalOpen.set(false);
      this.isEjercicioCreating.set(false);
      this.ejercicioToEdit.set(null);
    } else {
      this.isEjercicioModalOpen.set(true);
      if (ejercicio) {
        this.isEjercicioCreating.set(false);
        this.ejercicioToEdit.set(ejercicio);
      } else {
        this.isEjercicioCreating.set(true);
        this.ejercicioToEdit.set(null);
      }
    }
  }

  // --------------------------------------------
  // Invitaciones 
  // --------------------------------------------

  readonly invitaciones = computed(() => this.invitacionService.getInvitacionesPorEntrenador(this.entrenadorId())());

  toggleModalInvitaciones() {
    if (this.isInvitacionModalOpen()) {
      this.isInvitacionModalOpen.set(false);
    } else {
      this.isInvitacionModalOpen.set(true);
    }
  }
  // --------------------------------------------
  // Mensajes
  // --------------------------------------------

  readonly mensajes = computed(() => this.entrenadorService.getMensajesByEntrenador(this.entrenadorId())());

  toggleModalMensajes() {
    if (this.isMensajeModalOpen()) {
      this.isMensajeModalOpen.set(false);
      this.isMensajeCreating.set(false);
    } else {
      this.isMensajeModalOpen.set(true);
      this.isMensajeCreating.set(true);
    }
  }
  // --------------------------------------------
  // Boton volver
  // --------------------------------------------
  goBack() {
    this.router.navigate(['/entrenadores']);
  }

  // --------------------------------------------
  // Edición y eliminación de ejercicios
  // --------------------------------------------
  editEjercicio(ejercicio: any) {
    this.toggleModalEjercicios(ejercicio);
  }

  async deleteEjercicio(ejercicio: any) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el ejercicio "${ejercicio.nombre}"?`)) {
      return;
    }

    try {
      await this.ejercicioService.delete(ejercicio.id);
      this.toastService.log(`Ejercicio eliminado: ${ejercicio.nombre}`);
    } catch (error: any) {
      console.error('Error al eliminar ejercicio:', error);
      this.toastService.log(`ERROR al eliminar ejercicio: ${error.message}`);
    }
  }

  // --------------------------------------------
  // Edición y eliminación de rutinas
  // --------------------------------------------
  editRutina(rutina: any) {
    this.toggleModalRutinas(rutina);
  }

  async deleteRutina(rutina: any) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la rutina "${rutina.nombre}"?`)) {
      return;
    }

    try {
      await this.rutinaService.delete(rutina.id);
      this.toastService.log(`Rutina eliminada: ${rutina.nombre}`);
    } catch (error: any) {
      console.error('Error al eliminar rutina:', error);
      this.toastService.log(`ERROR al eliminar rutina: ${error.message}`);
    }
  }
}
