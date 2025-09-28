import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Ejercicio } from 'gym-library';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: string;
  icon?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: any; label: string }[];
  colSpan?: number;
  inputType?: string;
  min?: number;
  step?: number;
  rows?: number;
  checkboxLabel?: string;
}

@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-form.component.html'
})
export class ModalFormComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() modalType: string = '';
  @Input() isCreating: boolean = true;
  @Input() form: FormGroup | null = null;
  @Input() formFields: FormFieldConfig[] = [];
  @Input() ejercicios: Ejercicio[] = [];
  @Input() selectedEjercicios: string[] = [];
  @Input() isLoading: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() toggleDiaSemana = new EventEmitter<{ event: Event; value: string }>();
  @Output() toggleEjercicio = new EventEmitter<string>();

  diasSemanaOptions = [
    { value: 'L', label: 'Lunes' },
    { value: 'M', label: 'Martes' },
    { value: 'X', label: 'Miércoles' },
    { value: 'J', label: 'Jueves' },
    { value: 'V', label: 'Viernes' },
    { value: 'S', label: 'Sábado' },
    { value: 'D', label: 'Domingo' }
  ];

  ngOnInit() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  onOverlayClick() {
    this.onClose();
  }

  onClose() {
    document.body.style.overflow = 'auto';
    this.close.emit();
  }

  onSave() {
    this.save.emit();
  }

  onToggleDiaSemana(event: Event, value: string) {
    this.toggleDiaSemana.emit({ event, value });
  }

  onToggleEjercicio(ejercicioId: string) {
    this.toggleEjercicio.emit(ejercicioId);
  }

  isEjercicioSelected(ejercicioId: string): boolean {
    return this.selectedEjercicios.includes(ejercicioId);
  }

  getEjercicioById(id: string): Ejercicio | undefined {
    return this.ejercicios.find(e => e.id === id);
  }
}