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
}

export interface CardItem {
  id?: string;
  uid?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-generic-card',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm h-[500px] flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">{{ config().title }}</h2>
          @if (config().showCounter) {
            <span [class]="getCounterClasses()">{{ items().length }}</span>
          }
        </div>
        
        <button 
          [class]="getButtonClasses()"
          [disabled]="!canCreate()"
          (click)="create.emit()">
          {{ config().createButtonText }}
        </button>
        
        @if (!canCreate() && validationMessage()) {
          <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-xs text-amber-800">{{ validationMessage() }}</p>
          </div>
        }
      </div>

      <!-- Lista simple con scroll -->
      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto divide-y divide-gray-100">
          @for (item of items(); track getItemId(item)) {
            <div class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-center">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ getDisplayValue(item) }}</h4>
                </div>
                <div class="flex gap-2 ml-4">
                  <button 
                    class="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                    (click)="edit.emit(item)">
                    Editar
                  </button>
                  <button 
                    class="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded border border-red-200 hover:bg-red-100 transition-colors"
                    (click)="delete.emit(getItemId(item))">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="p-8 text-center text-gray-500">
              <p class="text-sm font-medium">{{ config().emptyStateTitle }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
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