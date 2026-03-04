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
    IonSelectOption
} from '@ionic/angular/standalone';
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

    close = output<void>();
    save = output<any>();

    form = signal<FormGroup>(this.fb.group({
        nombre: ['', Validators.required],
        descripcion: [''],
        ejerciciosIds: [[]],
        creadorId: [''],
        asignadoIds: [[]]
    }));

    // Track form status reactively
    private formStatus = toSignal(this.form().statusChanges, {
        initialValue: 'INVALID'
    });

    isSaveDisabled = computed(() => {
        return this.formStatus() === 'INVALID';
    });

    constructor() {
        effect(() => {
            const data = this.rutinaData();
            if (data) {
                this.form().patchValue({
                    nombre: data.nombre || '',
                    descripcion: data.descripcion || '',
                    ejerciciosIds: data.ejerciciosIds || [],
                    creadorId: data.creadorId || '',
                    asignadoIds: data.asignadoIds || []
                });
            } else {
                this.form().reset({
                    nombre: '',
                    descripcion: '',
                    ejerciciosIds: [],
                    creadorId: '',
                    asignadoIds: []
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
