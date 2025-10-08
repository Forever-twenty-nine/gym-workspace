import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipIconComponent } from './chip-icon.component';
import { CardConfig, CardItem, ChipConfig, ColorVariant } from './generic-card.types';

@Component({
  selector: 'app-generic-card',
  imports: [CommonModule, ChipIconComponent],
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

  private readonly chipConfigs: Record<string, ChipConfig> = {
    gimnasioName: { color: 'purple', icon: 'building' },
    entrenadorName: { color: 'orange', icon: 'person' },
    creadorName: { color: 'blue', icon: 'user' },
    asignadoName: { color: 'green', icon: 'target' },
    ejerciciosCount: { color: 'orange', icon: 'dumbbell' },
    clientesCount: { color: 'green', icon: 'users' },
    rutinasCount: { color: 'purple', icon: 'list' }
  };

  private readonly colorClasses: Record<ColorVariant, { bg: string; text: string; border: string; hover: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-700' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-700' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-700' }
  };

  buttonClasses = computed(() => {
    const base = 'w-full mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors';
    
    if (!this.canCreate()) {
      return `${base} bg-gray-400 cursor-not-allowed opacity-60`;
    }

    const color = this.config().createButtonColor;
    return `${base} bg-${color}-600 ${this.colorClasses[color].hover}`;
  });

  counterClasses = computed(() => {
    const color = this.config().counterColor || this.config().createButtonColor;
    const classes = this.colorClasses[color];
    return `${classes.bg} ${classes.text} text-xs font-medium px-2.5 py-0.5 rounded-full`;
  });

  getItemId(item: CardItem): string {
    return item[this.idField()] || '';
  }

  getDisplayValue(item: CardItem): string {
    return item[this.config().displayField] || 'Sin nombre';
  }

  getChipValue(item: CardItem, field: string): string | null {
    return item[field] || null;
  }

  getChipConfig(chipField: string): ChipConfig {
    return this.chipConfigs[chipField] || { color: 'blue', icon: 'default' };
  }

  getChipClasses(chipField: string): string {
    const { color } = this.getChipConfig(chipField);
    const classes = this.colorClasses[color];
    return `inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md ${classes.bg} ${classes.text} border ${classes.border}`;
  }
}