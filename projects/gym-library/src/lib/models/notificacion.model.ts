import { TipoNotificacion } from '../enums/tipo-notificacion.enum';

export interface Notificacion {
    id: string;
    usuarioId: string;              // A quién va dirigida
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    leida: boolean;
    
    // Datos adicionales según tipo (opcional)
    datos?: {
        rutinaId?: string;
        entrenadoId?: string;
        entrenadorId?: string;
        ejercicioId?: string;
        [key: string]: any;
    };
    
    // Metadata
    fechaCreacion: Date;
    fechaLeida?: Date;
}
