export enum TipoNotificacion {
    // Sistema de invitaciones
    INVITACION_PENDIENTE = 'invitacion_pendiente',
    INVITACION_ACEPTADA = 'invitacion_aceptada',
    INVITACION_RECHAZADA = 'invitacion_rechazada',

    // Sistema de rutinas
    RUTINA_ASIGNADA = 'rutina_asignada',
    RUTINA_COMPLETADA = 'rutina_completada',

    // Sistema de mensajes
    MENSAJE_NUEVO = 'mensaje_nuevo',

    // Otros
    RECORDATORIO = 'recordatorio',
    LOGRO = 'logro',
    NUEVO_PR = 'nuevo_pr',

    // Matching / Social
    NUEVO_MATCH = 'nuevo_match',
    LIKE_PUBLICACION = 'like_publicacion',
    NUEVO_COMENTARIO = 'nuevo_comentario',
    LIKE_COMENTARIO = 'like_comentario',
    NUEVA_RESPUESTA = 'nueva_respuesta'
}
