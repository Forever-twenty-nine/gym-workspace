export interface MatchInteraction {
    id: string;
    tipo: 'horario' | 'desafio' | 'afinidad';
    usuarioOrigenId: string;
    usuarioDestinoId: string;
    referenciaId?: string; // ID del desafío, si aplica
    interesOrigen: boolean;
    interesDestino?: boolean;
    mutuo: boolean;
    fechaCreacion: Date;
    fechaMatch?: Date;
}
