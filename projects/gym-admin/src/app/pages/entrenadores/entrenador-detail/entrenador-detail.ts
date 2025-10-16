import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EntrenadorService
} from 'gym-library';
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

  readonly ejercicios = computed(() => this.entrenadorService.getEjerciciosByEntrenadorWithCreator(this.entrenadorId())());

  // Computed para ejercicios filtrados por el entrenador actual en el modal de rutina
  readonly ejerciciosFiltradosParaRutina = computed(() => {
    const rutinaData = this.rutinaModalData();
    const creadorId = rutinaData?.creadorId;

    if (!creadorId) {
      return this.ejercicios();
    }

    return this.ejercicios().filter((ej: any) =>
      ej.creadorId === creadorId && ej.creadorTipo === 'entrenador'
    );
  });

  // Signals para el estado del componente
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);

  // Signals para rutinas
  readonly isRutinaModalOpen = signal(false);
  readonly rutinaModalData = signal<any>(null);
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
      // Esperar un poco para que los datos se carguen
      setTimeout(() => {
        const entrenador = this.entrenador();
        if (entrenador) {
          this.pageTitleService.setTitle(`Entrenador: ${entrenador.displayName || id}`);
          this.createEditForm(entrenador);
        } else {
          // Si no se encuentra, redirigir
          this.router.navigate(['/entrenadores']);
        }
      }, 1000); // Ajustar el tiempo si es necesario
    } else {
      this.router.navigate(['/entrenadores']);
    }
  }

  private createEditForm(item: any) {
    const formConfig: any = {
      activo: new FormControl(item?.activo || false),
      rutinasAsociadas: new FormControl(item?.rutinas || []),
    };

    this.editForm.set(new FormGroup(formConfig));
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
      const rutinasCount = this.entrenadorService.getRutinasByEntrenador(entrenador.id).length;

      this.toastService.log(`Entrenador actualizado: ${usuarioEntrenadorNombre} - Entrenados: ${clientesCount} - Rutinas: ${rutinasCount}`);
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getRutinasByEntrenador(entrenadorId: string) {
    return this.entrenadorService.getRutinasByEntrenador(entrenadorId);
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

  addRutinaParaEntrenador() {
    this.openCreateRutinaModal();
  }

  addEjercicioParaEntrenador() {
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(true);
  }

  closeEjercicioModal() {
    this.isEjercicioModalOpen.set(false);
    this.isEjercicioCreating.set(false);
  }

  closeMensajeModal() {
    this.isMensajeModalOpen.set(false);
    this.isMensajeCreating.set(false);
  }

  closeInvitacionModal() {
    this.isInvitacionModalOpen.set(false);
  }

  openRutinaModal(item: any) {
    this.rutinaModalData.set(item);
    this.isRutinaModalOpen.set(true);
    this.isRutinaCreating.set(false);
  }

  openCreateRutinaModal() {
    this.rutinaModalData.set(null); // No crear objeto aquí, el modal lo maneja
    this.isRutinaModalOpen.set(true);
    this.isRutinaCreating.set(true);
  }

  closeRutinaModal() {
    this.isRutinaModalOpen.set(false);
    this.rutinaModalData.set(null);
    this.isRutinaCreating.set(false);
  }

  addMensaje(remitenteId?: string) {
    const remitenteIdFinal = remitenteId || this.entrenadorId();

    this.isMensajeModalOpen.set(true);
    this.isMensajeCreating.set(true);
  }

  addInvitacion() {
    this.isInvitacionModalOpen.set(true);
  }

  goBack() {
    this.router.navigate(['/entrenadores']);
  }
}
