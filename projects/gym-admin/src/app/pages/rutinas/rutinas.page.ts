import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutinaService } from '../../services/rutina.service';
import { EjercicioService } from '../../services/ejercicio.service';
import { RutinaAsignadaService } from '../../services/rutina-asignada.service';
import { UserService } from '../../services/user.service';
import { SesionRutinaService } from '../../services/sesion-rutina.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { RutinaAsignada } from 'gym-library';
import { TabsComponent, TabItem } from '../../components/shared/tabs/tabs.component';

@Component({
    selector: 'app-rutinas-page',
    standalone: true,
    imports: [CommonModule, DataComponent, TabsComponent],
    template: `
    <div class="p-6 h-full flex flex-col min-h-0">
      <!-- Pestañas (diseño unificado compacto) -->
      <app-tabs [tabs]="tabs()" [active]="activeTab()" (tabChange)="setTab($event)"></app-tabs>

      <!-- Tab Content -->
      @if (activeTab() === 'catalogo') {
        <app-data
          title="Catálogo"
          [items]="rutinas()"
          [columns]="columns"
          [fields]="fields()"
          [loading]="loading()"
          (save)="onSave($event)"
          (delete)="onDelete($event)">
        </app-data>
      }

      @if (activeTab() === 'asignadas') {
        <app-data
          title="Rutinas Asignadas"
          [items]="rutinasAsignadas()"
          [columns]="asignadasColumns"
          [fields]="asignadasFields()"
          [loading]="asignadasLoading()"
          (save)="onSaveAsignada($event)"
          (delete)="onDeleteAsignada($event)">
        </app-data>
      }

      @if (activeTab() === 'sesiones') {
        <app-data
          title="Sesiones de Rutinas"
          [items]="sesionesEnriquecidas()"
          [columns]="sesionesColumns"
          [fields]="sesionesFields()"
          [loading]="sesionesLoading()"
          (save)="onSaveSesion($event)"
          (delete)="onDeleteSesion($event)">
        </app-data>
      }
    </div>
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
    private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
    private readonly userService = inject(UserService);
    private readonly sesionRutinaService = inject(SesionRutinaService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);

    loading = signal(false);
    asignadasLoading = signal(false);
    sesionesLoading = signal(false);

    // Tab: 'catalogo' | 'asignadas' | 'sesiones'
    activeTab = signal<'catalogo' | 'asignadas' | 'sesiones'>('catalogo');

    rutinas = this.rutinaService.rutinas;
    columns = this.schemaService.getColumns('rutina');

    // For asignadas tab
    asignadasColumns = this.schemaService.getColumns('rutinaAsignada');
    asignadasFields = computed<FieldConfig[]>(() => {
        const routines = this.rutinaService.rutinas();
        const users = this.userService.users();

        const routineOptions = routines.map(r => ({ value: r.id!, label: r.nombre || r.id }));
        const userOptions = users.map(u => ({ value: u.uid, label: u.nombre || u.email || u.uid }));

        return this.schemaService.getDynamicSchema('rutinaAsignada', {
            'rutinaId': routineOptions,
            'entrenadoId': userOptions,
            'entrenadorId': userOptions
        });
    });

    rutinasAsignadas = computed(() => {
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

    // For sesiones tab
    sesiones = this.sesionRutinaService.sesiones;

    sesionesEnriquecidas = computed(() => {
      const list = this.sesionRutinaService.sesiones();
      const users = this.userService.users();
      return list.map((s: any) => {
        const user = users.find(u => u.uid === s.entrenadoId);
        return {
          ...s,
          entrenadoNombre: user?.nombre || user?.email || s.entrenadoId,
          photoURL: user?.photoURL || null,
        };
      });
    });

    sesionesColumns: ColumnConfig[] = [
      { key: 'entrenadoNombre', label: 'Entrenado', type: 'avatar' },
      { key: 'fechaInicio', label: 'Inicio', type: 'date' },
      { key: 'fechaFin', label: 'Fin', type: 'date' },
      {
        key: 'status',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
          trueLabel: 'Completada',
          falseLabel: 'En Progreso',
          trueClass: 'bg-green-100 text-green-700 border border-green-200',
          falseClass: 'bg-blue-100 text-blue-700 border border-blue-200'
        }
      },
      { key: 'porcentajeCompletado', label: '%', type: 'text' }
    ];

    sesionesFields = computed(() => {
      const baseFields = this.schemaService.getFields('sesionRutina');
      const users = this.userService.users();
      const userOptions = users.map(u => ({ value: u.uid, label: u.nombre || u.email || u.uid }));
      return baseFields.map(field => {
        if (field.name === 'entrenadoId') {
          return { ...field, type: 'select' as const, options: userOptions };
        }
        return field;
      });
    });

    fields = computed<FieldConfig[]>(() => {
        const ejerciciosList = this.ejercicioService.ejercicios();
        const ejerciciosOptions = ejerciciosList.map(e => ({ value: e.id, label: e.nombre || e.id }));

        return this.schemaService.getDynamicSchema('rutina', {
            'ejerciciosIds': ejerciciosOptions
        });
    });

    // Tabs definition for unified compact tabs component (live counts)
    tabs = computed<TabItem[]>(() => [
      { id: 'catalogo', label: 'Catálogo de Rutinas', count: this.rutinas().length, accent: 'blue' },
      { id: 'asignadas', label: 'Rutinas Asignadas', count: this.rutinasAsignadas().length, accent: 'blue' },
      { id: 'sesiones', label: 'Sesiones de Rutina', count: this.sesiones().length, accent: 'blue' }
    ]);

    constructor() {
        this.updatePageTitle();
        // Ensure listeners for cross data
        this.userService.users();
        this.rutinaAsignadaService.getRutinasAsignadas();
        this.sesionRutinaService.sesiones; // init listener
    }

    async onSave(data: any) {
        this.loading.set(true);
        try {
            await this.rutinaService.save(data);
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
        } catch (error) {
            this.toastService.show('Error al eliminar rutina', 'error');
        } finally {
            this.loading.set(false);
        }
    }

    // --- Asignadas tab handlers ---
    async onSaveAsignada(data: any) {
        this.asignadasLoading.set(true);
        try {
            await this.rutinaAsignadaService.save(data);
            this.toastService.show('Asignación guardada', 'success');
        } catch (error) {
            this.toastService.show('Error al guardar asignación', 'error');
        } finally {
            this.asignadasLoading.set(false);
        }
    }

    async onDeleteAsignada(id: string) {
        this.asignadasLoading.set(true);
        try {
            await this.rutinaAsignadaService.delete(id);
            this.toastService.show('Asignación eliminada', 'success');
        } catch (error) {
            this.toastService.show('Error al eliminar asignación', 'error');
        } finally {
            this.asignadasLoading.set(false);
        }
    }

    // --- Sesiones tab handlers ---
    async onSaveSesion(data: any) {
        this.sesionesLoading.set(true);
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
            this.sesionesLoading.set(false);
        }
    }

    async onDeleteSesion(id: string) {
        this.sesionesLoading.set(true);
        try {
            await this.sesionRutinaService.eliminarSesion(id);
            this.toastService.show('Sesión eliminada correctamente', 'success');
        } catch (error) {
            this.toastService.show('Error al eliminar sesión', 'error');
        } finally {
            this.sesionesLoading.set(false);
        }
    }

    setTab(tab: string) {
        this.activeTab.set(tab as 'catalogo' | 'asignadas' | 'sesiones');
        this.updatePageTitle();
    }

    private updatePageTitle() {
        const tab = this.activeTab();
        let title = 'Rutinas';
        if (tab === 'catalogo') {
            title = 'Catálogo de Rutinas';
        } else if (tab === 'asignadas') {
            title = 'Rutinas Asignadas';
        } else if (tab === 'sesiones') {
            title = 'Sesiones de Rutina';
        }
        this.pageTitleService.setTitle(title);
    }
}
