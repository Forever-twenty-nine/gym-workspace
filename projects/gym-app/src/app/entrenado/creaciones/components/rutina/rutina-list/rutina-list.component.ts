import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, lockClosed, pencilOutline } from 'ionicons/icons';
import { Rutina } from 'gym-library';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-rutina-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    EmptyStateComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './rutina-list.component.html'
})
export class RutinaListComponent {
  @Input() rutinas: Rutina[] = [];
  @Input() isPremium = false;

  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<Rutina>();

  constructor() {
    addIcons({ trashOutline, lockClosed, pencilOutline });
  }

  onCreate() {
    this.create.emit();
  }

  onDelete(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.delete.emit(id);
  }

  onEdit(item: Rutina, event?: Event) {
    if (event) event.stopPropagation();
    this.edit.emit(item);
  }
}