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
    NUEVO_PR = 'nuevo_pr'
}
