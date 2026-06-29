import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ProfileHead } from '../../../../../core/interfaces/profile-head.interface';
import { IonCard, IonList, IonItem, IonLabel } from "@ionic/angular/standalone";

@Component({
    selector: 'perfil-user-body',
    imports: [IonCard, IonList, IonItem, IonLabel],
    templateUrl: './perfil-user-body.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserBodyComponent {

    user = input.required<ProfileHead>();

}