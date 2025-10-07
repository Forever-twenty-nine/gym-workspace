import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, EntrenadoService, EntrenadorService, GimnasioService, Rol } from 'gym-library';
import { GenericCardComponent, CardConfig } from '../../components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent, Toast } from '../../components/shared/toast/toast.component';
import { FirebaseAuthAdapter } from '../../adapters/firebase-auth.adapter';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-6">Usuarios</h1>
      
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card de Usuarios -->
        <app-generic-card
          [config]="usuariosCardConfig"
          [items]="usuarios()"
          [idField]="'uid'"
          (create)="addSampleUsuario()"
          (edit)="openDetailsModal($event)"
          (delete)="deleteUsuario($event)">
        </app-generic-card>
      </section>

      <!-- Toasts -->
      <app-toast 
        [toasts]="toasts()" 
        (closeToast)="removeToast($event)">
      </app-toast>

      <!-- Modal de edición -->
      <app-modal-form
        [isOpen]="isModalOpen()"
        [modalType]="'usuario'"
        [isCreating]="isCreating()"
        [form]="editForm()"
        [formFields]="getFormFields()"
        [ejercicios]="[]"
        [selectedEjercicios]="[]"
        [isLoading]="isLoading()"
        (close)="closeModal()"
        (save)="saveChanges()"
        (toggleDiaSemana)="onToggleDiaSemana($event)"
        (toggleEjercicio)="toggleEjercicio($event)">
      </app-modal-form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosPage {
  // Servicios inyectados
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly firebaseAuthAdapter = inject(FirebaseAuthAdapter);
  private readonly fb = inject(FormBuilder);

  // Signals reactivas para datos
  readonly usuarios = computed(() => {
    return this.userService.users().map(user => {
      const needsReview = !user.nombre || !user.role;
      return {
        ...user,
        displayName: user.nombre || user.email || `Usuario ${user.uid}`,
        needsReview
      };
    });
  });

  // Configuración del card
  readonly usuariosCardConfig: CardConfig = {
    title: 'Usuarios',
    createButtonText: 'Crear Usuario',
    createButtonColor: 'blue',
    emptyStateTitle: 'No hay usuarios creados',
    displayField: 'displayName',
    showCounter: true,
    counterColor: 'blue'
  };

  // Signals para el estado del componente
  readonly toasts = signal<Toast[]>([]);
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000) {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      isVisible: false
    };

    this.toasts.update(toasts => [...toasts, toast]);

    setTimeout(() => {
      this.toasts.update(toasts => 
        toasts.map(t => t.id === id ? { ...t, isVisible: true } : t)
      );
    }, 10);

    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  private showSuccess(message: string, duration?: number) {
    this.showToast(message, 'success', duration);
  }

  private showError(message: string, duration?: number) {
    this.showToast(message, 'error', duration);
  }

  private log(msg: string) {
    const cleanMsg = msg.replace(/✅|❌|⚠️/g, '').trim();
    
    if (msg.includes('Error') || msg.includes('ERROR') || msg.includes('❌')) {
      this.showError(cleanMsg);
    } else if (msg.includes('⚠️') || msg.includes('Warning')) {
      this.showToast(cleanMsg, 'warning');
    } else if (msg.includes('✅') || msg.includes('creado') || msg.includes('actualizado') || msg.includes('eliminado')) {
      this.showSuccess(cleanMsg);
    } else {
      this.showToast(cleanMsg, 'info');
    }
  }

  removeToast(id: string) {
    this.toasts.update(toasts => 
      toasts.map(t => t.id === id ? { ...t, isVisible: false } : t)
    );

    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 300);
  }

  addSampleUsuario() {
    this.openCreateModal();
  }

  async deleteUsuario(id: string) {
    await this.userService.deleteUser(id);
    this.log(`Usuario eliminado: ${id}`);
  }

  openDetailsModal(item: any) {
    this.modalData.set(item);
    this.isModalOpen.set(true);
    this.isCreating.set(false);
    this.createEditForm(item);
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
    }

    this.editForm.set(this.fb.group(formConfig));
  }

  async saveChanges() {
    const form = this.editForm();
    const originalData = this.modalData();

    if (!form || !originalData) {
      this.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.log('Error: Por favor, completa todos los campos obligatorios');
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
        
        await (this.userService as any).addUser(userDataForCreation, password);
        this.log(`✅ Usuario creado con Firebase Auth: ${updatedData.email}`);
      } else {
        delete updatedData.password;
        
        const originalRole = originalData.role;
        const newRole = updatedData.role;
        
        if (originalRole !== newRole && newRole) {
          await this.handleRoleChange(updatedData.uid, newRole, updatedData);
        }
        
        await this.userService.updateUser(updatedData.uid, updatedData);
        this.log(`✅ Usuario actualizado: ${updatedData.nombre || updatedData.email}`);
      }

      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`Error al guardar los cambios: ${error}`);
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
            objetivo: 'MANTENER_PESO'
          };
          
          if (userData.gimnasioId && userData.gimnasioId !== '') {
            clienteData.gimnasioId = userData.gimnasioId;
          } else {
            clienteData.gimnasioId = '';
          }
          
          await this.entrenadoService.save(clienteData);
          userData.clienteId = uid;
          
          this.log(`✅ Documento Cliente creado para usuario: ${userData.nombre || userData.email}`);
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
          
          this.log(`✅ Documento Gimnasio creado para usuario: ${userData.nombre || userData.email}`);
          break;

        case Rol.ENTRENADOR:
        case Rol.PERSONAL_TRAINER:
          const entrenadorData: any = {
            gimnasioId: '',
            activo: true,
            clientes: [],
            rutinas: []
          };
          
          const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
          if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
            await entrenadorServiceAdapter.createWithId(uid, entrenadorData);
          } else {
            this.log(`⚠️ Usando método create normal para entrenador`);
            const tempId = await this.entrenadorService.create(entrenadorData);
            await this.entrenadorService.delete(tempId);
            
            if (entrenadorServiceAdapter) {
              await entrenadorServiceAdapter.update(uid, entrenadorData);
            } else {
              throw new Error('No se puede acceder al adaptador de entrenador');
            }
          }
          
          userData.entrenadorId = uid;
          
          this.log(`✅ Documento Entrenador creado para usuario: ${userData.nombre || userData.email}`);
          break;

        default:
          this.log(`⚠️ Rol ${newRole} no requiere documento específico`);
          break;
      }
    } catch (error) {
      console.error('Error creando documento específico:', error);
      this.log(`❌ Error creando documento para rol ${newRole}: ${error}`);
      throw error;
    }
  }

  getRolesDisponibles() {
    return Object.values(Rol);
  }

  getFormFields(): FormFieldConfig[] {
    if (this.isCreating()) {
      return [
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
      ];
    } else {
      return [
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
    }
  }

  // Métodos requeridos por el modal pero no usados en esta página
  onToggleDiaSemana(eventData: { event: Event; value: string }) {
    // No se usa en usuarios
  }

  toggleEjercicio(ejercicioId: string) {
    // No se usa en usuarios
  }
}

