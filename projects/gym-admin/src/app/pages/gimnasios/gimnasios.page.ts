import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../../services/page-title.service';
import { GimnasioService } from '../../services/gimnasio.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-gimnasios-page',
  standalone: true,
  imports: [CommonModule, DataComponent],
  template: `
    <app-data
      title="Gimnasios"
      [items]="gimnasios()"
      [columns]="columns"
      [fields]="fields()"
      [loading]="loading()"
      (save)="onSave($event)"
      (delete)="onDelete($event)">
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
export class GimnasiosPage {
  private readonly pageTitleService = inject(PageTitleService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly schemaService = inject(SchemaService);
  private readonly toastService = inject(ToastService);

  loading = signal(false);

  gimnasios = computed(() => {
    return this.gimnasioService.gimnasios().map(g => ({
      ...g,
      entrenadoresCount: g.entrenadoresIds?.length || 0,
      entrenadosCount: g.entrenadosIds?.length || 0,
    }));
  });

  columns = this.schemaService.getColumns('gimnasio');

  fields = computed(() => {
    // No dynamic options needed for now, but can extend
    return this.schemaService.getFields('gimnasio');
  });

  constructor() {
    this.pageTitleService.setTitle('Gimnasios');
    this.gimnasioService.initializeListener();
  }

  async onSave(data: any) {
    this.loading.set(true);
    try {
      await this.gimnasioService.save(data);
      this.toastService.show('Gimnasio guardado correctamente', 'success');
    } catch (error) {
      this.toastService.show('Error al guardar gimnasio', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async onDelete(id: string) {
    this.loading.set(true);
    try {
      await this.gimnasioService.delete(id);
      this.toastService.show('Gimnasio eliminado correctamente', 'success');
    } catch (error) {
      this.toastService.show('Error al eliminar gimnasio', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}

