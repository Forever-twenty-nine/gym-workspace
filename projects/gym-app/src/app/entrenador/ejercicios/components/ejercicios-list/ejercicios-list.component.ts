import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton, 
  IonIcon,
  IonAvatar,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, barbellOutline } from 'ionicons/icons';

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
    IonItemOption
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EjerciciosListComponent {
  @Input() ejercicios: any[] = [];
  @Output() ver = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<string>();

  constructor() {
    addIcons({ pencilOutline, trashOutline, barbellOutline });
  }

  async toggleSliding(slidingItem: IonItemSliding) {
    const isOpened = await slidingItem.getOpenAmount() > 0;
    if (isOpened) {
      await slidingItem.close();
    } else {
      await slidingItem.open('end');
    }
  }

  onVer(ejercicio: any) {
    this.ver.emit(ejercicio);
  }

  onEliminar(id: string) {
    this.eliminar.emit(id);
  }
}
