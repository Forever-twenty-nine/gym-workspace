import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';

@Component({
  selector: 'app-ejercicios-list',
  templateUrl: './ejercicios-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EjerciciosListComponent {
  @Input() ejercicios: any[] = [];
  @Output() ver = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<string>();

  constructor() {
    addIcons({ pencil, trash });
  }

  onVer(ejercicio: any) {
    this.ver.emit(ejercicio);
  }

  onEliminar(id: string) {
    this.eliminar.emit(id);
  }
}
