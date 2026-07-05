import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonModal,
    IonIcon,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonListHeader,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
} from '@ionic/angular/standalone';
import { Entrenado, Rutina, Plan } from 'gym-library';
import { BackgroundComponent } from '../../../../shared/components/background/background.component';

@Component({
    selector: 'app-gestion-rutinas-modal',
    templateUrl: './gestion-rutinas-modal.component.html',
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonModal,
        IonIcon,
        IonCard,
        IonCardContent,
        IonList,    
        IonItem,
        IonLabel,
        IonSelect,
        IonSelectOption,
        IonNote,
        IonListHeader,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        BackgroundComponent
    ]
})
export class GestionRutinasModalComponent {
    isOpen = input.required<boolean>();
    entrenado = input<Entrenado | null>(null);
    rutinasEntrenado = input<Rutina[]>([]);
    rutinasDisponibles = input<Rutina[]>([]);
    diasSemana = input<string[]>([]);
    plan = input<Plan>(Plan.FREE);

    isPremium = computed(() => this.plan() === Plan.PREMIUM);

    // Callbacks
    getUserName = input.required<(id: string) => string>();
    getDiasAsignados = input.required<(rutinaId: string) => string[]>();

    // Outputs
    close = output<void>();
    desasignarRutina = output<Rutina>();
    quitarDiaDeRutina = output<{ rutinaId: string, dia: string }>();
    asignarDiaARutina = output<{ rutina: Rutina, event: any }>();
    asignarRutina = output<Rutina>();

    actualizarDias(rutina: Rutina, nuevosDias: string[]) {
        const diasActuales = this.getDiasAsignados()(rutina.id) || [];
        
        // Days to add
        const diasAAgregar = nuevosDias.filter(d => !diasActuales.includes(d));
        // Days to remove
        const diasAQuitar = diasActuales.filter(d => !nuevosDias.includes(d));

        diasAAgregar.forEach(dia => {
            this.asignarDiaARutina.emit({ rutina, event: { detail: { value: dia } } });
        });

        diasAQuitar.forEach(dia => {
            this.quitarDiaDeRutina.emit({ rutinaId: rutina.id, dia });
        });
    }
}
