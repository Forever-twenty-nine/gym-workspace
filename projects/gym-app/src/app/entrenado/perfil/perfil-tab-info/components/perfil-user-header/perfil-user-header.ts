import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IonButton, IonIcon, IonLabel, IonItem, IonThumbnail, IonButtons } from '@ionic/angular/standalone';
import { personOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-perfil-user-header',
  imports: [IonButton, IonIcon, IonLabel, IonItem, IonThumbnail, IonButtons],
  templateUrl: './perfil-user-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserHeaderComponent {

  constructor() {
    addIcons({ 'person-outline': personOutline });
  }

  username = input<string>("");

  photoURL = input<string | null>(null);


  editClick = output<void>();
}
