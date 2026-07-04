export interface TipoEntrenamiento {
    id: string;
    nombre: string;
    gimnasioId: string;
    creadoPor?: string;
    fechaCreacion?: Date;
}
