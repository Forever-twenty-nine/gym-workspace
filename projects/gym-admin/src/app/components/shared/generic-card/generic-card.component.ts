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
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100vh-18rem)] max-h-[420px] min-h-[350px] flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">{{ config().title }}</h2>
          @if (config().showCounter) {
            <span [class]="getCounterClasses()">{{ items().length }}</span>
          }
        </div>
        
        @if (canCreate()) {
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
        }
      </div>

      <!-- Lista simple con scroll -->
      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          @for (item of items(); track getItemId(item)) {
            <div class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-center">
                <div class="flex-1 flex items-center gap-3">
                  <h4 class="font-medium text-gray-900">{{ getDisplayValue(item) }}</h4>
                  
                  @if (item.needsReview) {
                    <div class="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                      <span>Revisar</span>
                    </div>
                  }
                  
                  @if (config().showChips && config().showChips!.length > 0) {
                    <div class="flex items-center gap-2">
                      @for (chipField of config().showChips!; track chipField) {
                        @if (getChipValue(item, chipField)) {
                          <div [class]="getChipClasses(chipField)">
                            <svg [class]="getChipIconClasses(chipField)" fill="currentColor" viewBox="0 0 20 20">
                              @if (chipField === 'gimnasioName') {
                                <!-- Icono de gimnasio/building -->
                                <path fill-rule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5H4zM5.5 4v1a.5.5 0 001 0V4a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0V4a.5.5 0 00-1 0zm3.5.5V4a.5.5 0 00-1 0v1a.5.5 0 001 0zM5.5 7v1a.5.5 0 001 0V7a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0V7a.5.5 0 00-1 0zm3.5.5V7a.5.5 0 00-1 0v1a.5.5 0 001 0zM5.5 10v1a.5.5 0 001 0v-1a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0v-1a.5.5 0 00-1 0zm3.5.5v-1a.5.5 0 00-1 0v1a.5.5 0 001 0z" clip-rule="evenodd"></path>
                              } @else if (chipField === 'entrenadorName') {
                                <!-- Icono de entrenador/person -->
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                              } @else if (chipField === 'creadorName') {
                                <!-- Icono de creador/usuario con herramientas -->
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd"></path>
                              } @else if (chipField === 'asignadoName') {
                                <!-- Icono de asignado/target -->
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202a1 1 0 000-1.732l-4.445-2.634z" clip-rule="evenodd"></path>
                              } @else if (chipField === 'ejerciciosCount') {
                                <!-- Icono de ejercicios/pesas -->
                                <path fill-rule="evenodd" d="M7.22 3.22a.75.75 0 011.06 0L10 4.94l1.72-1.72a.75.75 0 111.06 1.06L11.06 6l1.72 1.72a.75.75 0 01-1.06 1.06L10 7.06 8.28 8.78a.75.75 0 01-1.06-1.06L8.94 6 7.22 4.28a.75.75 0 010-1.06zM3 10a7 7 0 1114 0 7 7 0 01-14 0zm7-5a5 5 0 100 10 5 5 0 000-10z" clip-rule="evenodd"></path>
                              } @else if (chipField === 'clientesCount') {
                                <!-- Icono de clientes/personas -->
                                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01.569-1.175 6.002 6.002 0 0111.632 0c.232.348.315.826.569 1.175C14.671 15.128 10 14 7 14c-3 0-7.671 1.128-5.385 2.428zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-4.084 4.5 4.5 0 012.092 3.84c.374.654.233 1.177-.446 1.177z"></path>
                              } @else if (chipField === 'rutinasCount') {
                                <!-- Icono de rutinas/lista -->
                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                              } @else {
                                <!-- Icono genérico -->
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                              }
                            </svg>
                            <span class="text-xs font-medium">{{ getChipValue(item, chipField) }}</span>
                          </div>
                        }
                      }
                    </div>
                  }
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