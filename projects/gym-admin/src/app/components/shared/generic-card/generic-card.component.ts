import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CardConfig {
  title: string;
  createButtonText: string;
  createButtonColor: 'blue' | 'green' | 'orange' | 'purple';
  emptyStateTitle: string;
  displayField: string; // Campo a mostrar como título del item (ej: 'nombre', 'title', etc.)
  showCounter?: boolean;
  counterColor?: 'blue' | 'green' | 'orange' | 'purple';
  showChips?: string[]; // Campos a mostrar como chips
  chipLabels?: { [key: string]: string }; // Etiquetas personalizadas para los chips
}

export interface CardItem {
  id?: string;
  uid?: string;
  needsReview?: boolean; // Nuevo campo para indicar si necesita revisión
  [key: string]: any;
}

@Component({
  selector: 'app-generic-card',
  imports: [CommonModule],
  templateUrl: './generic-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericCardComponent {
  config = input.required<CardConfig>();
  items = input<CardItem[]>([]);
  canCreate = input<boolean>(true);
  validationMessage = input<string>('');
  idField = input<string>('id');
  
  create = output<void>();
  edit = output<CardItem>();
  delete = output<string>();

  getItemId(item: CardItem): string {
    return (item as any)[this.idField()] || '';
  }

  getDisplayValue(item: CardItem): string {
    return (item as any)[this.config().displayField] || 'Sin nombre';
  }

  getChipValue(item: CardItem, field: string): string | null {
    const value = (item as any)[field];
    return value || null;
  }

  getChipClasses(chipField: string): string {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md';
    
    if (chipField === 'gimnasioName') {
      return `${baseClasses} bg-purple-50 text-purple-700 border border-purple-200`;
    } else if (chipField === 'entrenadorName') {
      return `${baseClasses} bg-orange-50 text-orange-700 border border-orange-200`;
    } else if (chipField === 'creadorName') {
      return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200`;
    } else if (chipField === 'asignadoName') {
      return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
    } else if (chipField === 'ejerciciosCount') {
      return `${baseClasses} bg-orange-50 text-orange-700 border border-orange-200`;
    } else if (chipField === 'clientesCount') {
      return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
    } else if (chipField === 'rutinasCount') {
      return `${baseClasses} bg-purple-50 text-purple-700 border border-purple-200`;
    }
    
    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
  }

  getChipIconClasses(chipField: string): string {
    const baseClasses = 'w-3 h-3';
    
    if (chipField === 'gimnasioName') {
      return `${baseClasses} text-purple-600`;
    } else if (chipField === 'entrenadorName') {
      return `${baseClasses} text-orange-600`;
    } else if (chipField === 'creadorName') {
      return `${baseClasses} text-blue-600`;
    } else if (chipField === 'asignadoName') {
      return `${baseClasses} text-green-600`;
    } else if (chipField === 'ejerciciosCount') {
      return `${baseClasses} text-orange-600`;
    } else if (chipField === 'clientesCount') {
      return `${baseClasses} text-green-600`;
    } else if (chipField === 'rutinasCount') {
      return `${baseClasses} text-purple-600`;
    }
    
    return `${baseClasses} text-gray-600`;
  }

  getButtonClasses(): string {
    const baseClasses = 'w-full mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors';
    
    if (!this.canCreate()) {
      return `${baseClasses} bg-gray-400 cursor-not-allowed opacity-60`;
    }

    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',  
      orange: 'bg-orange-600 hover:bg-orange-700',
      purple: 'bg-purple-600 hover:bg-purple-700'
    };

    return `${baseClasses} ${colorMap[this.config().createButtonColor]}`;
  }

  getCounterClasses(): string {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800'
    };

    const counterColor = this.config().counterColor || this.config().createButtonColor;
    return `${colorMap[counterColor]} text-xs font-medium px-2.5 py-0.5 rounded-full`;
  }
}