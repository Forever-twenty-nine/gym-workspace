import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    // plan free
    creadorId?: string;
    nombre: string;
    activa: boolean;
    descripcion?: string;
    ejerciciosIds?: string[];
    // Social
    compartida?: boolean;
    usuarioId?: string;
    nombreUsuario?: string;
    fechaCompartida?: any;
    // Plan Premium
    duracion?: number;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}
