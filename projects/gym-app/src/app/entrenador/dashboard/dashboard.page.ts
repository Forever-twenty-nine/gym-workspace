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
  IonList,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, fitnessOutline, statsChartOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
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
    IonList,
    IonGrid,
    IonRow,
    IonCol
  ],
})
export class DashboardPage {
  stats = {
    clientesActivos: 15,
    entrenamientosHoy: 8,
    nuevosClientes: 3,
    horasEntrenamiento: 32
  };

  clientesRecientes = [
    { nombre: 'Ana García', ultimoEntrenamiento: '2025-01-28', estado: 'activo' },
    { nombre: 'Carlos López', ultimoEntrenamiento: '2025-01-27', estado: 'activo' },
    { nombre: 'María Rodríguez', ultimoEntrenamiento: '2025-01-26', estado: 'pendiente' }
  ];

  constructor() {
    addIcons({ peopleOutline, fitnessOutline, statsChartOutline, calendarOutline });
  }

  verCliente(cliente: any) {
    console.log('Ver cliente:', cliente);
  }

  crearEntrenamiento() {
    console.log('Crear nuevo entrenamiento');
  }
}
