import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, closeCircleOutline } from 'ionicons/icons';

export interface InvitacionViewModel {
    id: string;
    nombre: string;
    email: string;
    fechaCreacion: Date;
}

@Component({
    selector: 'app-invitaciones-pendientes',
    templateUrl: './invitaciones-pendientes.component.html',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        IonList,
        IonItem,
        IonLabel,
        IonIcon,
        IonItemSliding,
        IonAvatar,
        IonNote,
        IonItemOptions,
        IonItemOption
    ]
})
export class InvitacionesPendientesComponent {
    invitaciones = input.required<InvitacionViewModel[]>();
    onCancelar = output<string>();

    constructor() {
        addIcons({ mailOutline, closeCircleOutline });
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
