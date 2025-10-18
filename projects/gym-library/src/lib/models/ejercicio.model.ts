import { Rol } from '../enums/rol.enum';

export interface Ejercicio {
    id: string;
    nombre: string;
    descripcion?: string;
    series: number;
    repeticiones: number;
    peso?: number;
    descansoSegundos?: number;
    serieSegundos?: number;
    // Información del asignado (opcional)
    asignadoAId?: string;
    asignadoATipo?: Rol;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}
