import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, EntrenadoService, EntrenadorService, GimnasioService, MensajeService, Rol } from 'gym-library';
import { GenericCardComponent } from '../../components/shared/generic-card/generic-card.component';
import { CardConfig } from '../../components/shared/generic-card/generic-card.types';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent } from '../../components/shared/toast/toast.component';
import { FirebaseAuthAdapter } from '../../adapters/firebase-auth.adapter';
import { DisplayHelperService } from '../../services/display-helper.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
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
  private readonly mensajeService = inject(MensajeService);
  private readonly firebaseAuthAdapter = inject(FirebaseAuthAdapter);
  private readonly fb = inject(FormBuilder);
  private readonly displayHelper = inject(DisplayHelperService);
  readonly toastService = inject(ToastService);

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

  // Signals para mensajes (todos los mensajes sin filtro)
  readonly mensajes = computed(() => {
    return this.mensajeService.mensajes().map(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      const destinatario = this.usuarios().find(u => u.uid === mensaje.destinatarioId);
      
      const remitenteNombre = remitente?.nombre || remitente?.email || `Usuario ${mensaje.remitenteId}`;
      const destinatarioNombre = destinatario?.nombre || destinatario?.email || `Usuario ${mensaje.destinatarioId}`;
      
      const titulo = this.displayHelper.getTituloMensaje(mensaje.tipo);
      
      return {
        ...mensaje,
        titulo,
        remitenteChip: `De: ${remitenteNombre}`,
        destinatarioChip: `Para: ${destinatarioNombre}`
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

  readonly mensajesCardConfig: CardConfig = {
    title: 'Todos los Mensajes',
    createButtonText: 'N/A',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay mensajes en el sistema',
    displayField: 'titulo',
    showCounter: true,
    counterColor: 'purple',
    showChips: ['remitenteChip', 'destinatarioChip']
  };

  // Signals para el estado del componente
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);

  addSampleUsuario() {
    this.openCreateModal();
  }

  async deleteUsuario(id: string) {
    await this.userService.deleteUser(id);
    this.toastService.log(`Usuario eliminado: ${id}`);
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
        
        await (this.userService as any).addUser(userDataForCreation, password);
        this.toastService.log(`✅ Usuario creado con Firebase Auth: ${updatedData.email}`);
      } else {
        delete updatedData.password;
        
        const originalRole = originalData.role;
        const newRole = updatedData.role;
        
        if (originalRole !== newRole && newRole) {
          await this.handleRoleChange(updatedData.uid, newRole, updatedData);
        }
        
        await this.userService.updateUser(updatedData.uid, updatedData);
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
            objetivo: 'MANTENER_PESO'
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
            gimnasioId: '',
            activo: true,
            clientes: [],
            rutinas: []
          };
          
          const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
          if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
            await entrenadorServiceAdapter.createWithId(uid, entrenadorData);
          } else {
            this.toastService.log(`⚠️ Usando método create normal para entrenador`);
            const tempId = await this.entrenadorService.create(entrenadorData);
            await this.entrenadorService.delete(tempId);
            
            if (entrenadorServiceAdapter) {
              await entrenadorServiceAdapter.update(uid, entrenadorData);
            } else {
              throw new Error('No se puede acceder al adaptador de entrenador');
            }
          }
          
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

  // ========================================
  // MÉTODOS PARA MENSAJES
  // ========================================
  
  openMensajeModal(item: any) {
    // Abrir modal en modo solo lectura
    this.toastService.log(`Ver mensaje: ${item.titulo || 'Mensaje'}`);
    // Aquí podrías implementar un modal de visualización si lo necesitas
  }

  async deleteMensaje(id: string) {
    try {
      await this.mensajeService.delete(id);
      this.toastService.log('Mensaje eliminado correctamente');
    } catch (error) {
      this.toastService.log('ERROR al eliminar mensaje');
      console.error('Error al eliminar mensaje:', error);
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

