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
    IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
    EmptyStateComponent
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
