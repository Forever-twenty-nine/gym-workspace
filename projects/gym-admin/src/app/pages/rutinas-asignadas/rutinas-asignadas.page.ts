import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RutinaAsignada } from 'gym-library';
import { RutinaAsignadaService } from '../../services/rutina-asignada.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { UserService } from '../../services/user.service';
import { RutinaService } from '../../services/rutina.service';

@Component({
  selector: 'app-rutinas-asignadas-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataComponent
  ],
  templateUrl: './rutinas-asignadas.page.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutinasAsignadasPage {
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  private readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly schemaService = inject(SchemaService);
  private readonly userService = inject(UserService);
  private readonly rutinaService = inject(RutinaService);

  readonly columns = this.schemaService.getColumns('rutinaAsignada');
  readonly fields = computed(() => {
    const routines = this.rutinaService.rutinas();
    const users = this.userService.users();

    const routineOptions = routines.map(r => ({ value: r.id!, label: r.nombre }));
    const userOptions = users.map(u => ({ value: u.uid, label: u.nombre || u.email || u.uid }));

    return this.schemaService.getDynamicSchema('rutinaAsignada', {
      'rutinaId': routineOptions,
      'entrenadoId': userOptions,
      'entrenadorId': userOptions
    });
  });
  readonly isLoading = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Rutinas Asignadas');
  }

  readonly rutinasAsignadas = computed(() => {
    const list = this.rutinaAsignadaService.getRutinasAsignadas()();
    const routines = this.rutinaService.rutinas();
    const users = this.userService.users();

    return list.map((ra: RutinaAsignada) => {
      const routine = routines.find(r => r.id === ra.rutinaId);
      const entrenado = users.find(u => u.uid === ra.entrenadoId);
      const entrenador = users.find(u => u.uid === ra.entrenadorId);

      return {
        ...ra,
        rutinaNombre: routine?.nombre || ra.rutinaId,
        entrenadoNombre: entrenado?.nombre || entrenado?.email || ra.entrenadoId,
        entrenadorNombre: entrenador?.nombre || entrenador?.email || ra.entrenadorId
      };
    });
  });

  async onSave(data: any) {
    this.isLoading.set(true);
    try {
      await this.rutinaAsignadaService.save(data);
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.show(`Error al guardar: ${error}`, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDelete(id: string) {
    if (!id) return;
    this.isLoading.set(true);
    try {
      await this.rutinaAsignadaService.delete(id);
    } catch (error) {
      console.error('Error al eliminar:', error);
      this.toastService.show(`Error al eliminar: ${error}`, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
