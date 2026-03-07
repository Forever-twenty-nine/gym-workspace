import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionRutinaService } from '../../services/sesion-rutina.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Component({
    selector: 'app-sesiones-rutinas-page',
    standalone: true,
    imports: [CommonModule, DataComponent],
    template: `
    <app-data
      title="Sesiones de Rutinas"
      [items]="sesiones()"
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
export class SesionesRutinasPage {
    private readonly sesionRutinaService = inject(SesionRutinaService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);

    loading = signal(false);
    sesiones = this.sesionRutinaService.sesiones;

    columns = this.schemaService.getColumns('sesionRutina');
    fields = this.schemaService.getFields('sesionRutina');

    constructor() {
        this.pageTitleService.setTitle('Sesiones de Rutinas');
    }

    async onSave(data: any) {
        this.loading.set(true);
        try {
            if (data.id) {
                await this.sesionRutinaService.actualizarSesion(data);
            } else {
                await this.sesionRutinaService.crearSesion(data);
            }
            this.toastService.show('Sesión guardada correctamente', 'success');
        } catch (error) {
            this.toastService.show('Error al guardar sesión', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async onDelete(id: string) {
        this.loading.set(true);
        try {
            await this.sesionRutinaService.eliminarSesion(id);
            this.toastService.show('Sesión eliminada correctamente', 'success');
        } catch (error) {
            this.toastService.show('Error al eliminar sesión', 'error');
        } finally {
            this.loading.set(false);
        }
    }
}
