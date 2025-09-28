import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from 'gym-library';

@Component({
  selector: 'app-clientes-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes-card.component.html'
})
export class ClientesCardComponent {
  @Input() clientes: Cliente[] = [];
  @Output() createCliente = new EventEmitter<void>();
  @Output() editCliente = new EventEmitter<Cliente>();
  @Output() deleteCliente = new EventEmitter<string>();

  onCreateCliente() {
    this.createCliente.emit();
  }

  onEditCliente(cliente: Cliente) {
    this.editCliente.emit(cliente);
  }

  onDeleteCliente(id: string) {
    this.deleteCliente.emit(id);
  }
}