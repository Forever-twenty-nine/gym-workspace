import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Objetivo } from 'gym-library';

export interface EntrenadoTableItem {
  id: string;
  displayName: string;
  entrenadorName: string;
  gimnasioName?: string | null;
  objetivo?: Objetivo;
  fechaRegistro?: Date;
}

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-entrenados-table',
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './entrenados-table.component.html'
})
export class EntrenadosTableComponent {
  readonly entrenados = input<EntrenadoTableItem[]>([]);
  readonly edit = output<EntrenadoTableItem>();

  onEdit(id: string) {
    const item = this.entrenados().find(e => e.id === id);
    if (item) {
      this.edit.emit(item);
    }
  }
}