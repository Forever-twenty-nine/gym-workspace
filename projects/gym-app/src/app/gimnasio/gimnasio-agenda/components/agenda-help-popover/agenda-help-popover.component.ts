import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonPopover, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-agenda-help-popover',
  standalone: true,
  imports: [CommonModule, IonPopover, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
  templateUrl: './agenda-help-popover.component.html'
})
export class AgendaHelpPopoverComponent {
  triggerId = input.required<string>();

  constructor() {
    addIcons({ informationCircleOutline });
  }
}
