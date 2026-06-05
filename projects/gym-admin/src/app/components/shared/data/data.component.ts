import { Component, input, output, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../../models/data-config.model';
import { ConfirmComponent } from '../confirm/confirm.component';
import { DataModalComponent } from './data-modal/data-modal.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmComponent, DataModalComponent],
  templateUrl: './data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `]
})
export class DataComponent {
  private readonly toastService = inject(ToastService);

  // Inputs
  title = input.required<string>();
  items = input.required<any[]>();
  columns = input.required<ColumnConfig[]>();
  fields = input.required<FieldConfig[]>();
  loading = input<boolean>(false);
  showCreate = input<boolean>(true);
  showActions = input<boolean>(true);

  // Outputs
  save = output<any>();
  delete = output<string>();
  editOpened = output<any>();

  // State
  isModalOpen = signal(false);
  isConfirmOpen = signal(false);
  selectedItem = signal<any>(null);
  filterText = signal('');

  // Paginación
  currentPage = signal(0);
  pageSize = 10;

  filteredItems = computed(() => {
    const text = this.filterText().toLowerCase();
    const allItems = this.items();
    if (!text) return allItems;

    const cols = this.columns();
    return allItems.filter(item => {
      return cols.some(col => {
        const val = String(item[col.key] || '').toLowerCase();
        return val.includes(text);
      });
    });
  });

  paginatedItems = computed(() => {
    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredItems().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredItems().length / this.pageSize));

  hasPrevious = computed(() => this.currentPage() > 0);
  hasNext = computed(() => this.currentPage() < this.totalPages() - 1);

  onFilterChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filterText.set(input.value);
    this.currentPage.set(0);
  }

  nextPage() {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage() {
    if (this.hasPrevious()) {
      this.currentPage.update(p => p - 1);
    }
  }

  openCreate() {
    this.selectedItem.set(null);
    this.isModalOpen.set(true);
  }

  openEdit(item: any) {
    this.selectedItem.set(item);
    this.editOpened.emit(item);
    this.isModalOpen.set(true);
  }

  onSaveModal(data: any) {
    this.save.emit(data);
    this.toastService.show(
      data.id ? `${this.title()} actualizado correctamente` : `${this.title()} creado correctamente`,
      'success'
    );
    this.closeModal();
  }

  openDelete(item: any) {
    this.selectedItem.set(item);
    this.isConfirmOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedItem.set(null);
  }

  closeConfirm() {
    this.isConfirmOpen.set(false);
    this.selectedItem.set(null);
  }

  onConfirmDelete() {
    if (this.selectedItem()) {
      this.delete.emit(this.selectedItem().id);
      this.toastService.show(`${this.title()} eliminado correctamente`, 'success');
      this.closeConfirm();
    }
  }

  getDisplayValue(item: any, key: string): any {
    return item[key];
  }

  getBadgeClass(value: any, column: any): string {
    const v = String(value || '').toLowerCase();
    const config = column.badgeConfig;
    const isTrue = value === true || v === 'true' || v === 'yes' || v === 'si';

    if (v === 'entrenado' || v === 'trainee' || isTrue) {
      return config?.trueClass || 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (v === 'entrenador' || v === 'trainer' || v === 'personal_trainer') {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    if (v === 'gimnasio' || v === 'gym') {
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    }
    if (v === 'premium' || v === 'completada' || v === 'oficial') {
      return config?.trueClass || 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    if (v === 'en_progreso' || v === 'pendiente') {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    if (v === 'cancelada' || v === 'rechazada' || v === 'inactiva') {
      return 'bg-red-100 text-red-700 border border-red-200';
    }
    return config?.falseClass || 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  getBadgeLabel(value: any, column: any): string {
    const v = String(value || '').toLowerCase();
    const config = column.badgeConfig;
    const isTrue = value === true || v === 'true' || v === 'yes' || v === 'si';

    if (v === 'entrenado') return config?.trueLabel || 'Entrenado';
    if (v === 'entrenador' || v === 'personal_trainer') return 'Entrenador';
    if (v === 'gimnasio') return 'Gimnasio';
    if (v === 'completada') return config?.trueLabel || 'Completada';
    if (v === 'en_progreso') return 'En Progreso';
    if (v === 'pendiente') return 'Pendiente';
    if (v === 'cancelada') return 'Cancelada';
    if (v === 'oficial') return 'Oficial';
    if (isTrue) return config?.trueLabel || 'Sí';
    if (v === 'false' || value === false) return config?.falseLabel || 'No';

    return value || '—';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide broken image so the initials background shows
    img.style.display = 'none';
  }
}
