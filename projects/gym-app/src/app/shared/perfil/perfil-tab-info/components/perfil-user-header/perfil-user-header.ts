import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonButton, IonIcon, IonLabel, IonItem, IonThumbnail, IonButtons, IonNote } from '@ionic/angular/standalone';
import { personOutline, pencilOutline } from 'ionicons/icons';
import { ProfileHead } from '../../../../../core/interfaces/profile-head.interface';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-perfil-user-header',
  imports: [IonButton, IonIcon, IonLabel, IonItem, IonThumbnail, IonNote],
  templateUrl: './perfil-user-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserHeaderComponent {

  constructor() {
    addIcons({ 'person-outline': personOutline, 'pencil-outline': pencilOutline });
  }

  user = input.required<ProfileHead>();

  editClick = output<void>();
}
