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
  templateUrl: './entity-card.component.html'
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