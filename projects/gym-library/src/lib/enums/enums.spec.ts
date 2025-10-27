import { Plan } from './plan.enum';
import { Rol } from './rol.enum';
import { EntrenadoTabsSet, ENTRENADO_TABS_CONFIG } from './entrenado-tabs.enum';
import { GimnasioTabsSet, GIMNASIO_TABS_CONFIG } from './gimnasio-tabs.enum';
import { Objetivo } from './objetivo.enum';
import { Permiso } from './permiso.enum';
import { SesionRutinaStatus } from './sesion-rutina-status.enum';
import { TipoMensaje } from './tipo-mensaje.enum';
import { TipoNotificacion } from './tipo-notificacion.enum';

describe('Enums', () => {
  describe('Plan Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para FREE', () => {
        expect(Plan.FREE).toBe('free');
      });

      it('debe tener el valor correcto para PREMIUM', () => {
        expect(Plan.PREMIUM).toBe('premium');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener los planes esperados', () => {
        const expectedPlans = ['free', 'premium'];
        const actualPlans = Object.values(Plan);

        expect(actualPlans).toEqual(expectedPlans);
        expect(actualPlans).toHaveLength(2);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['FREE', 'PREMIUM'];
        const actualKeys = Object.keys(Plan);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('debe tener exactamente 2 planes disponibles', () => {
        expect(Object.keys(Plan)).toHaveLength(2);
      });

      it('FREE debe ser el plan básico', () => {
        expect(Plan.FREE).toBe('free');
      });

      it('PREMIUM debe ser el plan avanzado', () => {
        expect(Plan.PREMIUM).toBe('premium');
      });
    });

    describe('Funciones helper (ejemplo)', () => {
      const isPremium = (plan: Plan): boolean => plan === Plan.PREMIUM;
      const isFree = (plan: Plan): boolean => plan === Plan.FREE;

      it('debe identificar correctamente planes premium', () => {
        expect(isPremium(Plan.PREMIUM)).toBe(true);
        expect(isPremium(Plan.FREE)).toBe(false);
      });

      it('debe identificar correctamente planes free', () => {
        expect(isFree(Plan.FREE)).toBe(true);
        expect(isFree(Plan.PREMIUM)).toBe(false);
      });
    });
  });

  describe('Rol Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para ENTRENADO', () => {
        expect(Rol.ENTRENADO).toBe('entrenado');
      });

      it('debe tener el valor correcto para ENTRENADOR', () => {
        expect(Rol.ENTRENADOR).toBe('entrenador');
      });

      it('debe tener el valor correcto para GIMNASIO', () => {
        expect(Rol.GIMNASIO).toBe('gimnasio');
      });

      it('debe tener el valor correcto para PERSONAL_TRAINER', () => {
        expect(Rol.PERSONAL_TRAINER).toBe('personal_trainer');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los roles esperados', () => {
        const expectedRoles = ['entrenado', 'entrenador', 'gimnasio', 'personal_trainer'];
        const actualRoles = Object.values(Rol);

        expect(actualRoles).toEqual(expectedRoles);
        expect(actualRoles).toHaveLength(4);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['ENTRENADO', 'ENTRENADOR', 'GIMNASIO', 'PERSONAL_TRAINER'];
        const actualKeys = Object.keys(Rol);

        expect(actualKeys).toEqual(expectedKeys);
        expect(actualKeys).toHaveLength(4);
      });
    });

    describe('Tipo de valores', () => {
      it('todos los valores deben ser strings', () => {
        Object.values(Rol).forEach(value => {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        });
      });

      it('debe poder acceder por clave', () => {
        expect(Rol['ENTRENADO']).toBe('entrenado');
        expect(Rol['ENTRENADOR']).toBe('entrenador');
      });
    });

    describe('Utilidades del enum', () => {
      it('debe poder verificar si un valor es válido', () => {
        expect(Object.values(Rol)).toContain('entrenado');
        expect(Object.values(Rol)).toContain('entrenador');
        expect(Object.values(Rol)).not.toContain('admin');
        expect(Object.values(Rol)).not.toContain('');
      });

      it('debe poder obtener todas las opciones disponibles', () => {
        const roles = Object.values(Rol);
        expect(roles).toEqual(['entrenado', 'entrenador', 'gimnasio', 'personal_trainer']);
      });
    });
  });

  describe('EntrenadoTabsSet Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para BASICO', () => {
        expect(EntrenadoTabsSet.BASICO).toBe('basico');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener el conjunto esperado', () => {
        const expectedSets = ['basico'];
        const actualSets = Object.values(EntrenadoTabsSet);

        expect(actualSets).toEqual(expectedSets);
        expect(actualSets).toHaveLength(1);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['BASICO'];
        const actualKeys = Object.keys(EntrenadoTabsSet);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Configuración de tabs', () => {
      it('debe tener configuración para BASICO', () => {
        expect(ENTRENADO_TABS_CONFIG[EntrenadoTabsSet.BASICO]).toBeDefined();
        expect(ENTRENADO_TABS_CONFIG.basico).toEqual(['rutinas', 'ejercicios', 'perfil']);
      });

      it('debe tener exactamente 3 tabs en BASICO', () => {
        expect(ENTRENADO_TABS_CONFIG.basico).toHaveLength(3);
      });

      it('debe incluir los tabs esenciales', () => {
        const basicoTabs = ENTRENADO_TABS_CONFIG.basico;
        expect(basicoTabs).toContain('rutinas');
        expect(basicoTabs).toContain('ejercicios');
        expect(basicoTabs).toContain('perfil');
      });
    });
  });

  describe('GimnasioTabsSet Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para GESTION', () => {
        expect(GimnasioTabsSet.GESTION).toBe('gestion');
      });

      it('debe tener el valor correcto para COMPLETO', () => {
        expect(GimnasioTabsSet.COMPLETO).toBe('completo');
      });

      it('debe tener el valor correcto para REPORTES', () => {
        expect(GimnasioTabsSet.REPORTES).toBe('reportes');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los conjuntos esperados', () => {
        const expectedSets = ['gestion', 'completo', 'reportes'];
        const actualSets = Object.values(GimnasioTabsSet);

        expect(actualSets).toEqual(expectedSets);
        expect(actualSets).toHaveLength(3);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['GESTION', 'COMPLETO', 'REPORTES'];
        const actualKeys = Object.keys(GimnasioTabsSet);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Configuración de tabs', () => {
      it('debe tener configuración para GESTION', () => {
        expect(GIMNASIO_TABS_CONFIG[GimnasioTabsSet.GESTION]).toBeDefined();
        expect(GIMNASIO_TABS_CONFIG.gestion).toEqual(['dashboard', 'usuarios', 'configuracion']);
      });

      it('debe tener configuración para REPORTES', () => {
        expect(GIMNASIO_TABS_CONFIG[GimnasioTabsSet.REPORTES]).toBeDefined();
        expect(GIMNASIO_TABS_CONFIG.reportes).toEqual(['dashboard', 'reportes', 'estadisticas', 'configuracion']);
      });

      it('debe tener configuración para COMPLETO', () => {
        expect(GIMNASIO_TABS_CONFIG[GimnasioTabsSet.COMPLETO]).toBeDefined();
        expect(GIMNASIO_TABS_CONFIG.completo).toHaveLength(8);
      });

      it('COMPLETO debe tener todos los tabs disponibles', () => {
        const completoTabs = GIMNASIO_TABS_CONFIG.completo;
        expect(completoTabs).toContain('dashboard');
        expect(completoTabs).toContain('usuarios');
        expect(completoTabs).toContain('entrenadores');
        expect(completoTabs).toContain('clientes');
        expect(completoTabs).toContain('reportes');
        expect(completoTabs).toContain('estadisticas');
        expect(completoTabs).toContain('configuracion');
        expect(completoTabs).toContain('perfil');
      });

      it('GESTION debe tener menos tabs que COMPLETO', () => {
        expect(GIMNASIO_TABS_CONFIG.gestion.length).toBeLessThan(GIMNASIO_TABS_CONFIG.completo.length);
      });
    });
  });

  describe('Objetivo Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para BAJAR_PESO', () => {
        expect(Objetivo.BAJAR_PESO).toBe('Bajar Peso');
      });

      it('debe tener el valor correcto para AUMENTAR_MUSCULO', () => {
        expect(Objetivo.AUMENTAR_MUSCULO).toBe('Aumentar Musculo');
      });

      it('debe tener el valor correcto para MANTENER_PESO', () => {
        expect(Objetivo.MANTENER_PESO).toBe('Mantener Peso');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los objetivos esperados', () => {
        const expectedObjetivos = ['Bajar Peso', 'Aumentar Musculo', 'Mantener Peso'];
        const actualObjetivos = Object.values(Objetivo);

        expect(actualObjetivos).toEqual(expectedObjetivos);
        expect(actualObjetivos).toHaveLength(3);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['BAJAR_PESO', 'AUMENTAR_MUSCULO', 'MANTENER_PESO'];
        const actualKeys = Object.keys(Objetivo);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('todos los valores deben ser strings con formato legible', () => {
        Object.values(Objetivo).forEach(value => {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
          expect(value).toMatch(/^[A-Z]/); // Debe comenzar con mayúscula
        });
      });
    });
  });

  describe('Permiso Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para EJECUTAR_RUTINAS', () => {
        expect(Permiso.EJECUTAR_RUTINAS).toBe('ejecutar_rutinas');
      });

      it('debe tener el valor correcto para CREAR_RUTINAS', () => {
        expect(Permiso.CREAR_RUTINAS).toBe('crear_rutinas');
      });

      it('debe tener el valor correcto para GESTIONAR_CLIENTES', () => {
        expect(Permiso.GESTIONAR_CLIENTES).toBe('gestionar_clientes');
      });

      it('debe tener el valor correcto para GESTIONAR_ENTRENADORES', () => {
        expect(Permiso.GESTIONAR_ENTRENADORES).toBe('gestionar_entrenadores');
      });

      it('debe tener el valor correcto para CREAR_EJERCICIOS', () => {
        expect(Permiso.CREAR_EJERCICIOS).toBe('crear_ejercicios');
      });

      it('debe tener el valor correcto para VER_EJERCICIOS', () => {
        expect(Permiso.VER_EJERCICIOS).toBe('ver_ejercicios');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los permisos esperados', () => {
        const expectedPermisos = [
          'ejecutar_rutinas',
          'crear_rutinas',
          'gestionar_clientes',
          'gestionar_entrenadores',
          'crear_ejercicios',
          'ver_ejercicios'
        ];
        const actualPermisos = Object.values(Permiso);

        expect(actualPermisos).toEqual(expectedPermisos);
        expect(actualPermisos).toHaveLength(6);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = [
          'EJECUTAR_RUTINAS',
          'CREAR_RUTINAS',
          'GESTIONAR_CLIENTES',
          'GESTIONAR_ENTRENADORES',
          'CREAR_EJERCICIOS',
          'VER_EJERCICIOS'
        ];
        const actualKeys = Object.keys(Permiso);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('todos los permisos deben usar snake_case', () => {
        Object.values(Permiso).forEach(value => {
          expect(value).toMatch(/^[a-z_]+$/);
        });
      });

      it('debe tener permisos de lectura y escritura diferenciados', () => {
        expect(Object.values(Permiso)).toContain('ver_ejercicios');
        expect(Object.values(Permiso)).toContain('crear_ejercicios');
      });
    });
  });

  describe('SesionRutinaStatus Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para PENDIENTE', () => {
        expect(SesionRutinaStatus.PENDIENTE).toBe('pendiente');
      });

      it('debe tener el valor correcto para EN_PROGRESO', () => {
        expect(SesionRutinaStatus.EN_PROGRESO).toBe('en_progreso');
      });

      it('debe tener el valor correcto para COMPLETADA', () => {
        expect(SesionRutinaStatus.COMPLETADA).toBe('completada');
      });

      it('debe tener el valor correcto para CANCELADA', () => {
        expect(SesionRutinaStatus.CANCELADA).toBe('cancelada');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los estados esperados', () => {
        const expectedStatuses = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
        const actualStatuses = Object.values(SesionRutinaStatus);

        expect(actualStatuses).toEqual(expectedStatuses);
        expect(actualStatuses).toHaveLength(4);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'];
        const actualKeys = Object.keys(SesionRutinaStatus);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('debe tener estados que representen el flujo de una sesión', () => {
        expect(Object.values(SesionRutinaStatus)).toContain('pendiente');
        expect(Object.values(SesionRutinaStatus)).toContain('en_progreso');
        expect(Object.values(SesionRutinaStatus)).toContain('completada');
      });

      it('debe permitir cancelación de sesiones', () => {
        expect(Object.values(SesionRutinaStatus)).toContain('cancelada');
      });
    });
  });

  describe('TipoMensaje Enum', () => {
    describe('Valores del enum', () => {
      it('debe tener el valor correcto para TEXTO', () => {
        expect(TipoMensaje.TEXTO).toBe('texto');
      });

      it('debe tener el valor correcto para IMAGEN', () => {
        expect(TipoMensaje.IMAGEN).toBe('imagen');
      });

      it('debe tener el valor correcto para VIDEO', () => {
        expect(TipoMensaje.VIDEO).toBe('video');
      });

      it('debe tener el valor correcto para AUDIO', () => {
        expect(TipoMensaje.AUDIO).toBe('audio');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los tipos de mensaje esperados', () => {
        const expectedTipos = ['texto', 'imagen', 'video', 'audio'];
        const actualTipos = Object.values(TipoMensaje);

        expect(actualTipos).toEqual(expectedTipos);
        expect(actualTipos).toHaveLength(4);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = ['TEXTO', 'IMAGEN', 'VIDEO', 'AUDIO'];
        const actualKeys = Object.keys(TipoMensaje);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('debe incluir tipos multimedia básicos', () => {
        expect(Object.values(TipoMensaje)).toContain('texto');
        expect(Object.values(TipoMensaje)).toContain('imagen');
        expect(Object.values(TipoMensaje)).toContain('video');
        expect(Object.values(TipoMensaje)).toContain('audio');
      });
    });
  });

  describe('TipoNotificacion Enum', () => {
    describe('Valores del enum - Invitaciones', () => {
      it('debe tener el valor correcto para INVITACION_PENDIENTE', () => {
        expect(TipoNotificacion.INVITACION_PENDIENTE).toBe('invitacion_pendiente');
      });

      it('debe tener el valor correcto para INVITACION_ACEPTADA', () => {
        expect(TipoNotificacion.INVITACION_ACEPTADA).toBe('invitacion_aceptada');
      });

      it('debe tener el valor correcto para INVITACION_RECHAZADA', () => {
        expect(TipoNotificacion.INVITACION_RECHAZADA).toBe('invitacion_rechazada');
      });
    });

    describe('Valores del enum - Rutinas', () => {
      it('debe tener el valor correcto para RUTINA_ASIGNADA', () => {
        expect(TipoNotificacion.RUTINA_ASIGNADA).toBe('rutina_asignada');
      });

      it('debe tener el valor correcto para RUTINA_COMPLETADA', () => {
        expect(TipoNotificacion.RUTINA_COMPLETADA).toBe('rutina_completada');
      });
    });

    describe('Valores del enum - Mensajes', () => {
      it('debe tener el valor correcto para MENSAJE_NUEVO', () => {
        expect(TipoNotificacion.MENSAJE_NUEVO).toBe('mensaje_nuevo');
      });
    });

    describe('Valores del enum - Otros', () => {
      it('debe tener el valor correcto para RECORDATORIO', () => {
        expect(TipoNotificacion.RECORDATORIO).toBe('recordatorio');
      });

      it('debe tener el valor correcto para LOGRO', () => {
        expect(TipoNotificacion.LOGRO).toBe('logro');
      });

      it('debe tener el valor correcto para NUEVO_PR', () => {
        expect(TipoNotificacion.NUEVO_PR).toBe('nuevo_pr');
      });
    });

    describe('Estructura del enum', () => {
      it('debe contener todos los tipos de notificación esperados', () => {
        const expectedTipos = [
          'invitacion_pendiente',
          'invitacion_aceptada',
          'invitacion_rechazada',
          'rutina_asignada',
          'rutina_completada',
          'mensaje_nuevo',
          'recordatorio',
          'logro',
          'nuevo_pr'
        ];
        const actualTipos = Object.values(TipoNotificacion);

        expect(actualTipos).toEqual(expectedTipos);
        expect(actualTipos).toHaveLength(9);
      });

      it('debe tener las claves correctas', () => {
        const expectedKeys = [
          'INVITACION_PENDIENTE',
          'INVITACION_ACEPTADA',
          'INVITACION_RECHAZADA',
          'RUTINA_ASIGNADA',
          'RUTINA_COMPLETADA',
          'MENSAJE_NUEVO',
          'RECORDATORIO',
          'LOGRO',
          'NUEVO_PR'
        ];
        const actualKeys = Object.keys(TipoNotificacion);

        expect(actualKeys).toEqual(expectedKeys);
      });
    });

    describe('Validaciones de negocio', () => {
      it('debe incluir notificaciones de invitaciones', () => {
        expect(Object.values(TipoNotificacion)).toContain('invitacion_pendiente');
        expect(Object.values(TipoNotificacion)).toContain('invitacion_aceptada');
        expect(Object.values(TipoNotificacion)).toContain('invitacion_rechazada');
      });

      it('debe incluir notificaciones de rutinas', () => {
        expect(Object.values(TipoNotificacion)).toContain('rutina_asignada');
        expect(Object.values(TipoNotificacion)).toContain('rutina_completada');
      });

      it('debe incluir notificaciones de logros', () => {
        expect(Object.values(TipoNotificacion)).toContain('logro');
        expect(Object.values(TipoNotificacion)).toContain('nuevo_pr');
      });
    });
  });
});
