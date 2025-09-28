import { Component } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, 
  documentTextOutline, 
  trendingUpOutline,
  alertCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ],
})
export class GimnasioDashboardPage {
  stats = {
    totalUsers: 156,
    activeUsers: 89,
    newReports: 12,
    systemAlerts: 3
  };

  constructor() {
    addIcons({ 
      peopleOutline, 
      documentTextOutline, 
      trendingUpOutline,
      alertCircleOutline 
    });
  }
}
