import { EntrenadorService, IEntrenadorFirestoreAdapter, PlanLimitError, ENTRENADOR_FIRESTORE_ADAPTER } from './entrenador.service';
import { Entrenador } from '../models/entrenador.model';

jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core');
  return {
    ...actual,
    inject: jest.fn(() => ({
      onDestroy: jest.fn(),
    })),
  };
});

let mockAdapter: jest.Mocked<IEntrenadorFirestoreAdapter>;
let mockServices: any;

describe('EntrenadorService', () => {
  let service: EntrenadorService;

  const mockEntrenador: Entrenador = {
    id: '1',
    entrenadosAsignadosIds: ['entrenado1'],
    rutinasCreadasIds: ['rutina1'],
    ejerciciosCreadasIds: ['ejercicio1'],
  };

  const mockEntrenador2: Entrenador = {
    id: '2',
    entrenadosAsignadosIds: ['entrenado2'],
    rutinasCreadasIds: ['rutina2'],
    ejerciciosCreadasIds: ['ejercicio2'],
  };

  const mockUser = {
    uid: '1',
    email: 'test@test.com',
    nombre: 'Test User',
    plan: 'free'
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockAdapter = {
      getEntrenadores: jest.fn((callback) => {
        return () => {};
      }),
      subscribeToEntrenador: jest.fn(),
      create: jest.fn(),
      createWithId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockServices = {
      RutinaService: {
        rutinas: jest.fn(() => [{ id: 'rutina1' }, { id: 'rutina2' }]),
        getRutina: jest.fn(() => jest.fn(() => ({ id: 'rutina1', duracion: undefined }))),
      },
      EjercicioService: {
        ejercicios: jest.fn(() => [{ id: 'ejercicio1' }, { id: 'ejercicio2' }]),
        getEjercicio: jest.fn(() => jest.fn(() => ({ id: 'ejercicio1', descansoSegundos: undefined }))),
        delete: jest.fn(),
      },
      EntrenadoService: {
        getEntrenadoById: jest.fn(() => jest.fn(() => ({ 
          id: 'entrenado1', 
          entrenadoresId: ['1'] 
        }))),
        save: jest.fn(),
      },
      UserService: {
        users: jest.fn(() => [mockUser]),
      },
      NotificacionService: {},
      MensajeService: {
        getMensajesByEntrenador: jest.fn(() => jest.fn(() => [])),
      },
      InvitacionService: {
        getInvitacionesPorEntrenador: jest.fn(() => jest.fn(() => [])),
      },
    };

    service = new EntrenadorService();
    service['adapter'] = mockAdapter;
    service['rutinaService'] = mockServices.RutinaService;
    service['ejercicioService'] = mockServices.EjercicioService;
    service['entrenadoService'] = mockServices.EntrenadoService;
    service['userService'] = mockServices.UserService;
    service['notificacionService'] = mockServices.NotificacionService;
    service['mensajeService'] = mockServices.MensajeService;
    service['invitacionService'] = mockServices.InvitacionService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('Signals', () => {
    it('debe inicializar signals correctamente', () => {
      expect(service.entrenadores()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('initializeListener', () => {
    it('debe inicializar el listener cuando no está inicializado', () => {
      service.initializeListener();
      expect(mockAdapter.getEntrenadores).toHaveBeenCalled();
    });

    it('no debe inicializar el listener si ya está inicializado', () => {
      service.initializeListener();
      mockAdapter.getEntrenadores.mockClear();
      
      service.initializeListener();
      expect(mockAdapter.getEntrenadores).not.toHaveBeenCalled();
    });

    it('debe actualizar los entrenadores cuando el adaptador emite datos', () => {
      mockAdapter.getEntrenadores.mockImplementation((callback) => {
        callback([mockEntrenador, mockEntrenador2]);
        return () => {};
      });

      service.initializeListener();

      expect(service.entrenadores()).toEqual([mockEntrenador, mockEntrenador2]);
      expect(service.loading()).toBe(false);
    });

    it('debe manejar errores al cargar entrenadores', () => {
      mockAdapter.getEntrenadores.mockImplementation(() => {
        throw new Error('Test error');
      });

      service.initializeListener();

      expect(service.error()).toBe('Error al cargar entrenadores');
      expect(service.loading()).toBe(false);
    });
  });

  describe('create', () => {
    it('debe crear un nuevo entrenador', async () => {
      mockAdapter.create.mockResolvedValue('new-id');

      const result = await service.create(mockEntrenador);

      expect(result).toBe('new-id');
      expect(mockAdapter.create).toHaveBeenCalledWith(mockEntrenador);
    });

    it('debe manejar errores al crear', async () => {
      mockAdapter.create.mockRejectedValue(new Error('Create error'));

      await expect(service.create(mockEntrenador)).rejects.toThrow('Create error');
      expect(service.error()).toBe('Error al crear entrenador');
    });

    it('debe actualizar el estado de loading correctamente', async () => {
      mockAdapter.create.mockResolvedValue('new-id');

      const promise = service.create(mockEntrenador);
      
      await promise;
      expect(service.loading()).toBe(false);
    });
  });

  describe('createWithId', () => {
    it('debe crear un entrenador con ID específico', async () => {
      const createWithIdMock = jest.fn().mockResolvedValue(undefined);
      mockAdapter.createWithId = createWithIdMock;

      await service.createWithId('custom-id', mockEntrenador);

      expect(createWithIdMock).toHaveBeenCalledWith('custom-id', mockEntrenador);
    });

    it('debe lanzar error si el adaptador no soporta createWithId', async () => {
      mockAdapter.createWithId = undefined;

      await expect(service.createWithId('custom-id', mockEntrenador))
        .rejects.toThrow('El adaptador no soporta createWithId');
    });
  });

  describe('update', () => {
    it('debe actualizar un entrenador existente', async () => {
      mockAdapter.update.mockResolvedValue(undefined);

      await service.update('1', { entrenadosAsignadosIds: ['new-entrenado'] });

      expect(mockAdapter.update).toHaveBeenCalledWith('1', { entrenadosAsignadosIds: ['new-entrenado'] });
    });

    it('debe manejar errores al actualizar', async () => {
      mockAdapter.update.mockRejectedValue(new Error('Update error'));

      await expect(service.update('1', {})).rejects.toThrow('Update error');
      expect(service.error()).toBe('Error al actualizar entrenador');
    });
  });

  describe('delete', () => {
    it('debe eliminar un entrenador', async () => {
      mockAdapter.delete.mockResolvedValue(undefined);

      await service.delete('1');

      expect(mockAdapter.delete).toHaveBeenCalledWith('1');
    });

    it('debe manejar errores al eliminar', async () => {
      mockAdapter.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.delete('1')).rejects.toThrow('Delete error');
      expect(service.error()).toBe('Error al eliminar entrenador');
    });
  });

  describe('getEntrenadorById', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador, mockEntrenador2]);
    });

    it('debe encontrar entrenador por ID', () => {
      const result = service.getEntrenadorById('1');
      expect(result()).toEqual(mockEntrenador);
    });

    it('debe retornar undefined si no encuentra el entrenador', () => {
      const result = service.getEntrenadorById('999');
      expect(result()).toBeUndefined();
    });

    it('debe ser reactivo a cambios', () => {
      service['_entrenadores'].set([mockEntrenador]);
      
      let result = service.getEntrenadorById('1');
      expect(result()).toEqual(mockEntrenador);

      service['_entrenadores'].set([mockEntrenador2]);
      result = service.getEntrenadorById('1');
      expect(result()).toBeUndefined();
    });
  });

  describe('getRutinasByEntrenador', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
    });

    it('debe filtrar rutinas por entrenador', () => {
      const result = service.getRutinasByEntrenador('1');
      expect(result()).toEqual([{ id: 'rutina1' }]);
    });

    it('debe retornar array vacío si el entrenador no existe', () => {
      const result = service.getRutinasByEntrenador('999');
      expect(result()).toEqual([]);
    });

    it('debe retornar array vacío si no hay rutinas creadas', () => {
      service['_entrenadores'].set([{ ...mockEntrenador, rutinasCreadasIds: [] }]);
      const result = service.getRutinasByEntrenador('1');
      expect(result()).toEqual([]);
    });
  });

  describe('getEjerciciosByEntrenador', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
    });

    it('debe filtrar ejercicios por entrenador', () => {
      const result = service.getEjerciciosByEntrenador('1');
      expect(result()).toEqual([{ id: 'ejercicio1' }]);
    });

    it('debe retornar array vacío si el entrenador no existe', () => {
      const result = service.getEjerciciosByEntrenador('999');
      expect(result()).toEqual([]);
    });
  });

  describe('getInvitacionesByEntrenador', () => {
    it('debe delegar al InvitacionService', () => {
      service.getInvitacionesByEntrenador('1');
      expect(mockServices.InvitacionService.getInvitacionesPorEntrenador).toHaveBeenCalledWith('1');
    });
  });

  describe('getMensajesByEntrenador', () => {
    it('debe delegar al MensajeService', () => {
      service.getMensajesByEntrenador('1');
      expect(mockServices.MensajeService.getMensajesByEntrenador).toHaveBeenCalledWith('1');
    });
  });

  describe('getEntrenadosCount', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
    });

    it('debe retornar el conteo de entrenados asignados', () => {
      const result = service.getEntrenadosCount('1');
      expect(result()).toBe(1);
    });

    it('debe retornar 0 si el entrenador no existe', () => {
      const result = service.getEntrenadosCount('999');
      expect(result()).toBe(0);
    });

    it('debe retornar 0 si no hay entrenados asignados', () => {
      service['_entrenadores'].set([{ ...mockEntrenador, entrenadosAsignadosIds: [] }]);
      const result = service.getEntrenadosCount('1');
      expect(result()).toBe(0);
    });
  });

  describe('getLimits', () => {
    it('debe retornar límites para plan free', () => {
      const limits = service.getLimits('1');
      expect(limits).toEqual({
        maxClients: 3,
        maxRoutines: 3,
        maxExercises: 10,
      });
    });

    it('debe retornar límites infinitos para plan premium', () => {
      mockServices.UserService.users.mockReturnValue([{ ...mockUser, plan: 'premium' }]);
      service.invalidateLimitsCache('1');
      
      const limits = service.getLimits('1');
      expect(limits).toEqual({
        maxClients: Infinity,
        maxRoutines: Infinity,
        maxExercises: Infinity,
      });
    });

    it('debe cachear los límites', () => {
      service.getLimits('1');
      mockServices.UserService.users.mockClear();
      
      service.getLimits('1');
      expect(mockServices.UserService.users).not.toHaveBeenCalled();
    });
  });

  describe('invalidateLimitsCache', () => {
    it('debe limpiar el caché de límites para un entrenador', () => {
      service.getLimits('1');
      service.invalidateLimitsCache('1');
      
      service.getLimits('1');
      expect(mockServices.UserService.users).toHaveBeenCalledTimes(2);
    });
  });

  describe('desvincularEntrenado', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
    });

    it('debe desvincular entrenado de ambos lados', async () => {
      await service.desvincularEntrenado('1', 'entrenado1');

      expect(mockServices.EntrenadoService.save).toHaveBeenCalledWith({
        id: 'entrenado1',
        entrenadoresId: [],
      });
      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        entrenadosAsignadosIds: [],
      });
    });

    it('debe manejar entrenado inexistente', async () => {
      mockServices.EntrenadoService.getEntrenadoById.mockReturnValue(jest.fn(() => null));

      await service.desvincularEntrenado('1', 'entrenado999');

      expect(mockServices.EntrenadoService.save).not.toHaveBeenCalled();
    });
  });

  describe('getEntrenadoresWithUserInfo', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador, mockEntrenador2]);
    });

    it('debe combinar información de usuario con entrenadores', () => {
      const result = service.getEntrenadoresWithUserInfo();
      expect(result()[0]).toEqual({
        ...mockEntrenador,
        displayName: 'Test User',
        email: 'test@test.com',
        plan: 'free',
      });
    });

    it('debe usar email como displayName si no hay nombre', () => {
      mockServices.UserService.users.mockReturnValue([{ ...mockUser, nombre: undefined }]);
      
      const result = service.getEntrenadoresWithUserInfo();
      expect(result()[0].displayName).toBe('test@test.com');
    });

    it('debe usar placeholder si no hay usuario', () => {
      mockServices.UserService.users.mockReturnValue([]);
      
      const result = service.getEntrenadoresWithUserInfo();
      expect(result()[0].displayName).toBe('Usuario 1');
      expect(result()[0].email).toBe('');
      expect(result()[0].plan).toBe('free');
    });
  });

  describe('addEjercicioCreado', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
    });

    it('debe agregar ejercicio a la lista del entrenador', async () => {
      await service.addEjercicioCreado('1', 'ejercicio-nuevo');

      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        ejerciciosCreadasIds: ['ejercicio1', 'ejercicio-nuevo'],
      });
    });

    it('no debe agregar ejercicio duplicado', async () => {
      await service.addEjercicioCreado('1', 'ejercicio1');

      expect(mockAdapter.update).not.toHaveBeenCalled();
    });

    it('debe validar límite de ejercicios en plan free', async () => {
      service['_entrenadores'].set([{
        ...mockEntrenador,
        ejerciciosCreadasIds: Array(10).fill('ejercicio'),
      }]);

      await expect(service.addEjercicioCreado('1', 'ejercicio-nuevo'))
        .rejects.toThrow(PlanLimitError);
    });

    it('debe validar campos premium en plan free', async () => {
      service['_entrenadores'].set([mockEntrenador]);
      
      mockServices.EjercicioService.getEjercicio.mockReturnValue(
        jest.fn(() => ({ id: 'ejercicio-nuevo', descansoSegundos: 60 }))
      );

      await expect(service.addEjercicioCreado('1', 'ejercicio-nuevo'))
        .rejects.toThrow(PlanLimitError);
    });
  });

  describe('removeEjercicioCreado', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
    });

    it('debe quitar ejercicio de la lista del entrenador', async () => {
      await service.removeEjercicioCreado('1', 'ejercicio1');

      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        ejerciciosCreadasIds: [],
      });
    });

    it('debe manejar entrenador inexistente', async () => {
      await service.removeEjercicioCreado('999', 'ejercicio1');

      expect(mockAdapter.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEjercicioCreado', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
      mockServices.EjercicioService.delete.mockResolvedValue(undefined);
    });

    it('debe eliminar ejercicio y quitarlo de la lista', async () => {
      await service.deleteEjercicioCreado('1', 'ejercicio1');

      expect(mockServices.EjercicioService.delete).toHaveBeenCalledWith('ejercicio1');
      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        ejerciciosCreadasIds: [],
      });
    });
  });

  describe('addRutinaCreada', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
    });

    it('debe agregar rutina a la lista del entrenador', async () => {
      await service.addRutinaCreada('1', 'rutina-nueva');

      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        rutinasCreadasIds: ['rutina1', 'rutina-nueva'],
      });
    });

    it('no debe agregar rutina duplicada', async () => {
      await service.addRutinaCreada('1', 'rutina1');

      expect(mockAdapter.update).not.toHaveBeenCalled();
    });

    it('debe validar límite de rutinas en plan free', async () => {
      service['_entrenadores'].set([{
        ...mockEntrenador,
        rutinasCreadasIds: ['r1', 'r2', 'r3'],
      }]);

      await expect(service.addRutinaCreada('1', 'rutina-nueva'))
        .rejects.toThrow(PlanLimitError);
    });

    it('debe validar campos premium en plan free', async () => {
      service['_entrenadores'].set([mockEntrenador]);
      
      mockServices.RutinaService.getRutina.mockReturnValue(
        jest.fn(() => ({ id: 'rutina-nueva', duracion: 60 }))
      );

      await expect(service.addRutinaCreada('1', 'rutina-nueva'))
        .rejects.toThrow(PlanLimitError);
    });
  });

  describe('removeRutinaCreada', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
    });

    it('debe quitar rutina de la lista del entrenador', async () => {
      await service.removeRutinaCreada('1', 'rutina1');

      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        rutinasCreadasIds: [],
      });
    });

    it('debe manejar entrenador inexistente', async () => {
      await service.removeRutinaCreada('999', 'rutina1');

      expect(mockAdapter.update).not.toHaveBeenCalled();
    });
  });

  describe('asignarEntrenado', () => {
    beforeEach(() => {
      service['_entrenadores'].set([mockEntrenador]);
      mockAdapter.update.mockResolvedValue(undefined);
      mockServices.EntrenadoService.save.mockResolvedValue(undefined);
    });

    it('debe asignar entrenado a entrenador', async () => {
      await service.asignarEntrenado('1', 'entrenado-nuevo');

      expect(mockAdapter.update).toHaveBeenCalledWith('1', {
        entrenadosAsignadosIds: ['entrenado1', 'entrenado-nuevo'],
      });
      expect(mockServices.EntrenadoService.save).toHaveBeenCalled();
    });

    it('debe validar límite de clientes en plan free', async () => {
      service['_entrenadores'].set([{
        ...mockEntrenador,
        entrenadosAsignadosIds: ['e1', 'e2', 'e3'],
      }]);

      await expect(service.asignarEntrenado('1', 'entrenado-nuevo'))
        .rejects.toThrow(PlanLimitError);
    });

    it('no debe duplicar entrenado ya asignado', async () => {
      await service.asignarEntrenado('1', 'entrenado1');

      expect(mockAdapter.update).not.toHaveBeenCalled();
    });
  });

  describe('Integración con DestroyRef', () => {
    it('debe registrar callback de cleanup en constructor', () => {
      expect(service['destroyRef']).toBeDefined();
      expect(service['destroyRef'].onDestroy).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('debe limpiar el listener y resetear estado', () => {
      const unsubscribeMock = jest.fn();
      mockAdapter.getEntrenadores.mockReturnValue(unsubscribeMock);

      service.initializeListener();
      service['cleanup']();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('debe limpiar el caché de límites', () => {
      service.getLimits('1');
      service['cleanup']();

      expect(service['limitsCache'].size).toBe(0);
    });

    it('debe manejar cleanup sin listener inicializado', () => {
      expect(() => service['cleanup']()).not.toThrow();
    });
  });
});
