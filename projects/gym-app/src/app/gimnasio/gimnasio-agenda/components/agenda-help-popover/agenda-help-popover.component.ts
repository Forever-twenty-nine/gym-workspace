import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonPopover } from '@ionic/angular/standalone';

@Component({
  selector: 'app-agenda-help-popover',
  standalone: true,
  imports: [CommonModule, IonPopover],
  templateUrl: './agenda-help-popover.component.html'
})
export class AgendaHelpPopoverComponent {
  triggerId = input.required<string>();
}
