import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline, lockClosed, pencilOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ejercicio-list',
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
  templateUrl: './ejercicio-list.component.html'
})
export class EjercicioListComponent {
  @Input() ejercicios: import('gym-library').Ejercicio[] = [];
  @Input() isPremium = false;

  private _ownIds = new Set<string>();

  @Input() set ownEjercicioIds(value: Set<string> | string[] | undefined) {
    if (value instanceof Set) {
      this._ownIds = value;
    } else {
      this._ownIds = new Set(value || []);
    }
  }

  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<import('gym-library').Ejercicio>();

  constructor() {
    addIcons({ add, trashOutline, lockClosed, pencilOutline });
  }

  isOwn(id: string): boolean {
    return this._ownIds.has(id);
  }

  onCreate() {
    this.create.emit();
  }

  onDelete(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.delete.emit(id);
  }

  onEdit(item: import('gym-library').Ejercicio, event?: Event) {
    if (event) event.stopPropagation();
    this.edit.emit(item);
  }
}
