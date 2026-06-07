import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonButton, IonIcon, IonPopover, IonContent, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline, pencilOutline } from 'ionicons/icons';

@Component({
  selector: 'app-convocatoria-list',
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
  templateUrl: './convocatoria-list.component.html'
})
export class ConvocatoriaListComponent {
  @Input() convocatorias: import('gym-library').Convocatoria[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<import('gym-library').Convocatoria>();

  constructor() {
    addIcons({ add, trashOutline, pencilOutline });
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
