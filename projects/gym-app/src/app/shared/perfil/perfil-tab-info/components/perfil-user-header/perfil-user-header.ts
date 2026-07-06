import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IonIcon, IonLabel, IonItem, IonThumbnail, IonNote } from '@ionic/angular/standalone';
import { personOutline } from 'ionicons/icons';
import { ProfileHead } from '../../../../../core/interfaces/profile-head.interface';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-perfil-user-header',
  imports: [IonIcon, IonLabel, IonItem, IonThumbnail, IonNote],
  templateUrl: './perfil-user-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserHeaderComponent {

  constructor() {
    addIcons({ 'person-outline': personOutline });
  }

  user = input.required<ProfileHead>();
}
