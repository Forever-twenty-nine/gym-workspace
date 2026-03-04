import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPopover,
    IonButton,
    IonIcon,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
} from '@ionic/angular/standalone';
import { Entrenado } from 'gym-library';

@Component({
    selector: 'app-entrenado-detalle-popover',
    templateUrl: './entrenado-detalle-popover.component.html',
    styleUrls: ['./entrenado-detalle-popover.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonPopover,
        IonButton,
        IonIcon,
        IonAvatar,
        IonList,
        IonItem,
        IonLabel,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent
    ]
})
export class EntrenadoDetallePopoverComponent {
    isOpen = input.required<boolean>();
    entrenado = input<Entrenado | null>(null);
    estadisticas = input<any>(null);

    // Callbacks
    getUserName = input.required<(id: string) => string>();
    formatearTiempo = input.required<(segundos: number) => string>();
    getAntiguedadDias = input.required<(entrenado: Entrenado) => number | null>();

    close = output<void>();
}
