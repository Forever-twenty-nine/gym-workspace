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
import { SchemaService } from '../../core/schema.service';

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
export class EntrenadoresPage {
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly userService = inject(UserService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly rutinaService = inject(RutinaService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);

  private readonly schemaService = inject(SchemaService);

  loading = signal(false);
  selectedEntrenadorId = signal<string | null>(null);

  entrenadores = computed(() => {
    const list = this.entrenadorService.entrenadoresSignal();
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

  columns = this.schemaService.getColumns('entrenador');

  fields = computed<FieldConfig[]>(() => {
    const entrenadorId = this.selectedEntrenadorId();
    const ejerciciosList = this.ejercicioService.ejercicios();
    const entrenadosList = this.entrenadoService.entrenados();
    const rutinasList = this.rutinaService.rutinas();
    const usersList = this.userService.users();

    const currentId = entrenadorId;

    const filteredEjercicios = ejerciciosList.filter((e: any) => {
      const cid = (e.creadorId || e.entrenadorId || e.usuarioId);
      return cid === currentId || (cid && currentId && cid.toLowerCase() === currentId.toLowerCase());
    });

    const filteredRutinas = rutinasList.filter((r: any) => {
      const cid = (r.creadorId || r.entrenadorId || r.usuarioId);
      return cid === currentId || (cid && currentId && cid.toLowerCase() === currentId.toLowerCase());
    });

    const ejercicios = filteredEjercicios.map(e => ({ value: e.id, label: e.nombre || e.id }));
    const entrenados = entrenadosList.map(e => {
      const u = usersList.find(user => user.uid === e.id);
      return { value: e.id, label: u?.nombre || u?.email || e.id };
    });
    const rutinas = filteredRutinas.map(r => ({ value: r.id, label: r.nombre || r.id }));

    return this.schemaService.getDynamicSchema('entrenador', {
      'info_ejercicios': ejercicios,
      'info_rutinas': rutinas,
      'entrenadosAsignadosIds': entrenados,
      'entrenadosPremiumIds': entrenados
    });
  });

  constructor() {
    this.pageTitleService.setTitle('Entrenadores');
    this.userService.users();
    this.entrenadorService.entrenadoresSignal();
    this.ejercicioService.ejercicios();
    this.rutinaService.rutinas();
    this.entrenadoService.entrenados();
  }

  onOpenEdit(item: any) {
    this.selectedEntrenadorId.set(item.id);
    const currentId = item.id;
    const ex = this.ejercicioService.ejercicios()
      .filter((e: any) => {
        const cid = (e.creadorId || e.entrenadorId || e.usuarioId);
        return cid === currentId || cid === currentId?.toLowerCase();
      })
      .map(e => e.id);

    const rut = this.rutinaService.rutinas()
      .filter((r: any) => {
        const cid = (r.creadorId || r.entrenadorId || r.usuarioId);
        return cid === currentId || cid === currentId?.toLowerCase();
      })
      .map(r => r.id);

    item.info_ejercicios = ex;
    item.info_rutinas = rut;
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
      this.selectedEntrenadorId.set(null);
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
