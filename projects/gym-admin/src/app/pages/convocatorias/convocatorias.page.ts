import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvocatoriaAdminService } from '../../services/convocatoria-admin.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { UserService } from '../../services/user.service';
import { GimnasioService } from '../../services/gimnasio.service';

@Component({
    selector: 'app-convocatorias-page',
    standalone: true,
    imports: [CommonModule, DataComponent],
    template: `
    <app-data
      title="Convocatorias"
      [items]="convocatorias()"
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
export class ConvocatoriasPage {
    private readonly convocatoriaAdminService = inject(ConvocatoriaAdminService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);
    private readonly userService = inject(UserService);
    private readonly gimnasioService = inject(GimnasioService);

    loading = signal(false);
    convocatorias = this.convocatoriaAdminService.convocatorias;

    columns = this.schemaService.getColumns('convocatoria');

    // Dynamic fields with selects populated from registered users and gyms
    fields = computed(() => {
        const users = this.userService.users();
        const gimnasios = this.gimnasioService.gimnasios();

        const creadorOptions = users.map(u => ({
            value: u.uid,
            label: `${u.nombre || 'Sin nombre'} (${u.email || u.uid})`
        }));

        const gimnasioOptions = gimnasios.map(g => ({
            value: g.id,
            label: g.nombre || g.id
        }));

        return this.schemaService.getDynamicSchema('convocatoria', {
            'creadorId': creadorOptions,
            'gimnasioId': gimnasioOptions
        });
    });

    constructor() {
        this.pageTitleService.setTitle('Convocatorias');
        // Ensure listeners are active
        this.userService.users();
        this.gimnasioService.gimnasios();
    }

    async onSave(rawData: any) {
        this.loading.set(true);
        try {
            const data = { ...rawData };

            // Enrich creadorNombre and foto from selected user (denormalized)
            if (data.creadorId) {
                const user = this.userService.users().find(u => u.uid === data.creadorId);
                if (user) {
                    data.creadorNombre = user.nombre || user.email || data.creadorId;
                    if ((user as any).foto) {
                        data.creadorFoto = (user as any).foto;
                    }
                }
            }

            // gimnasioId is already correctly set from the select (value = id)

            // Set creation date for new ones
            if (!data.id && !data.fechaCreacion) {
                data.fechaCreacion = new Date();
            }

            if (data.id) {
                await this.convocatoriaAdminService.actualizarConvocatoria(data);
            } else {
                await this.convocatoriaAdminService.crearConvocatoria(data);
            }
            this.toastService.show('Convocatoria guardada correctamente', 'success');
        } catch (error) {
            console.error(error);
            this.toastService.show('Error al guardar convocatoria', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    async onDelete(id: string) {
        this.loading.set(true);
        try {
            await this.convocatoriaAdminService.eliminarConvocatoria(id);
            this.toastService.show('Convocatoria eliminada correctamente', 'success');
        } catch (error) {
            console.error(error);
            this.toastService.show('Error al eliminar convocatoria', 'error');
        } finally {
            this.loading.set(false);
        }
    }
}
