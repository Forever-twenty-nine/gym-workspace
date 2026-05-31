import { Component } from '@angular/core';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-gimnasio-tabs',
  templateUrl: 'gimnasio-tabs.page.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton],
})
export class GimnasioTabsPage {
  
}
