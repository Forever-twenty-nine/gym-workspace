import { Rol } from '../enums/rol.enum';

export interface Ejercicio {
    id: string;
    nombre: string;
    descripcion?: string;
    series: number;
    repeticiones: number;
    peso?: number;
    // plan premium 
    descansoSegundos?: number;
    serieSegundos?: number;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}
