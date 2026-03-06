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
}
