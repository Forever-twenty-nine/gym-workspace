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
  type: 'text' | 'boolean' | 'badge' | 'avatar';
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
      key: 'activo',
      label: 'Estado',
      type: 'boolean',
      class: 'px-6 py-4 text-center',
      badgeConfig: {
        trueLabel: 'Activo',
        falseLabel: 'Inactivo',
        trueClass: 'bg-green-100 text-green-800',
        falseClass: 'bg-red-100 text-red-800'
      }
    }
  ]);
  edit = output<EntrenadorTableItem>();

  onEdit(item: EntrenadorTableItem) {
    this.edit.emit(item);
  }
}