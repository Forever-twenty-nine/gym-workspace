import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonChip,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timerOutline,
  pauseOutline,
  playOutline,
  stopOutline,
  checkmarkCircleOutline,
  fitnessOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-cronometro-rutina',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel
  ],
  templateUrl: './cronometro-rutina.component.html',
  styleUrls: ['./cronometro-rutina.component.css']
})
export class CronometroRutinaComponent {
  // Inputs
  nombreRutina = input<string>('');
  tiempoTranscurrido = input<number>(0);
  pausado = input<boolean>(false);
  cantidadEjercicios = input<number>(0);

  // Outputs
  pausar = output<void>();
  finalizar = output<void>();
  detener = output<void>();

  constructor() {
    addIcons({
      timerOutline,
      pauseOutline,
      playOutline,
      stopOutline,
      checkmarkCircleOutline,
      fitnessOutline
    });
  }

  /**
   * Formatea el tiempo en formato HH:MM:SS
   */
  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segsStr = segs.toString().padStart(2, '0');
    
    return `${horasStr}:${minutosStr}:${segsStr}`;
  }

  onPausar() {
    this.pausar.emit();
  }

  onFinalizar() {
    this.finalizar.emit();
  }

  onDetener() {
    this.detener.emit();
  }
}
