import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonModal,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonItemGroup,
    IonLabel,
    IonBadge,
    IonSelect,
    IonSelectOption
} from '@ionic/angular/standalone';
import { Entrenado, Rutina } from 'gym-library';

@Component({
    selector: 'app-gestion-rutinas-modal',
    templateUrl: './gestion-rutinas-modal.component.html',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonModal,
        IonButton,
        IonIcon,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonItemGroup,
        IonLabel,
        IonBadge,
        IonSelect,
        IonSelectOption
    ]
})
export class GestionRutinasModalComponent {
    isOpen = input.required<boolean>();
    entrenado = input<Entrenado | null>(null);
    rutinasEntrenado = input<Rutina[]>([]);
    rutinasDisponibles = input<Rutina[]>([]);
    diasSemana = input<string[]>([]);

    // Callbacks
    getUserName = input.required<(id: string) => string>();
    getDiasAsignados = input.required<(rutinaId: string) => string[]>();

    // Outputs
    close = output<void>();
    desasignarRutina = output<Rutina>();
    quitarDiaDeRutina = output<{ rutinaId: string, dia: string }>();
    asignarDiaARutina = output<{ rutina: Rutina, event: any }>();
    asignarRutina = output<Rutina>();
}
