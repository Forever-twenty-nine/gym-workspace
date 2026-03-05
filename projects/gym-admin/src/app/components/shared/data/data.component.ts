import { Component, input, output, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../../models/data-config.model';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmComponent],
  templateUrl: './data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class DataComponent {
  private fb = inject(FormBuilder);

  // Inputs
  title = input.required<string>();
  items = input.required<any[]>();
  columns = input.required<ColumnConfig[]>();
  fields = input.required<FieldConfig[]>();
  loading = input<boolean>(false);

  // Outputs
  save = output<any>();
  delete = output<string>();

  // State
  isModalOpen = signal(false);
  isConfirmOpen = signal(false);
  selectedItem = signal<any>(null);
  form: FormGroup = this.fb.group({});
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

  constructor() {}

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
    this.buildForm();
    this.isModalOpen.set(true);
  }

  openEdit(item: any) {
    this.selectedItem.set(item);
    this.buildForm(item);
    this.isModalOpen.set(true);
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

  private buildForm(item: any = null) {
    const controls: any = {};
    this.fields().forEach(field => {
      let value = item ? item[field.name] : (field.defaultValue ?? (field.type === 'multiselect' ? [] : ''));
      
      // Manejo especial para arrays que vienen de Firestore o del modelo
      if (Array.isArray(value) && field.type !== 'multiselect') {
        value = value.join(', ');
      }
      
      controls[field.name] = [value, field.validators || []];
    });
    this.form = this.fb.group(controls);
  }

  onSubmit() {
    if (this.form.valid) {
      const formValues = { ...this.form.value };
      
      // Limpiar y validar arrays antes de emitir
      this.fields().forEach(field => {
        const val = formValues[field.name];
        
        // Si el campo es un multiselect o termina en 'Ids' / es un array conocido
        if (field.type === 'multiselect') {
          // Asegurar que siempre sea un array
          formValues[field.name] = Array.isArray(val) ? val : [];
        } else if (typeof val === 'string' && (field.name.toLowerCase().endsWith('ids') || field.name === 'rutinasCreadas')) {
          formValues[field.name] = val.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        }
      });

      const data = { ...this.selectedItem(), ...formValues };
      this.save.emit(data);
      this.closeModal();
    }
  }

  onConfirmDelete() {
    if (this.selectedItem()) {
      this.delete.emit(this.selectedItem().id);
      this.closeConfirm();
    }
  }

  getDisplayValue(item: any, key: string): any {
    return item[key];
  }
}
