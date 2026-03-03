import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonIcon
} from '@ionic/angular/standalone';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { SocialCardComponent } from './components/social-card/social-card.component';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonIcon,
    SocialCardComponent
  ],
  styleUrls: ['./social.page.css']
})
export class SocialPage {
  private sesionRutinaService = inject(SesionRutinaService);
  
  feedSocial = this.sesionRutinaService.getSesionesCompartidas();

  constructor() {
    addIcons({ peopleOutline });
  }
}

