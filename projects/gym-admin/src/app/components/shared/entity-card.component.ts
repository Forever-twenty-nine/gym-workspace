import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EntityCardConfig {
  title: string;
  icon: string;
  count: number;
  createButtonText: string;
  createButtonColor: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  canCreate?: boolean;
  validationMessage?: string;
}

export interface EntityAction {
  type: 'edit' | 'delete';
  icon: string;
  color: string;
  tooltip: string;
}

@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <!-- Header -->
      <h2 class="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
        {{ config.icon }} {{ config.title }}
        <span [class]="getCountBadgeClass()">{{ config.count }}</span>
      </h2>

      <div class="space-y-3">
        <!-- Create Button -->
        <button 
          class="w-full px-4 py-3 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
          [class]="getCreateButtonClass()"
          [disabled]="!canCreate()"
          (click)="onCreateClick()"
          [title]="getCreateButtonTitle()">
          @if (canCreate()) {
            ➕ {{ config.createButtonText }}
          } @else {
            ⚠️ {{ config.validationMessage || 'No se puede crear' }}
          }
        </button>

        <!-- Validation Message -->
        @if (!canCreate() && config.validationMessage) {
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div class="flex items-center gap-2">
              <span class="text-amber-500">⚠️</span>
              <p class="text-xs text-amber-700 font-medium">{{ config.validationMessage }}</p>
            </div>
          </div>
        }

        <!-- Entity List -->
        <div class="border border-gray-200 rounded-xl bg-gray-50 max-h-80 overflow-y-auto">
          @for(item of items; track trackByFn(item)) {
            <div class="px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-white transition-colors duration-150">
              <div class="flex justify-between items-center">
                <!-- Content Projection -->
                <div class="flex-1">
                  <ng-content select="[slot=item-content]"></ng-content>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  @for(action of actions; track action.type) {
                    <button 
                      class="p-2 rounded-lg transition-all duration-150 hover:scale-110"
                      [class]="getActionButtonClass(action)"
                      (click)="onActionClick(action.type, item)"
                      [title]="action.tooltip">
                      {{ action.icon }}
                    </button>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="px-4 py-8 text-center text-gray-500">
              <div class="text-4xl mb-2">{{ config.emptyStateIcon }}</div>
              <p class="text-sm font-medium">{{ config.emptyStateTitle }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ config.emptyStateSubtitle }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class EntityCardComponent<T = any> {
  @Input() config!: EntityCardConfig;
  @Input() items: T[] = [];
  @Input() actions: EntityAction[] = [
    { type: 'edit', icon: '✏️', color: 'blue', tooltip: 'Editar' },
    { type: 'delete', icon: '🗑️', color: 'red', tooltip: 'Eliminar' }
  ];
  @Input() trackByFn: (item: T) => any = (item: any) => item.id || item.uid;

  @Output() createEntity = new EventEmitter<void>();
  @Output() actionClicked = new EventEmitter<{ type: string; item: T }>();

  canCreate(): boolean {
    return this.config.canCreate !== false;
  }

  getCountBadgeClass(): string {
    const baseClass = "text-xs font-medium px-2.5 py-0.5 rounded-full";
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'purple': 'bg-purple-100 text-purple-800',
      'orange': 'bg-orange-100 text-orange-800'
    };
    return `${baseClass} ${colorMap[this.config.createButtonColor] || 'bg-gray-100 text-gray-800'}`;
  }

  getCreateButtonClass(): string {
    const baseClass = "w-full px-4 py-3 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg";
    const canCreate = this.canCreate();
    
    if (!canCreate) {
      return `${baseClass} bg-gray-400 cursor-not-allowed`;
    }

    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-600 hover:bg-blue-700',
      'green': 'bg-green-600 hover:bg-green-700',
      'purple': 'bg-purple-600 hover:bg-purple-700',
      'orange': 'bg-orange-600 hover:bg-orange-700'
    };
    
    return `${baseClass} ${colorMap[this.config.createButtonColor] || 'bg-gray-600 hover:bg-gray-700'}`;
  }

  getCreateButtonTitle(): string {
    return this.canCreate() ? `Crear ${this.config.title.toLowerCase()}` : this.config.validationMessage || 'No se puede crear';
  }

  getActionButtonClass(action: EntityAction): string {
    const colorMap: Record<string, string> = {
      'blue': 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
      'red': 'text-red-600 hover:text-red-800 hover:bg-red-100',
      'green': 'text-green-600 hover:text-green-800 hover:bg-green-100'
    };
    return colorMap[action.color] || 'text-gray-600 hover:text-gray-800 hover:bg-gray-100';
  }

  onCreateClick(): void {
    if (this.canCreate()) {
      this.createEntity.emit();
    }
  }

  onActionClick(type: string, item: T): void {
    this.actionClicked.emit({ type, item });
  }
}