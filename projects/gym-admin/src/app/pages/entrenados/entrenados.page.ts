import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenadoService } from '../../services/entrenado.service';
import { EntrenadorService } from '../../services/entrenador.service';
import { EjercicioService } from '../../services/ejercicio.service';
import { RutinaAsignadaService } from '../../services/rutina-asignada.service';
import { RutinaService } from '../../services/rutina.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Validators } from '@angular/forms';
import { SchemaService } from '../../core/schema.service';

@Component({
  selector: 'app-entrenados-page',
  standalone: true,
  imports: [CommonModule, DataComponent],
  template: `
    <app-data
      title="Entrenados"
      [items]="entrenados()"
      [columns]="columns"
      [fields]="fields()"
      [loading]="loading()"
      (save)="onSave($event)"
      (delete)="onDelete($event)"
      (editOpened)="onOpenEdit($event)">
    </app-data>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadosPage {
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  private readonly rutinaService = inject(RutinaService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);

  private readonly schemaService = inject(SchemaService);

  loading = signal(false);
  selectedEntrenadoId = signal<string | null>(null);

  entrenados = computed(() => {
    const list = this.entrenadoService.entrenados();
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

  columns = this.schemaService.getColumns('entrenado');

  fields = computed<FieldConfig[]>(() => {
    const entrenadoId = this.selectedEntrenadoId();
    const trainers = this.entrenadorService.entrenadoresSignal();
    const routines = this.rutinaService.rutinas();
    const exercises = this.ejercicioService.ejercicios();
    const allUsers = this.userService.users();
    const assignedRoutinesList = this.rutinaAsignadaService.getRutinasAsignadas()();

    const trainerOptions = trainers.map(t => {
      const u = allUsers.find(user => user.uid === t.id);
      return { value: t.id, label: u?.nombre || u?.email || t.id };
    });

    const routineOptions = routines.map(r => ({ value: r.id!, label: r.nombre }));

    const userOptions = allUsers.map(u => ({ value: u.uid, label: u.nombre || u.email || u.uid }));
    const exerciseOptions = exercises.map((e: any) => ({ value: e.id!, label: e.nombre }));

    return this.schemaService.getDynamicSchema('entrenado', {
      'entrenadoresId': trainerOptions,
      'rutinasAsignadasIds': routineOptions,
      'rutinasCreadas': routineOptions,
      'ejerciciosCreadosIds': exerciseOptions,
      'seguidores': userOptions,
      'seguidos': userOptions
    });
  });


  constructor() {
    this.pageTitleService.setTitle('Entrenados');
    // Acceder a las signals para activar los listeners de los servicios
    const u = this.userService.users();
    const e = this.entrenadoService.entrenados();
    const t = this.entrenadorService.entrenadoresSignal();
    const r = this.rutinaService.rutinas();
    const ra = this.rutinaAsignadaService.getRutinasAsignadas()();
  }

  async onSave(data: any) {
    this.loading.set(true);
    try {
      await this.entrenadoService.save(data);
    } catch (error) {
      this.toastService.show('Error al guardar entrenado', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async onDelete(id: string) {
    this.loading.set(true);
    try {
      await this.entrenadoService.delete(id);
    } catch (error) {
      this.toastService.show('Error al eliminar entrenado', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  onOpenEdit(item: any) {
    this.selectedEntrenadoId.set(item?.id || null);
  }
}

