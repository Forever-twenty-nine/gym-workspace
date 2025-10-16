import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: any; label: string; extra?: string }[];
  colSpan?: number;
  inputType?: string;
  min?: number;
  step?: number;
  rows?: number;
  checkboxLabel?: string;
  readonly?: boolean;
  // Propiedades personalizadas para campos complejos
  notificaciones?: any[];
  conversaciones?: any[];
  rutinas?: any[];
  ejercicios?: any[];
  invitaciones?: any[];
  mensajesConversacion?: any[];
}

@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-form.component.html'
})
export class ModalFormComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() isCreating: boolean = true;
  @Input() form: FormGroup | null = null;
  @Input() formFields: FormFieldConfig[] = [];
  @Input() isLoading: boolean = false;
  @Input() showCustomAction: boolean = false;
  @Input() customActionLabel: string = 'Acción';
  @Input() showCustomAction2: boolean = false;
  @Input() customAction2Label: string = 'Acción 2';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() customAction = new EventEmitter<void>();
  @Output() customAction2 = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
  }

  onOverlayClick(): void {
    this.onClose();
  }

  onClose(): void {
    document.body.style.overflow = 'auto';
    this.close.emit();
  }

  onSave(): void {
    this.save.emit();
  }

  onCustomAction(): void {
    this.customAction.emit();
  }

  onCustomAction2(): void {
    this.customAction2.emit();
  }

  // Métodos para manejar multiselects genéricos
  isOptionSelected(fieldName: string, optionValue: any): boolean {
    if (!this.form) return false;
    const fieldValue = this.form.get(fieldName)?.value;
    return Array.isArray(fieldValue) ? fieldValue.includes(optionValue) : false;
  }

  onToggleMultiselect(fieldName: string, optionValue: any, event: Event): void {
    if (!this.form) return;

    const checkbox = event.target as HTMLInputElement;
    const currentValues = this.form.get(fieldName)?.value || [];

    let newValues: any[];
    if (checkbox.checked) {
      // Agregar valor si no está presente
      newValues = currentValues.includes(optionValue)
        ? currentValues
        : [...currentValues, optionValue];
    } else {
      // Remover valor si está presente
      newValues = currentValues.filter((value: any) => value !== optionValue);
    }

    this.form.patchValue({ [fieldName]: newValues });
  }

  getSelectedCount(fieldName: string): number {
    if (!this.form) return 0;
    const fieldValue = this.form.get(fieldName)?.value;
    return Array.isArray(fieldValue) ? fieldValue.length : 0;
  }
}