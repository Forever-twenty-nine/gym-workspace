import { Component, input, output, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonModal,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-rutina-modal',
    templateUrl: './rutina-modal.component.html',
    styleUrls: ['./rutina-modal.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonModal,
        IonButtons,
        IonButton,
        IonIcon,
        IonItem,
        IonInput,
        IonTextarea,
        IonSelect,
        IonSelectOption
    ]
})
export class RutinaModalComponent {
    private fb = inject(FormBuilder);

    isOpen = input.required<boolean>();
    isCreating = input.required<boolean>();
    rutinaData = input<any | null>(null);
    ejercicios = input<any[]>([]);

    // Lista de días para el selector simple a nivel de rutina
    diasSemana = input<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);

    close = output<void>();
    save = output<any>();

    form = signal<FormGroup>(this.fb.group({
        nombre: ['', Validators.required],
        descripcion: [''],
        ejerciciosIds: [[]],
        creadorId: [''],
        asignadoIds: [[]],
        diasSemana: [[]]  // Días de la semana para esta rutina (un solo selector multi)
    }));

    // Track form status reactively
    private formStatus = toSignal(this.form().statusChanges, {
        initialValue: 'INVALID'
    });

    isSaveDisabled = computed(() => {
        return this.formStatus() === 'INVALID';
    });

    constructor() {
        addIcons({ close });

        effect(() => {
            const data = this.rutinaData();
            if (data) {
                this.form().patchValue({
                    nombre: data.nombre || '',
                    descripcion: data.descripcion || '',
                    ejerciciosIds: data.ejerciciosIds || [],
                    creadorId: data.creadorId || '',
                    asignadoIds: data.asignadoIds || [],
                    diasSemana: data.diasSemana || []
                });
            } else {
                this.form().reset({
                    nombre: '',
                    descripcion: '',
                    ejerciciosIds: [],
                    creadorId: '',
                    asignadoIds: [],
                    diasSemana: []
                });
            }
        });
    }

    handleSave() {
        if (this.form().valid) {
            this.save.emit(this.form().value);
        }
    }
}
