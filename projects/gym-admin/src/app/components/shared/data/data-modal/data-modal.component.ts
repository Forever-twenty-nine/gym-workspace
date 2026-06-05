import { Component, input, output, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FieldConfig } from '../../../../models/data-config.model';

@Component({
    selector: 'app-data-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './data-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataModalComponent {
    private fb = inject(FormBuilder);

    // Inputs
    isOpen = input.required<boolean>();
    title = input.required<string>();
    item = input<any>(null);
    fields = input.required<FieldConfig[]>();
    loading = input<boolean>(false);

    // Outputs
    save = output<any>();
    close = output<void>();

    // Internal State
    form: FormGroup = this.fb.group({});

    constructor() {
        // Reconstruir el formulario cuando cambian los campos o el item
        effect(() => {
            if (this.isOpen()) {
                this.buildForm(this.item());
            }
        });
    }

    private buildForm(item: any = null) {
        const controls: any = {};
        const currentFields = this.fields();

        currentFields.forEach(field => {
            if (field.type === 'heading' || field.name === 'id') return;

            let value = item ? item[field.name] : (field.defaultValue ?? (field.type === 'multiselect' || field.type === 'infolist' ? [] : ''));

            // Formateo específico para input type="date"
            if (field.type === 'date' && value) {
                value = this.formatDateForInput(value);
            }

            // Formateo específico para input type="time" (soporta string "HH:mm", Date o Timestamp)
            if (field.type === 'time' && value) {
                value = this.formatTimeForInput(value);
            }

            // Manejo especial para arrays
            if (Array.isArray(value) && field.type !== 'multiselect' && field.type !== 'infolist') {
                value = value.join(', ');
            }

            // Asegurar que infolist siempre tenga un array
            if (field.type === 'infolist' && !Array.isArray(value)) {
                value = value ? [value] : [];
            }

            const isDisabled = field.type === 'infolist';
            controls[field.name] = [{ value, disabled: isDisabled }, field.validators || []];
        });

        this.form = this.fb.group(controls);
    }

    private formatDateForInput(date: any): string {
        if (!date) return '';
        if (date.seconds !== undefined) {
            date = new Date(date.seconds * 1000);
        } else if (!(date instanceof Date)) {
            date = new Date(date);
        }
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private formatTimeForInput(time: any): string {
        if (!time) return '';

        // If already a proper HH:mm string
        if (typeof time === 'string' && /^\d{2}:\d{2}/.test(time)) {
            return time.substring(0, 5);
        }

        let date: Date;
        if (time instanceof Date) {
            date = time;
        } else if (time && typeof time === 'object' && 'seconds' in time) {
            // Firestore Timestamp
            date = new Date(time.seconds * 1000);
        } else {
            date = new Date(time);
        }

        if (isNaN(date.getTime())) {
            return String(time).substring(0, 5);
        }

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    onSubmit() {
        if (this.form.valid) {
            const formValues = { ...this.form.getRawValue() };

            this.fields().forEach(field => {
                if (field.type === 'heading') return;
                const val = formValues[field.name];

                if (field.type === 'multiselect' || field.type === 'infolist') {
                    formValues[field.name] = Array.isArray(val) ? val : [];
                } else if (typeof val === 'string' && (field.name.toLowerCase().endsWith('ids') || field.name === 'rutinasCreadas')) {
                    formValues[field.name] = val.split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                }
            });

            const data = { ...this.item(), ...formValues };
            this.save.emit(data);
        }
    }

    getOptionLabel(field: FieldConfig, value: any): string {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value.nombre || value.label || value.displayName || value.id || 'Objeto';
        }
        if (!field.options) return value;
        const option = field.options.find(opt => opt.value === value);
        return option ? option.label : value;
    }
}
