import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitacionService } from '../../services/invitacion.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';

@Component({
    selector: 'app-invitaciones-page',
    standalone: true,
    imports: [CommonModule, DataComponent],
    template: `
    <app-data
      title="Invitaciones"
      [items]="invitaciones()"
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
export class InvitacionesPage {
    private readonly invitacionService = inject(InvitacionService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);

    loading = signal(false);
    invitaciones = this.invitacionService.invitaciones;

    columns = this.schemaService.getColumns('invitacion');
    fields = this.schemaService.getFields('invitacion');

    constructor() {
        this.pageTitleService.setTitle('Invitaciones');
    }

    async onSave(data: any) {
        this.loading.set(true);
        try {
            // El servicio de invitaciones ya tiene save completo
            await this.invitacionService.save(data);
            this.toastService.show('Invitación guardada correctamente', 'success');
        } catch (error) {
            console.error(error);
            this.toastService.show('Error al guardar invitación', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async onDelete(id: string) {
        this.loading.set(true);
        try {
            await this.invitacionService.delete(id);
            this.toastService.show('Invitación eliminada correctamente', 'success');
        } catch (error) {
            console.error(error);
            this.toastService.show('Error al eliminar invitación', 'error');
        } finally {
            this.loading.set(false);
        }
    }
}
