import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonModal,
    IonIcon,
    IonContent,
    IonText,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    peopleOutline,
    timeOutline,
    calendarOutline,
    personOutline,
    chatbubbleOutline,
    handRightOutline,
} from 'ionicons/icons';
import { UserService } from '../../../../core/services/user.service';
import { Convocatoria, User } from 'gym-library';

@Component({
    selector: 'app-encuentro-detalle-modal',
    standalone: true,
    imports: [
        IonButton,
        IonItem, IonList, IonLabel, IonCol, IonText, IonNote, IonRow, IonGrid, IonCardContent, IonCard,
        CommonModule,
        IonModal,
        IonIcon,
        IonContent,
        IonAvatar,
    ],
    templateUrl: './encuentro-detalle-modal.component.html',

})
export class EncuentroDetalleModalComponent {
    private userService = inject(UserService);

    @Input() isOpen = false;
    @Output() didDismiss = new EventEmitter<void>();
    @Output() irASocial = new EventEmitter<void>();

    private _encuentroSignal = signal<Convocatoria | null>(null);

    @Input() set encuentro(val: Convocatoria | null) {
        this._encuentroSignal.set(val);
    }
    get encuentro() { return this._encuentroSignal(); }

    interesadosUsers = computed(() => {
        const enc = this._encuentroSignal();
        if (!enc || !enc.interesados?.length) return [];
        const allUsers = this.userService.users();
        return enc.interesados.map(uid => allUsers.find(u => u.uid === uid)).filter((u): u is User => !!u);
    });

    get fechaFormateada(): string {
        const enc = this.encuentro;
        if (!enc?.fechaEntrenamiento) return '';

        const f = enc.fechaEntrenamiento instanceof Date
            ? enc.fechaEntrenamiento
            : new Date(enc.fechaEntrenamiento);

        return f.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    constructor() {
        addIcons({
            peopleOutline,
            timeOutline,
            calendarOutline,
            personOutline,
            chatbubbleOutline,
            handRightOutline,
        });
    }

    cerrarModal() {
        this.didDismiss.emit();
    }

    navegarASocial() {
        this.irASocial.emit();
    }
}
