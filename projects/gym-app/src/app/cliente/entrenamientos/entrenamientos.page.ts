import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, playOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-entrenamientos',
  templateUrl: './entrenamientos.page.html',
  styleUrls: ['./entrenamientos.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList
  ],
})
export class EntrenamientosPage {
  entrenamientos = [
    {
      id: 1,
      nombre: 'Rutina de Pecho y Tríceps',
      duracion: '45 min',
      ejercicios: 8,
      completado: false
    },
    {
      id: 2,
      nombre: 'Cardio HIIT',
      duracion: '30 min',
      ejercicios: 6,
      completado: true
    },
    {
      id: 3,
      nombre: 'Piernas y Glúteos',
      duracion: '50 min',
      ejercicios: 10,
      completado: false
    }
  ];

  constructor() {
    addIcons({ fitnessOutline, playOutline, timeOutline });
  }

  iniciarEntrenamiento(entrenamiento: any) {
    console.log('Iniciando entrenamiento:', entrenamiento);
    // Aquí iría la lógica para iniciar el entrenamiento
  }

  marcarCompletado(entrenamiento: any) {
    entrenamiento.completado = !entrenamiento.completado;
    console.log('Entrenamiento marcado como completado:', entrenamiento);
  }
}
