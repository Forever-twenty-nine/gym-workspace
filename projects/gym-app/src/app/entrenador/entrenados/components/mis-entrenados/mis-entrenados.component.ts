import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonAvatar, IonNote, IonItemOptions, IonItemOption, IonItemSliding, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Entrenado } from 'gym-library';
import { eyeOutline, barbellOutline, mailOutline, trashOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
    imports: [
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
    IonCard,
    IonCardContent,
    EmptyStateComponent
]
})
export class MisEntrenadosComponent {

    constructor() {
        addIcons({
            'eye-outline': eyeOutline,
            'barbell-outline': barbellOutline,
            'mail-outline': mailOutline,
            'trash-outline': trashOutline
        });
    }
    entrenados = input.required<EntrenadoViewModel[]>();

    verCliente = output<Entrenado>();
    openRutinasModal = output<Entrenado>();
    desasociar = output<Entrenado>();

    getAvatarUrl() {
        return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
}
