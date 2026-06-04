export interface Desafio {
    id: string;
    creadorId: string;
    creadorNombre: string;
    creadorFoto?: string | null;
    gimnasioId: string;
    titulo: string;           // Ej: "Buscando team para correr 10k el sábado"
    logroRelacionado?: string; // Ej: "Metí 150kg en sentadilla, ¿quién me sigue el ritmo?"
    disciplina?: string;      // Ej: "Powerlifting", "Running"
    fechaCreacion: Date;
    fechaVencimiento: Date;   // El desafío deja de aceptarse después de esta fecha
    activo: boolean;
}
