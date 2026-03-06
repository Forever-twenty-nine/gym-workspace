import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RutinaAsignada } from 'gym-library';
import { RutinaAsignadaService } from '../../services/rutina-asignada.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';

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

  readonly columns = this.schemaService.getColumns('rutinaAsignada');
  readonly fields = signal(this.schemaService.getFields('rutinaAsignada'));
  readonly isLoading = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Rutinas Asignadas');
  }

  readonly rutinasAsignadas = computed(() => {
    return this.rutinaAsignadaService.getRutinasAsignadas()().map((ra: RutinaAsignada) => ({
      ...ra,
      id: ra.id
    }));
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
