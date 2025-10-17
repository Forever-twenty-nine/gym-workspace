import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EntrenadorService} from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { RutinaModalComponent } from '../../../components/rutina-modal/rutina-modal.component';
import { EjercicioModalComponent } from '../../../components/ejercicio-modal/ejercicio-modal.component';
import { MensajesModalComponent } from '../../../components/mensajes-modal/mensajes-modal.component';
import { InvitacionesModalComponent } from '../../../components/invitaciones-modal/invitaciones-modal.component';
import { FormFieldConfig } from '../../../components/modal-form/modal-form.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-entrenador-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
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


  entrenadorId = signal<string>('');

  entrenador = computed(() => {
    const id = this.entrenadorId();
    return this.entrenadorService.getEntrenadoresWithUserInfo()().find(e => e.id === id);
  });

  // Signals para el estado del componente
  readonly editForm = computed(() => {
    const entrenador = this.entrenador();
    if (!entrenador) return null;
    const formConfig: any = {
      activo: new FormControl(entrenador.activo || false),
    };
    return new FormGroup(formConfig);
  });
  readonly isLoading = signal(false);

  // Signals para rutinas
  readonly isRutinaModalOpen = signal(false);
  readonly isRutinaCreating = signal(false);

  // Signals para ejercicios
  readonly isEjercicioModalOpen = signal(false);
  readonly isEjercicioCreating = signal(false);

  // Signals para mensajes
  readonly isMensajeModalOpen = signal(false);
  readonly isMensajeCreating = signal(false);

  // Signals para invitaciones
  readonly isInvitacionModalOpen = signal(false);

  ngOnInit() {
    this.entrenadorService.initializeListener();
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

  async saveChanges() {
    const form = this.editForm();
    const entrenador = this.entrenador();

    if (!form || !entrenador) {
      this.toastService.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    try {
      let updatedData = { ...entrenador, ...form.value };

      const entrenadorDataToSave = {
        ...updatedData
      };

      delete entrenadorDataToSave.displayName;
      delete entrenadorDataToSave.email;
      delete entrenadorDataToSave.plan;

      await this.entrenadorService.update(entrenadorDataToSave.id, entrenadorDataToSave);

      const usuarioEntrenadorNombre = entrenador.displayName || entrenador.id;
      const clientesCount = this.entrenadorService.getClientesCount(entrenador.id);
      const rutinasCount = this.rutinas().length;

      this.toastService.log(`Entrenador actualizado: ${usuarioEntrenadorNombre} - Entrenados: ${clientesCount} - Rutinas: ${rutinasCount}`);
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'activo',
        type: 'checkbox',
        label: 'Estado',
        checkboxLabel: 'Entrenador Activo',
        colSpan: 2
      }
    ];
  }
  // --------------------------------------------
  // Rutinas
  // --------------------------------------------

  readonly rutinas = computed(() => this.entrenadorService.getRutinasByEntrenador(this.entrenadorId())());

  toggleModalRutinas() {
    if (this.isRutinaModalOpen()) {
      this.isRutinaModalOpen.set(false);
      this.isRutinaCreating.set(false);
    } else {
      this.isRutinaModalOpen.set(true);
      this.isRutinaCreating.set(true);
    }
  }

  // --------------------------------------------
  // Ejercicios
  // --------------------------------------------

  readonly ejercicios = computed(() => this.entrenadorService.getEjerciciosByEntrenador(this.entrenadorId())());

  toggleModalEjercicios() {
    if (this.isEjercicioModalOpen()) {
      this.isEjercicioModalOpen.set(false);
      this.isEjercicioCreating.set(false);
    } else {
      this.isEjercicioModalOpen.set(true);
      this.isEjercicioCreating.set(true);
    }
  }

  // --------------------------------------------
  // Invitaciones 
  // --------------------------------------------

  readonly invitaciones = computed(() => this.entrenadorService.getInvitacionesByEntrenador(this.entrenadorId())());

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
}
