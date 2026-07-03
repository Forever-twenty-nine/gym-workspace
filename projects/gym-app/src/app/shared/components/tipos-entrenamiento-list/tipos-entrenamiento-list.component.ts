import { Component, Input, Output, ChangeDetectionStrategy, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, pencilOutline } from 'ionicons/icons';
import { TipoEntrenamiento } from 'gym-library';

@Component({
  selector: 'app-tipos-entrenamiento-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ],
  templateUrl: './tipos-entrenamiento-list.component.html',
  styleUrls: ['./tipos-entrenamiento-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiposEntrenamientoListComponent {
  @Input() tipos: TipoEntrenamiento[] = [];
  @Output() edit = new EventEmitter<TipoEntrenamiento>();
  @Output() delete = new EventEmitter<TipoEntrenamiento>();
  @Output() loadDefaults = new EventEmitter<void>();

  constructor() {
    addIcons({ trashOutline, pencilOutline });
  }

  onEdit(tipo: TipoEntrenamiento) {
    this.edit.emit(tipo);
  }

  onDelete(tipo: TipoEntrenamiento) {
    this.delete.emit(tipo);
  }

  onLoadDefaults() {
    this.loadDefaults.emit();
  }
}
