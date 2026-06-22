import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonAvatar, IonNote, IonItemOptions, IonItemOption, IonItemSliding, IonCard, IonCardContent, IonCardTitle, IonCardHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Entrenado } from 'gym-library';
import { eyeOutline, barbellOutline, mailOutline, chevronBackOutline } from 'ionicons/icons';

export interface EntrenadoViewModel {
    id: string;
    nombre: string;
    photoURL?: string;
    objetivo: string;
    estaEntrenando: boolean;
    rutinasCount: number;
    entrenado: Entrenado;
}

@Component({
    selector: 'app-mis-entrenados',
    templateUrl: './mis-entrenados.component.html',
    standalone: true,
    imports: [IonCardHeader, IonCardTitle, IonCardContent, 
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
    IonNote,
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonCard
]
})
export class MisEntrenadosComponent {

    constructor() {
        addIcons({
            'eye-outline': eyeOutline,
            'barbell-outline': barbellOutline,
            'mail-outline': mailOutline,
            'chevron-back-outline': chevronBackOutline,
        });
    }
    entrenados = input.required<EntrenadoViewModel[]>();

    verCliente = output<Entrenado>();
    openRutinasModal = output<Entrenado>();

    async toggleSliding(slidingItem: IonItemSliding) {
        const isOpened = await slidingItem.getOpenAmount() > 0;
        if (isOpened) {
            await slidingItem.close();
        } else {
            await slidingItem.open('end');
        }
    }

    getAvatarUrl() {
        return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
}
