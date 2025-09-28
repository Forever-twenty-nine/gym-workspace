import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ejercicio } from 'gym-library';

@Component({
  selector: 'app-ejercicios-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejercicios-card.component.html'
})
export class EjerciciosCardComponent {
  @Input() ejercicios: Ejercicio[] = [];
  @Output() createEjercicio = new EventEmitter<void>();
  @Output() editEjercicio = new EventEmitter<Ejercicio>();
  @Output() deleteEjercicio = new EventEmitter<string>();

  onCreateEjercicio() {
    this.createEjercicio.emit();
  }

  onEditEjercicio(ejercicio: Ejercicio) {
    this.editEjercicio.emit(ejercicio);
  }

  onDeleteEjercicio(id: string) {
    this.deleteEjercicio.emit(id);
  }
}