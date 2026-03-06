import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutinaService } from '../../services/rutina.service';
import { EjercicioService } from '../../services/ejercicio.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { FieldConfig } from '../../models/data-config.model';

@Component({
    selector: 'app-rutinas-page',
    standalone: true,
    imports: [CommonModule, DataComponent],
    template: `
    <app-data
      title="Rutinas"
      [items]="rutinas()"
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
export class RutinasPage {
    private readonly rutinaService = inject(RutinaService);
    private readonly ejercicioService = inject(EjercicioService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);

    loading = signal(false);
    rutinas = this.rutinaService.rutinas;
    columns = this.schemaService.getColumns('rutina');

    fields = computed<FieldConfig[]>(() => {
        const ejerciciosList = this.ejercicioService.ejercicios();
        const ejerciciosOptions = ejerciciosList.map(e => ({ value: e.id, label: e.nombre || e.id }));

        return this.schemaService.getDynamicSchema('rutina', {
            'ejerciciosIds': ejerciciosOptions
        });
    });

    constructor() {
        this.pageTitleService.setTitle('Rutinas');
    }

    async onSave(data: any) {
        this.loading.set(true);
        try {
            await this.rutinaService.save(data);
            this.toastService.show(
                data.id ? 'Rutina actualizada correctamente' : 'Rutina creada correctamente',
                'success'
            );
        } catch (error) {
            this.toastService.show('Error al guardar rutina', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async onDelete(id: string) {
        this.loading.set(true);
        try {
            await this.rutinaService.delete(id);
            this.toastService.show('Rutina eliminada correctamente', 'success');
        } catch (error) {
            this.toastService.show('Error al eliminar rutina', 'error');
        } finally {
            this.loading.set(false);
        }
    }
}
