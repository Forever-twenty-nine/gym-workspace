import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Rol } from 'gym-library';
import { Plan } from 'gym-library';

export const USUARIO_COLUMNS: ColumnConfig[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Rol', type: 'text' },
    { key: 'plan', label: 'Plan', type: 'text' },
    { key: 'onboarded', label: 'Onboarded', type: 'boolean' }
];

export const USUARIO_SCHEMA: FieldConfig[] = [
    { name: 'section_basic', label: 'Información Básica', type: 'heading', colSpan: 2 },
    { name: 'nombre', label: 'Nombre Completo', type: 'text', validators: [Validators.required], colSpan: 2 },
    { name: 'email', label: 'Email', type: 'text', validators: [Validators.required, Validators.email], colSpan: 2 },
    
    { name: 'section_role', label: 'Rol y Acceso', type: 'heading', colSpan: 2 },
    { 
        name: 'role', 
        label: 'Rol en la Plataforma', 
        type: 'select', 
        options: [
            { label: 'Entrenado', value: Rol.ENTRENADO },
            { label: 'Entrenador', value: Rol.ENTRENADOR },
            { label: 'Gimnasio', value: Rol.GIMNASIO },
            { label: 'Personal Trainer', value: Rol.PERSONAL_TRAINER }
        ],
        validators: [Validators.required]
    },
    { 
        name: 'plan', 
        label: 'Plan de Suscripción', 
        type: 'select', 
        options: [
            { label: 'Free', value: Plan.FREE },
            { label: 'Premium', value: Plan.PREMIUM }
        ],
        validators: [Validators.required]
    },
    
    { name: 'section_status', label: 'Estado', type: 'heading', colSpan: 2 },
    { name: 'onboarded', label: 'Proceso de Onboarding Finalizado', type: 'checkbox', colSpan: 2 },
    { name: 'uid', label: 'Firebase UID (Solo Lectura)', type: 'text', colSpan: 2 }
];
