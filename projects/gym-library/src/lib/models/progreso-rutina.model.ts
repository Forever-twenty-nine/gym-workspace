export interface SesionRutina {
    fecha: Date;
    duracion?: number;
    ejerciciosCompletados?: number;
    ejerciciosTotales?: number;
}

export interface ProgresoRutina {
    rutinaId: string;
    fechaInicio?: Date;
    fechaUltimaCompletada?: Date;
    vecesCompletada: number;
    completado: boolean;
    // Para % de progreso y checklist
    ejerciciosCompletados: string[]; 
    porcentajeProgreso: number; 
    // Historial de sesiones (para racha)
    sesiones?: SesionRutina[];
}
