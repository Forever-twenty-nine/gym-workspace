import { Rol } from '../enums/rol.enum';
import { TipoMensaje } from '../enums/tipo-mensaje.enum';

export interface Mensaje {
    id: string;
    conversacionId: string;         // Para agrupar mensajes
    remitenteId: string;            // Quien envía
    remitenteTipo: Rol;             // 'entrenador' | 'entrenado' | 'gimnasio'
    destinatarioId: string;         // Quien recibe
    destinatarioTipo: Rol;
    
    contenido: string;
    tipo: TipoMensaje;              // 'texto' | 'imagen' | 'video' | 'audio'
    archivoUrl?: string;            // Si es multimedia
    
    // Estado
    leido: boolean;
    entregado: boolean;
    
    // Metadata
    fechaEnvio: Date;
    fechaLeido?: Date;
    fechaEditado?: Date;
}
