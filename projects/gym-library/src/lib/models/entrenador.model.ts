export interface Entrenador{
    id: string;          
    fechaRegistro?: Date;
    //asociaciones
    ejerciciosCreadasIds: string[];
    entrenadosAsignadosIds: string[];
    rutinasCreadasIds: string[];

}