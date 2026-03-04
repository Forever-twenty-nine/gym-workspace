import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import {
    IonHeader,
    IonContent,
    IonModal,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonTextarea
} from '@ionic/angular/standalone';
import { HeaderEntrenadorComponent } from '../../../components/header-entrenador/header-entrenador.component';

@Component({
    selector: 'app-invitacion-modal',
    templateUrl: './invitacion-modal.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonHeader,
        IonContent,
        IonModal,
        IonButton,
        IonIcon,
        IonItem,
        IonInput,
        IonTextarea,
        HeaderEntrenadorComponent
    ]
})
export class InvitacionModalComponent {
    isOpen = input.required<boolean>();
    form = input.required<FormGroup>();
    isSaveDisabled = input.required<boolean>();

    close = output<void>();
    save = output<void>();
}
