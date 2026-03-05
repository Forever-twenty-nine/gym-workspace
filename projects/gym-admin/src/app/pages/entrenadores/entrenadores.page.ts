import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenadorService } from '../../services/entrenador.service';
import { UserService } from '../../services/user.service';
import { EjercicioService } from '../../services/ejercicio.service';
import { EntrenadoService } from '../../services/entrenado.service';
import { RutinaService } from '../../services/rutina.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-entrenadores-page',
  standalone: true,
  imports: [CommonModule, DataComponent],
  template: `
    <app-data
      title="Entrenadores"
      [items]="entrenadores()"
      [columns]="columns"
      [fields]="fields()"
      [loading]="loading()"
      (save)="onSave($event)"
      (delete)="onDelete($event)">
    </app-data>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoresPage {
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly userService = inject(UserService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly rutinaService = inject(RutinaService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);

  loading = signal(false);
  
  entrenadores = computed(() => {
    const list = this.entrenadorService.entrenadores();
    const users = this.userService.users();
    return list.map(e => {
      const user = users.find(u => u.uid === e.id);
      return {
        ...e,
        displayName: user?.nombre || user?.email || 'Sin nombre',
        email: user?.email || ''
      };
    });
  });

  columns: ColumnConfig[] = [
    { key: 'displayName', label: 'Nombre', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'fechaRegistro', label: 'Registro', type: 'date' }
  ];

  fields = computed<FieldConfig[]>(() => {
    const ejercicios = this.ejercicioService.ejercicios().map(e => ({ value: e.id, label: e.nombre || e.id }));
    const entrenados = this.entrenadoService.entrenados().map(e => {
      const u = this.userService.users().find(user => user.uid === e.id);
      return { value: e.id, label: u?.nombre || u?.email || e.id };
    });
    const rutinas = this.rutinaService.rutinas().map(r => ({ value: r.id, label: r.nombre || r.id }));

    return [
      { name: 'id', label: 'ID (UID)', type: 'text', validators: [Validators.required] },
      { name: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },
      { 
        name: 'ejerciciosCreadasIds', 
        label: 'Ejercicios Creados', 
        type: 'multiselect', 
        options: ejercicios,
        colSpan: 2 
      },
      { 
        name: 'entrenadosAsignadosIds', 
        label: 'Entrenados Asignados', 
        type: 'multiselect', 
        options: entrenados,
        colSpan: 2 
      },
      { 
        name: 'rutinasCreadasIds', 
        label: 'Rutinas Creadas', 
        type: 'multiselect', 
        options: rutinas,
        colSpan: 2 
      }
    ];
  });

  constructor() {
    this.pageTitleService.setTitle('Entrenadores');
    this.entrenadorService.initializeListener();
  }

  async onSave(data: any) {
    this.loading.set(true);
    try {
      if (data.id) {
        await this.entrenadorService.update(data.id, data);
        this.toastService.show('Entrenador actualizado correctamente', 'success');
      } else {
        await this.entrenadorService.create(data);
        this.toastService.show('Entrenador creado correctamente', 'success');
      }
    } catch (error) {
      this.toastService.show('Error al guardar entrenador', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async onDelete(id: string) {
    this.loading.set(true);
    try {
      await this.entrenadorService.delete(id);
      this.toastService.show('Entrenador eliminado correctamente', 'success');
    } catch (error) {
      this.toastService.show('Error al eliminar entrenador', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}

