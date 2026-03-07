import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Rol, Objetivo } from 'gym-library';
import { UserService } from '../../services/user.service';
import { EntrenadoService } from '../../services/entrenado.service';
import { EntrenadorService } from '../../services/entrenador.service';
import { GimnasioService } from '../../services/gimnasio.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataComponent
  ],
  templateUrl: './usuarios.page.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosPage {
  // Servicios inyectados
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly schemaService = inject(SchemaService);

  // Schema configuration
  readonly columns = this.schemaService.getColumns('usuario');
  readonly fields = signal(this.schemaService.getFields('usuario'));

  // Signals para el estado del componente
  readonly isLoading = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Usuarios');
  }

  // Signals reactivas para datos
  readonly usuarios = computed(() => {
    return this.userService.users().map(user => ({
      ...user,
      id: user.uid, // Aseguramos que tenga 'id' para DataComponent
      displayName: user.nombre || user.email || `Usuario ${user.uid}`,
      needsReview: !user.role // Solo marcar para revisar si no tiene rol asignado
    }));
  });

  async onSave(data: any) {
    this.isLoading.set(true);
    try {
      const id = data.uid || data.id;
      const isEditing = !!id;

      if (isEditing) {
        const originalUser = this.userService.users().find(u => u.uid === id);
        const originalRole = originalUser?.role;
        const newRole = data.role as Rol;

        if (originalRole !== newRole && newRole) {
          await this.handleRoleChange(id, newRole, data);
        }

        await this.userService.updateUser(id, data);
        this.toastService.log(`✅ Usuario actualizado: ${data.nombre || data.email}`);
      } else {
        const password = 'Gym' + Math.random().toString(36).slice(-8) + '!';
        await (this.userService as any).addUser(data, password);
        this.toastService.log(`✅ Usuario creado: ${data.email}`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDelete(item: any) {
    const id = item.uid || item.id;
    if (!id) return;
    
    try {
      await this.userService.deleteUser(id);
      this.toastService.log(`Usuario eliminado: ${id}`);
    } catch (error) {
      this.toastService.log(`Error al eliminar usuario: ${error}`);
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
            objetivo: Objetivo.SALUD
          };
          await this.entrenadoService.save(clienteData);
          break;

        case Rol.GIMNASIO:
          const gimnasioData: any = {
            id: uid,
            nombre: userData.nombre || userData.email || 'Gimnasio',
            direccion: '',
            activo: true
          };
          await this.gimnasioService.save(gimnasioData);
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
          await this.entrenadorService.createWithId(uid, entrenadorData);
          break;
      }
    } catch (error) {
      console.error('Error creando documento específico:', error);
      throw error;
    }
  }
}
