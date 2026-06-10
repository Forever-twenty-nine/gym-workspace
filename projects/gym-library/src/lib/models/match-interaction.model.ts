export interface MatchInteraction {
    id: string;
    tipo: 'horario' | 'desafio' | 'afinidad' | 'general';
    usuarioOrigenId: string;
    usuarioDestinoId: string;
    referenciaId?: string; // ID del desafío, si aplica
    interesOrigen: boolean;
    interesDestino?: boolean;
    mutuo: boolean;
    fechaCreacion: Date;
    fechaMatch?: Date;
    gimnasioId?: string; // Denormalizado para scoping de listeners y queries por gimnasio
}
