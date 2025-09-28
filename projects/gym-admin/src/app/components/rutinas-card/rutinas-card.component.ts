import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rutina, User } from 'gym-library';

@Component({
  selector: 'app-rutinas-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutinas-card.component.html'
})
export class RutinasCardComponent {
  @Input() rutinas: Rutina[] = [];
  @Input() usuarios: User[] = [];
  @Input() canCreateRutina: boolean = true;
  @Input() validationMessage: string = '';
  @Output() createRutina = new EventEmitter<void>();
  @Output() editRutina = new EventEmitter<Rutina>();
  @Output() deleteRutina = new EventEmitter<string>();

  onCreateRutina() {
    if (this.canCreateRutina) {
      this.createRutina.emit();
    }
  }

  onEditRutina(rutina: Rutina) {
    this.editRutina.emit(rutina);
  }

  onDeleteRutina(id: string) {
    this.deleteRutina.emit(id);
  }

  getClienteName(clienteId: string): string {
    if (!clienteId) return 'Sin asignar';
    const cliente = this.usuarios.find(u => u.uid === clienteId);
    return cliente?.nombre || 'Cliente no encontrado';
  }

  getEntrenadorName(entrenadorId: string): string {
    if (!entrenadorId) return 'Sin asignar';
    const entrenador = this.usuarios.find(u => u.uid === entrenadorId);
    return entrenador?.nombre || 'Entrenador no encontrado';
  }
}