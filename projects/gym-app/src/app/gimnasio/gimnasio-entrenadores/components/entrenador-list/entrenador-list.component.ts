import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemove } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ListItemComponent } from '../../../../shared/components/app-list-item/app-list-item.component';

@Component({
  selector: 'app-entrenador-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonButton,
    IonIcon,
    EmptyStateComponent,
    ListItemComponent
  ],
  templateUrl: './entrenador-list.component.html'
})
export class EntrenadorListComponent {
  entrenadores = input<any[]>([]);
  desvincular = output<any>();

  constructor() {
    addIcons({ personRemove });
  }
}
