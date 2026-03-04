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
    IonButton,
    IonIcon
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-lista-rutinas',
    templateUrl: './lista-rutinas.component.html',
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
        IonButton,
        IonIcon
    ]
})
export class ListaRutinasComponent {
    rutinas = input.required<any[]>();
    verRutina = output<any>();
    deleteRutina = output<string>();
}
