import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logs-section',
  imports: [CommonModule],
  templateUrl: './logs-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogsSectionComponent {
  logs = input<string[]>([]);

  trackByIndex(index: number): number {
    return index;
  }
}