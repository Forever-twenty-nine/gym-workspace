import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EjercicioService } from '../../services/ejercicio.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';

@Component({
    selector: 'app-ejercicios-page',
    standalone: true,
    imports: [CommonModule, DataComponent],
    template: `
    <app-data
      title="Ejercicios"
      [items]="ejercicios()"
      [columns]="columns"
      [fields]="fields"
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
export class EjerciciosPage {
    private readonly ejercicioService = inject(EjercicioService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);

    loading = signal(false);
    ejercicios = this.ejercicioService.ejercicios;
    columns = this.schemaService.getColumns('ejercicio');
    fields = this.schemaService.getFields('ejercicio');

    constructor() {
        this.pageTitleService.setTitle('Ejercicios');
    }

    async onSave(data: any) {
        this.loading.set(true);
        try {
            await this.ejercicioService.save(data);
        } catch (error) {
            this.toastService.show('Error al guardar ejercicio', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async onDelete(id: string) {
        this.loading.set(true);
        try {
            await this.ejercicioService.delete(id);
        } catch (error) {
            this.toastService.show('Error al eliminar ejercicio', 'error');
        } finally {
            this.loading.set(false);
        }
    }
}
