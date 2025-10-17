export interface Entrenador{
    id: string;          
    activo: boolean;
    fechaRegistro?: Date;
    ejerciciosCreadasIds: string[];
    entrenadosAsignadosIds: string[];
    rutinasCreadasIds: string[];

}