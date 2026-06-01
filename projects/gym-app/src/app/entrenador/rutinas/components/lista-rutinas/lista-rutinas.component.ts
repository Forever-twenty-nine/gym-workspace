import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonAvatar,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, calendarOutline } from 'ionicons/icons';

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
    IonItemOption
]
})
export class ListaRutinasComponent {
    rutinas = input.required<any[]>();
    verRutina = output<any>();
    deleteRutina = output<string>();

    constructor() {
        addIcons({ pencilOutline, trashOutline, calendarOutline });
    }

    async toggleSliding(slidingItem: IonItemSliding) {
        const isOpened = await slidingItem.getOpenAmount() > 0;
        if (isOpened) {
            await slidingItem.close();
        } else {
            await slidingItem.open('end');
        }
    }
}
