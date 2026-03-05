import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenadoService } from '../../services/entrenado.service';
import { EntrenadorService } from '../../services/entrenador.service';
import { RutinaAsignadaService } from '../../services/rutina-asignada.service';
import { RutinaService } from '../../services/rutina.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Validators } from '@angular/forms';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadosPage {
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  private readonly rutinaService = inject(RutinaService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);

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

  columns: ColumnConfig[] = [
    { key: 'displayName', label: 'Nombre', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { 
      key: 'nivel', 
      label: 'Nivel', 
      type: 'badge',
      badgeConfig: {
        trueLabel: 'Premium',
        falseLabel: 'Estándar',
        trueClass: 'bg-yellow-100 text-yellow-800',
        falseClass: 'bg-blue-100 text-blue-800'
      }
    },
    { key: 'fechaRegistro', label: 'Registro', type: 'date' }
  ];

  fields = computed<FieldConfig[]>(() => {
    const trainers = this.entrenadorService.entrenadores();
    const allUsers = this.userService.users();
    const routines = this.rutinaService.rutinas();
    const assignedRoutinesList = this.rutinaAsignadaService.getRutinasAsignadas()();
    const entrenadoId = this.selectedEntrenadoId();
    const entrenadosList = this.entrenadoService.entrenados();

    // Encontrar qué entrenadores tiene asignados este entrenado
    const currentEntrenado = entrenadoId ? entrenadosList.find(e => e.id === entrenadoId) : null;
    const assignedTrainerIds = currentEntrenado?.entrenadoresId || [];

    // Filtrar rutinas: Solo las que pertenecen a sus entrenadores
    const filteredRoutines = assignedTrainerIds.length > 0
      ? routines.filter(r => assignedTrainerIds.includes((r as any).creadorId!))
      : routines;

    // Filtrar rutinas asignadas: Solo las que corresponden a este entrenado
    const filteredAssignedRoutines = entrenadoId
      ? assignedRoutinesList.filter(ar => (ar as any).entrenadoId === entrenadoId || (ar as any).usuarioId === entrenadoId)
      : assignedRoutinesList;

    const trainerOptions = trainers.map(t => {
      const u = allUsers.find(user => user.uid === t.id);
      return { value: t.id, label: u?.nombre || u?.email || t.id };
    });

    const routineOptions = filteredRoutines.map(r => ({ value: r.id!, label: r.nombre }));
    const assignedRoutineOptions = filteredAssignedRoutines.map(ar => ({ 
      value: ar.id!, 
      label: `Rutina (${ar.id})` 
    }));

    return [
      { name: 'id', label: 'ID (UID)', type: 'text', validators: [Validators.required] },
      { name: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },
      { 
        name: 'objetivo', 
        label: 'Objetivo Principal', 
        type: 'select', 
        options: [
          { value: 'volumen', label: 'Volumen' },
          { value: 'definicion', label: 'Definición' },
          { value: 'fuerza', label: 'Fuerza' },
          { value: 'salud', label: 'Salud / Bienestar' }
        ]
      },
      { 
        name: 'entrenadoresId', 
        label: 'Entrenadores', 
        type: 'multiselect', 
        options: trainerOptions,
        colSpan: 2 
      },
      { 
        name: 'rutinasAsignadasIds', 
        label: 'Rutinas Asignadas', 
        type: 'multiselect', 
        options: assignedRoutineOptions,
        colSpan: 2 
      },
      { 
        name: 'rutinasCreadas', 
        label: 'Rutinas Creadas (Premium)', 
        type: 'multiselect', 
        options: routineOptions,
        colSpan: 2 
      },
      { 
        name: 'nivel', 
        label: 'Es Premium', 
        type: 'select', 
        options: [
          { value: false, label: 'Estándar' },
          { value: true, label: 'Premium' }
        ]
      }
    ];
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
      this.toastService.show('Entrenado guardado correctamente', 'success');
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
      this.toastService.show('Entrenado eliminado correctamente', 'success');
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

