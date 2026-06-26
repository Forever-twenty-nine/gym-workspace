export interface ComentarioRespuesta {
    id: string;
    entrenadoId: string;
    nombreUsuario: string;
    fotoUsuario?: string;
    contenido: string;
    fecha: any; // Date o Timestamp de Firestore
    likes?: string[]; // IDs de usuarios que le dieron like
}

export interface Comentario {
    id: string;
    sesionId: string; // ID de la publicación (sesion-rutina)
    entrenadoId: string; // ID del creador del comentario
    nombreUsuario: string;
    fotoUsuario?: string;
    contenido: string;
    fecha: any; // Date o Timestamp de Firestore
    likes?: string[]; // IDs de usuarios que le dieron like
    respuesta?: ComentarioRespuesta; // Respuesta del creador del post
}
