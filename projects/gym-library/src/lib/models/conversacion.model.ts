export interface Conversacion {
    id: string;                     // `${entrenadorId}_${entrenadoId}`
    entrenadorId: string;
    entrenadoId: string;
    gimnasioId?: string;            // Para multi-tenancy
    
    ultimoMensaje?: string;
    ultimoMensajeFecha?: Date;
    noLeidosEntrenador: number;
    noLeidosEntrenado: number;
    
    activa: boolean;
    
    // Metadata
    fechaCreacion: Date;
    fechaUltimaActividad: Date;
}
