import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { IonHeader, IonContent, IonModal, IonButton, IonItem, IonInput, IonTextarea, IonToolbar, IonButtons, IonTitle } from '@ionic/angular/standalone';

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
        IonItem,
        IonInput,
        IonTextarea,
        IonToolbar,
        IonButtons,
        IonTitle
    ]
})
export class InvitacionModalComponent {

    isOpen = input.required<boolean>();
    form = input.required<FormGroup>();
    isSaveDisabled = input.required<boolean>();

    close = output<void>();
    save = output<void>();

    cancel() {
        this.close.emit();
    }

}
