import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  count: number;
  accent?: 'blue' | 'amber' | 'purple' | 'green';
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center mb-3">
      <div class="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800 flex-wrap shadow-sm">
        @for (tab of tabs(); track tab.id) {
          <button (click)="select(tab.id)"
            [ngClass]="getTabClasses(tab)"
            class="px-3 py-1 rounded-md font-medium text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1">
            {{ tab.label }}
            <span class="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {{ tab.count }}
            </span>
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  tabs = input.required<TabItem[]>();
  active = input.required<string>();
  tabChange = output<string>();

  select(id: string) {
    this.tabChange.emit(id);
  }

  getTabClasses(tab: TabItem): string {
    const isActive = this.active() === tab.id;
    if (!isActive) {
      return 'text-gray-600 dark:text-gray-400';
    }
    const accent = tab.accent || 'blue';
    if (accent === 'amber') {
      return 'bg-white text-amber-600 shadow-sm dark:bg-gray-700 dark:text-white';
    }
    if (accent === 'purple') {
      return 'bg-white text-purple-600 shadow-sm dark:bg-gray-700 dark:text-white';
    }
    return 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white';
  }
}
