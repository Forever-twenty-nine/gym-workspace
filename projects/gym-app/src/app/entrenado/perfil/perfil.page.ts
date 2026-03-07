import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { UserProfileComponent } from '../../shared/components/user-profile/user-profile.component';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.css'],
  standalone: true,
  imports: [
    IonContent,
    HeaderTabsComponent,
    UserProfileComponent
  ],
})
export class PerfilPage {
  constructor() {}
}
