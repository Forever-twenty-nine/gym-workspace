import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCard,
    IonCardContent,
    IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';

@Component({
    selector: 'app-lista-rutinas',
    templateUrl: './lista-rutinas.component.html',
    standalone: true,
    imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCard,
    IonCardContent,
    IonText
]
})
export class ListaRutinasComponent {
    rutinas = input.required<any[]>();
    verRutina = output<any>();
    deleteRutina = output<string>();

    constructor() {
        addIcons({ pencilOutline, trashOutline });
    }
}
