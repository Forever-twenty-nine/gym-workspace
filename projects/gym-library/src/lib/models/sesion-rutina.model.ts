import { SesionRutinaStatus } from '../enums/sesion-rutina-status.enum';
import { Ejercicio } from './ejercicio.model';

export interface SesionRutina {
    id: string;
    entrenadoId: string;
    fechaInicio: Date;
    fechaFin?: Date;
    duracion?: number;
    status?: SesionRutinaStatus;
    porcentajeCompletado?: number;
    completada?: boolean;
    rutinaResumen: {
        id: string;
        nombre: string;
        ejercicios: Ejercicio[];
    };
    // Social
    compartida?: boolean;
    nombreUsuario?: string;
    fotoUsuario?: string;
    fechaCompartida?: any;
    likes?: string[]; // IDs de usuarios que dieron like
}

