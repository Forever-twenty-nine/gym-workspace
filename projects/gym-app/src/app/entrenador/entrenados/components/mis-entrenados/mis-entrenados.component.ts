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
    IonIcon,
    IonButton,
    IonAvatar,
    IonNote,
    IonItemOptions,
    IonItemOption,
    IonItemSliding
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Entrenado } from 'gym-library';
import { eyeOutline, barbellOutline, mailOutline, chevronBackOutline } from 'ionicons/icons';

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
        IonIcon,
        IonButton,
        IonAvatar,
        IonNote,
        IonItemOptions,
        IonItemOption,
        IonItemSliding
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
    entrenados = input.required<Entrenado[]>();
    getUserName = input.required<(id: string) => string>();
    estaEntrenando = input.required<(id: string) => boolean>();
    getRutinasCount = input.required<(id: string) => number>();

    verCliente = output<Entrenado>();
    openRutinasModal = output<Entrenado>();
    openInvitacionModal = output<void>();

    getAvatarUrl() {
        return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
}
