import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { User, Entrenado, Plan } from 'gym-library';
import { IonCard, IonGrid, IonRow, IonCol, IonCardContent, IonIcon } from "@ionic/angular/standalone";

@Component({
    selector: 'perfil-user-body',
    imports: [IonCard],
    templateUrl: './perfil-user-body.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserBodyComponent {

    user = input.required<User>();


}