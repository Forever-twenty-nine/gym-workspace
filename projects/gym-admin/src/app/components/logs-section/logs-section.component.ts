import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logs-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs-section.component.html'
})
export class LogsSectionComponent {
  @Input() logs: string[] = [];
}