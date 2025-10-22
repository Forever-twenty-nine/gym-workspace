import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Entrenador } from 'gym-library';

interface EntrenadorTableItem extends Entrenador {
  displayName: string;
  email: string;
  plan: string;
}

interface ColumnConfig {
  key: keyof EntrenadorTableItem;
  label: string;
  type: 'text' | 'boolean' | 'badge' | 'avatar' | 'date';
  class?: string;
  badgeConfig?: {
    trueLabel: string;
    falseLabel: string;
    trueClass: string;
    falseClass: string;
  };
}

@Component({
  selector: 'app-entrenadores-table',
  imports: [CommonModule],
  templateUrl: './entrenadores-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoresTableComponent {
  items = input<EntrenadorTableItem[]>([]);
  columns = input<ColumnConfig[]>([
    {
      key: 'displayName',
      label: '',
      type: 'avatar',
      class: 'px-8 py-4 text-left'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      class: 'px-6 py-4 text-left'
    },
    {
      key: 'plan',
      label: 'Plan',
      type: 'badge',
      class: 'px-6 py-4 text-center',
      badgeConfig: {
        trueLabel: 'Premium',
        falseLabel: 'Free',
        trueClass: 'bg-yellow-100 text-yellow-800',
        falseClass: 'bg-gray-100 text-gray-800'
      }
    },
    {
      key: 'fechaRegistro',
      label: 'Fecha Registro',
      type: 'date',
      class: 'px-6 py-4 text-center'
    },
    {
      key: 'ejerciciosCreadasIds',
      label: 'Ejercicios Creados',
      type: 'text',
      class: 'px-6 py-4 text-center'
    },
    {
      key: 'entrenadosAsignadosIds',
      label: 'Entrenados Asignados',
      type: 'text',
      class: 'px-6 py-4 text-center'
    },
    {
      key: 'rutinasCreadasIds',
      label: 'Rutinas Creadas',
      type: 'text',
      class: 'px-6 py-4 text-center'
    }
  ]);
  edit = output<EntrenadorTableItem>();

  onEdit(item: EntrenadorTableItem) {
    this.edit.emit(item);
  }

  getDisplayValue(item: EntrenadorTableItem, key: keyof EntrenadorTableItem): string {
    const value = item[key];
    if (Array.isArray(value)) {
      return value.length.toString();
    }
    return value?.toString() || '';
  }
}