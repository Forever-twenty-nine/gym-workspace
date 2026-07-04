import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonDatetime,
  IonModal,
  IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-proximos-entrenados',
  templateUrl: './proximos-entrenados.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonIcon,
    IonCard,
    IonCardContent,
    IonDatetime,
    IonModal,
    IonContent,
    IonCardTitle,
    IonCardHeader
]
})
export class ProximosEntrenadosComponent {
  entrenados = input.required<any[]>();
  getUserName = input.required<(id: string) => string>();

  isModalOpen = signal(false);
  selectedDateEntrenados = signal<any[]>([]);

  highlightedDates = computed(() => {
    return this.entrenados().map(e => {
      const d = e.proximaFecha as Date;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return {
        date: dateStr,
        textColor: '#ffffff',
        backgroundColor: 'var(--ion-color-primary)'
      };
    });
  });

  constructor() {
    addIcons({ calendarOutline });
  }

  onDateSelected(event: any) {
    const selectedValue = event.detail.value;
    if (!selectedValue) return;
    
    // selectedValue comes as ISO string e.g. "2026-07-04T00:00:00"
    const selectedDateStr = selectedValue.split('T')[0];
    
    const filtered = this.entrenados().filter(e => {
      const d = e.proximaFecha as Date;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return dateStr === selectedDateStr;
    });

    this.selectedDateEntrenados.set(filtered);
    this.isModalOpen.set(true);
  }
}
