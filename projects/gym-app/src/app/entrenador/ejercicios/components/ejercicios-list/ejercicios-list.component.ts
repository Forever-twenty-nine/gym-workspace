import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonText,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ejercicios-list',
  templateUrl: './ejercicios-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonText,
    IonCard,
    IonCardContent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EjerciciosListComponent {
  @Input() ejercicios: any[] = [];
  @Output() ver = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<string>();

  constructor() {
    addIcons({ pencilOutline, trashOutline });
  }

  onVer(ejercicio: any) {
    this.ver.emit(ejercicio);
  }

  onEliminar(id: string) {
    this.eliminar.emit(id);
  }
}
