export interface SesionRutina {
    id: string;
    entrenadoId: string;
    fechaInicio: Date;
    fechaFin?: Date;
    duracion?: number;
    ejerciciosCompletados:number;
    completada?: boolean;
    rutinaId:string
}

