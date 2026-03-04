import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-invitaciones-pendientes',
    templateUrl: './invitaciones-pendientes.component.html',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonIcon,
        IonButton
    ]
})
export class InvitacionesPendientesComponent {
    invitaciones = input.required<any[]>();
    onCancelar = output<string>();
}
