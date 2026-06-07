import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonPopover,
  IonContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline, lockClosed, pencilOutline } from 'ionicons/icons';
import { Rutina } from 'gym-library';

@Component({
  selector: 'app-rutina-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonPopover,
    IonContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
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
    addIcons({ add, trashOutline, lockClosed, pencilOutline });
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
