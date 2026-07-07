import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, pencilOutline } from 'ionicons/icons';
import { DateBadgeComponent } from '../../../../../shared/components/date-badge/date-badge.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-convocatoria-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    DateBadgeComponent,
    EmptyStateComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './convocatoria-list.component.html'
})
export class ConvocatoriaListComponent {
  @Input() convocatorias: import('gym-library').Convocatoria[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<import('gym-library').Convocatoria>();

  constructor() {
    addIcons({ trashOutline, pencilOutline });
  }

  onCreate() {
    this.create.emit();
  }

  onDelete(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.delete.emit(id);
  }

  onEdit(item: import('gym-library').Convocatoria, event?: Event) {
    if (event) event.stopPropagation();
    this.edit.emit(item);
  }
}