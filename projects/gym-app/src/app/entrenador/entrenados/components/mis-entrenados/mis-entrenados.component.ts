import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButton
} from '@ionic/angular/standalone';
import { Entrenado } from 'gym-library';

@Component({
    selector: 'app-mis-entrenados',
    templateUrl: './mis-entrenados.component.html',
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonBadge,
        IonIcon,
        IonButton
    ]
})
export class MisEntrenadosComponent {
    entrenados = input.required<Entrenado[]>();

    // Callbacks passed from parent to avoid service duplication if desired
    // Or just pass the methods as inputs
    getUserName = input.required<(id: string) => string>();
    estaEntrenando = input.required<(id: string) => boolean>();
    getRutinasCount = input.required<(id: string) => number>();

    verCliente = output<Entrenado>();
    openRutinasModal = output<Entrenado>();
    openInvitacionModal = output<void>();
}
