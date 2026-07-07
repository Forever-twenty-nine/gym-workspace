import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IonIcon, IonLabel, IonItem, IonAvatar, IonNote } from '@ionic/angular/standalone';
import { personOutline } from 'ionicons/icons';
import { ProfileHead } from '../../../../../core/interfaces/profile-head.interface';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-profile-user-header',
  imports: [IonIcon, IonLabel, IonItem, IonAvatar, IonNote],
  templateUrl: './profile-user-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileUserHeaderComponent {

  constructor() {
    addIcons({ 'person-outline': personOutline });
  }

  user = input.required<ProfileHead>();
}
