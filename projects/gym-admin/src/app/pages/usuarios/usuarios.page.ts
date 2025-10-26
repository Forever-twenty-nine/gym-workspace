import { Component, ChangeDetectionStrategy, computed, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, EntrenadoService, EntrenadorService, GimnasioService, Rol, Objetivo } from 'gym-library';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent } from '../../components/shared/toast/toast.component';
import { UsuariosTable } from '../../components/usuarios-table/usuarios-table';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalFormComponent,
    ToastComponent,
    UsuariosTable
  ],
  templateUrl: './usuarios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosPage {
  // Servicios inyectados
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly fb = inject(FormBuilder);
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly ngZone = inject(NgZone);

  constructor() {
    this.pageTitleService.setTitle('Usuarios');
  }

  // Signals reactivas para datos
  readonly usuarios = computed(() => {
    return this.ngZone.run(() => {
      return this.userService.users().map(user => ({
        ...user,
        displayName: user.nombre || user.email || `Usuario ${user.uid}`,
        needsReview: !user.role // Solo marcar para revisar si no tiene rol asignado
      }));
    });
  });

  // Signals para el estado del componente
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly formFields = signal<FormFieldConfig[]>([]);

  addSampleUsuario() {
    this.openCreateModal();
  }

  async deleteUsuario(id: string) {
    return this.ngZone.run(async () => {
      await this.userService.deleteUser(id);
      this.toastService.log(`Usuario eliminado: ${id}`);
    });
  }

  openDetailsModal(item: any) {
    this.ngZone.run(async () => {
      // Si es entrenado, cargar el objetivo de forma asíncrona
      if (item.role === Rol.ENTRENADO) {
        try {
          // Esperar un tick para asegurar que estamos en zona
          await Promise.resolve();
          const entrenado = this.entrenadoService.getEntrenado(item.uid)();
          if (entrenado) {
            item.objetivo = entrenado.objetivo;
          }
        } catch (error) {
          console.warn('Error cargando objetivo del entrenado:', error);
        }
      }

      this.modalData.set(item);
      this.isModalOpen.set(true);
      this.isCreating.set(false);
      this.createEditForm(item);
    });
  }

  openCreateModal() {
    const newItem = this.createEmptyItem();
    this.modalData.set(newItem);
    this.isModalOpen.set(true);
    this.isCreating.set(true);
    this.createEditForm(newItem);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
    this.editForm.set(null);
    this.isLoading.set(false);
    this.isCreating.set(false);
  }

  private createEmptyItem(): any {
    const timestamp = Date.now();
    return {
      uid: 'u' + timestamp,
      email: '',
      password: ''
    };
  }

  private createEditForm(item: any) {
    let formConfig: any = {};

    if (this.isCreating()) {
      formConfig = {
        email: [item.email || '', [Validators.required, Validators.email]],
        password: [item.password || '', [Validators.required, Validators.minLength(6)]]
      };
    } else {
      formConfig = {
        nombre: [item.nombre || ''],
        email: [{ value: item.email || '', disabled: true }],
        role: [item.role || ''],
        emailVerified: [item.emailVerified || false],
        onboarded: [item.onboarded || false],
        plan: [item.plan || '']
      };

      // Agregar objetivo si es entrenado
      if (item.role === Rol.ENTRENADO) {
        formConfig.objetivo = [item.objetivo || ''];
      }
    }

    const form = this.fb.group(formConfig);
    this.editForm.set(form);

    // Actualizar campos del formulario
    this.updateFormFields();

    // Suscribirse a cambios en el rol para actualizar campos dinámicamente
    if (!this.isCreating()) {
      form.get('role')?.valueChanges.subscribe((newRole: any) => {
        this.handleRoleChangeInForm(newRole as Rol, item);
        this.updateFormFields();
      });
    }
  }

  async saveChanges() {
    const form = this.editForm();
    const originalData = this.modalData();

    if (!form || !originalData) {
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
      let updatedData = { ...originalData, ...form.value };

      if (this.isCreating()) {
        const password = updatedData.password;
        delete updatedData.password;
        
        const userDataForCreation = {
          email: updatedData.email,
        };
        
        await this.ngZone.run(async () => {
          await (this.userService as any).addUser(userDataForCreation, password);
        });
        this.toastService.log(`✅ Usuario creado con Firebase Auth: ${updatedData.email}`);
      } else {
        delete updatedData.password;
        
        const originalRole = originalData.role;
        const newRole = updatedData.role;
        
        if (originalRole !== newRole && newRole) {
          await this.ngZone.run(async () => {
            await this.handleRoleChange(updatedData.uid, newRole, updatedData);
          });
        }
        
        // Si es entrenado y cambió el objetivo, actualizar el documento entrenado
        if (originalData.role === Rol.ENTRENADO && updatedData.objetivo !== originalData.objetivo) {
          await this.ngZone.run(async () => {
            const currentEntrenado = this.entrenadoService.getEntrenado(updatedData.uid)();
            if (currentEntrenado) {
              const updatedEntrenado = { ...currentEntrenado, objetivo: updatedData.objetivo };
              await this.entrenadoService.save(updatedEntrenado);
              this.toastService.log(`✅ Objetivo actualizado para entrenado: ${updatedData.nombre || updatedData.email}`);
            }
          });
        }
        
        await this.ngZone.run(async () => {
          await this.userService.updateUser(updatedData.uid, updatedData);
        });
        this.toastService.log(`✅ Usuario actualizado: ${updatedData.nombre || updatedData.email}`);
      }

      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleRoleChange(uid: string, newRole: Rol, userData: any): Promise<void> {
    try {
      switch (newRole) {
        case Rol.ENTRENADO:
          const clienteData: any = {
            id: uid,
            activo: true,
            fechaRegistro: new Date(),
            objetivo: userData.objetivo || Objetivo.MANTENER_PESO
          };
          
          if (userData.gimnasioId && userData.gimnasioId !== '') {
            clienteData.gimnasioId = userData.gimnasioId;
          } else {
            clienteData.gimnasioId = '';
          }
          
          await this.entrenadoService.save(clienteData);
          userData.clienteId = uid;
          
          this.toastService.log(`✅ Documento Cliente creado para usuario: ${userData.nombre || userData.email}`);
          break;

        case Rol.GIMNASIO:
          const gimnasioData: any = {
            id: uid,
            nombre: userData.nombre || userData.email || 'Gimnasio',
            direccion: '',
            activo: true
          };
          
          await this.gimnasioService.save(gimnasioData);
          userData.gimnasioId = uid;
          
          this.toastService.log(`✅ Documento Gimnasio creado para usuario: ${userData.nombre || userData.email}`);
          break;

        case Rol.ENTRENADOR:
        case Rol.PERSONAL_TRAINER:
          const entrenadorData: any = {
            activo: true,
            fechaRegistro: new Date(),
            ejerciciosCreadasIds: [],
            entrenadosAsignadosIds: [],
            rutinasCreadasIds: []
          };
          
          // Crear o sobrescribir el documento del entrenador con el UID del usuario (idempotente)
          await this.entrenadorService.createWithId(uid, entrenadorData);
          
          userData.entrenadorId = uid;
          
          this.toastService.log(`✅ Documento Entrenador creado para usuario: ${userData.nombre || userData.email}`);
          break;

        default:
          this.toastService.log(`⚠️ Rol ${newRole} no requiere documento específico`);
          break;
      }
    } catch (error) {
      console.error('Error creando documento específico:', error);
      this.toastService.log(`❌ Error creando documento para rol ${newRole}: ${error}`);
      throw error;
    }
  }

  getRolesDisponibles() {
    return Object.values(Rol);
  }

  private handleRoleChangeInForm(newRole: Rol, originalItem: any) {
    const form = this.editForm();
    if (!form) return;

    if (newRole === Rol.ENTRENADO) {
      // Si cambia a ENTRENADO, agregar el control objetivo si no existe
      if (!form.contains('objetivo')) {
        // Intentar obtener el objetivo actual del entrenado si existe
        let objetivoValue = '';
        if (originalItem.role === Rol.ENTRENADO) {
          objetivoValue = originalItem.objetivo || '';
        } else {
          // Si no era entrenado, intentar cargar de la DB si existe documento
          this.ngZone.run(() => {
            const entrenado = this.entrenadoService.getEntrenado(originalItem.uid)();
            objetivoValue = entrenado?.objetivo || Objetivo.MANTENER_PESO;
          });
        }
        form.addControl('objetivo', this.fb.control(objetivoValue));
      }
    } else {
      // Si cambia de ENTRENADO a otro rol, remover el control objetivo
      if (form.contains('objetivo')) {
        form.removeControl('objetivo');
      }
    }
  }

  private updateFormFields() {
    const form = this.editForm();
    if (!form) return;

    const isCreating = this.isCreating();
    const currentRole = form.get('role')?.value;

    if (isCreating) {
      this.formFields.set([
        {
          name: 'email',
          type: 'text',
          inputType: 'email',
          label: 'Email',
          placeholder: 'email@ejemplo.com',
          colSpan: 2,
          required: true
        },
        {
          name: 'password',
          type: 'text',
          inputType: 'password',
          label: 'Contraseña',
          placeholder: 'Mínimo 6 caracteres',
          colSpan: 2,
          required: true
        }
      ]);
    } else {
      const fields: FormFieldConfig[] = [
        {
          name: 'nombre',
          type: 'text',
          label: 'Nombre',
          placeholder: 'Nombre del usuario',
          colSpan: 2
        },
        {
          name: 'email',
          type: 'text',
          inputType: 'email',
          label: 'Email',
          placeholder: 'email@ejemplo.com',
          colSpan: 2,
          readonly: true
        },
        {
          name: 'role',
          type: 'select',
          label: 'Rol',
          placeholder: 'Seleccionar rol',
          options: this.getRolesDisponibles().map(rol => ({ value: rol, label: rol })),
          colSpan: 2
        },
        {
          name: 'emailVerified',
          type: 'checkbox',
          label: 'Estado del Email',
          checkboxLabel: 'Email Verificado',
          colSpan: 1
        },
        {
          name: 'onboarded',
          type: 'checkbox',
          label: 'Estado de Onboarding',
          checkboxLabel: 'Usuario Completó Onboarding',
          colSpan: 1
        },
        {
          name: 'plan',
          type: 'select',
          label: 'Plan de Suscripción',
          placeholder: 'Seleccionar plan',
          options: [
            { value: 'free', label: 'Gratuito' },
            { value: 'premium', label: 'Premium' }
          ],
          colSpan: 2
        }
      ];

      // Agregar campo objetivo si es entrenado
      if (currentRole === Rol.ENTRENADO) {
        fields.push({
          name: 'objetivo',
          type: 'select',
          label: 'Objetivo',
          placeholder: 'Seleccionar objetivo',
          options: Object.values(Objetivo).map(obj => ({ value: obj, label: obj })),
          colSpan: 2
        });
      }

      this.formFields.set(fields);
    }
  }

}

