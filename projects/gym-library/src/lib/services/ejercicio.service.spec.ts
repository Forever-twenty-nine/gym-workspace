import { EjercicioService, IEjercicioFirestoreAdapter } from './ejercicio.service';
import { Ejercicio } from '../models/ejercicio.model';
import { Rol } from '../enums/rol.enum';

// Mock del módulo de Angular antes de importar el servicio
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core');
  return {
    ...actual,
    inject: jest.fn(() => ({
      onDestroy: jest.fn(),
    })),
  };
});

describe('EjercicioService', () => {
  let service: EjercicioService;
  let mockAdapter: jest.Mocked<IEjercicioFirestoreAdapter>;

  const mockEjercicio: Ejercicio = {
    id: '1',
    nombre: 'Press de Banca',
    descripcion: 'Ejercicio para pecho',
    series: 3,
    repeticiones: 10,
    peso: 80,
    descansoSegundos: 60,
    serieSegundos: 30,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
  };

  beforeEach(() => {
    // Silenciar console.error durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockAdapter = {
      initializeListener: jest.fn(),
      subscribeToEjercicio: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      unsubscribe: jest.fn(),
    };

    service = new EjercicioService();
    service.setFirestoreAdapter(mockAdapter);
  });

  afterEach(() => {
    // Restaurar console después de cada test
    jest.restoreAllMocks();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuración del Adaptador', () => {
    it('debe retornar false cuando el adaptador no está configurado', () => {
      const newService = new EjercicioService();
      expect(newService.isAdapterConfigured).toBe(false);
    });

    it('debe retornar true cuando el adaptador está configurado', () => {
      expect(service.isAdapterConfigured).toBe(true);
    });
  });

  describe('Signals', () => {
    it('debe inicializar signals correctamente', () => {
      expect(service.ejercicios()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.ejercicioCount()).toBe(0);
      expect(service.isEjerciciosLoaded()).toBe(false); // Listener no inicializado automáticamente
    });
  });

  describe('initializeEjerciciosListener', () => {
    it('debe inicializar el listener cuando no está inicializado', () => {
      service.initializeEjerciciosListener();
      expect(mockAdapter.initializeListener).toHaveBeenCalled();
    });

    it('no debe inicializar el listener si ya está inicializado', () => {
      // Inicializar primero
      service.initializeEjerciciosListener();
      mockAdapter.initializeListener.mockClear();

      // Ahora ya está inicializado, no debería llamar de nuevo
      service.initializeEjerciciosListener();
      expect(mockAdapter.initializeListener).not.toHaveBeenCalled();
    });

    it('no debe inicializar si no hay adaptador configurado', () => {
      const newService = new EjercicioService();

      newService.initializeEjerciciosListener();

      // No debería hacer nada, no hay adaptador
      expect(newService['_isListenerInitialized']()).toBe(false);
    });
  });

  describe('findEjercicioById', () => {
    beforeEach(() => {
      service['_ejercicios'].set([mockEjercicio]);
    });

    it('debe encontrar ejercicio por ID', () => {
      expect(service.findEjercicioById('1')).toEqual(mockEjercicio);
    });

    it('debe retornar null si no encuentra el ejercicio', () => {
      expect(service.findEjercicioById('999')).toBeNull();
    });
  });

  describe('save', () => {
    it('debe guardar ejercicio correctamente', async () => {
      mockAdapter.save.mockResolvedValue(undefined);

      await service.save(mockEjercicio);

      expect(mockAdapter.save).toHaveBeenCalled();
      const calledWith = mockAdapter.save.mock.calls[0][0];
      expect(calledWith.nombre).toBe(mockEjercicio.nombre);
      expect(calledWith.id).toBe(mockEjercicio.id);
      expect(calledWith.fechaModificacion).toBeDefined();
    });

    it('debe lanzar error si el adaptador no está configurado', async () => {
      const newService = new EjercicioService();

      await expect(newService.save(mockEjercicio)).rejects.toThrow('Firestore adapter no configurado');
    });

    it('debe validar entrada - nombre vacío', async () => {
      const ejercicioInvalido = { ...mockEjercicio, nombre: '' };

      await expect(service.save(ejercicioInvalido)).rejects.toThrow('El nombre del ejercicio es obligatorio');
    });

    it('debe validar entrada - series negativas', async () => {
      const ejercicioInvalido = { ...mockEjercicio, series: -1 };

      await expect(service.save(ejercicioInvalido)).rejects.toThrow('Las series deben ser un valor positivo');
    });

    it('debe validar entrada - repeticiones negativas', async () => {
      const ejercicioInvalido = { ...mockEjercicio, repeticiones: -1 };

      await expect(service.save(ejercicioInvalido)).rejects.toThrow('Las repeticiones deben ser un valor positivo');
    });

    it('debe validar entrada - peso negativo', async () => {
      const ejercicioInvalido = { ...mockEjercicio, peso: -10 };

      await expect(service.save(ejercicioInvalido)).rejects.toThrow('El peso debe ser un valor positivo');
    });

    it('debe manejar errores del adaptador', async () => {
      const error = new Error('Save failed');
      mockAdapter.save.mockRejectedValue(error);

      await expect(service.save(mockEjercicio)).rejects.toThrow('Save failed');
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Setup initial ejercicio
      service['_ejercicios'].set([mockEjercicio]);
    });

    it('debe eliminar ejercicio optimistamente', async () => {
      mockAdapter.delete.mockResolvedValue(undefined);

      await service.delete('1');

      expect(service.ejercicios()).toEqual([]);
    });

    it('debe lanzar error si el adaptador no está configurado', async () => {
      const newService = new EjercicioService();

      await expect(newService.delete('1')).rejects.toThrow('Firestore adapter no configurado');
    });

    it('debe manejar ID vacío', async () => {
      await expect(service.delete('')).rejects.toThrow('ID de ejercicio inválido');
      expect(service.error()).toBe('VALIDATION_ERROR');
    });

    it('debe revertir en caso de error', async () => {
      const error = new Error('Delete failed');
      mockAdapter.delete.mockRejectedValue(error);

      await expect(service.delete('1')).rejects.toThrow();

      expect(service.ejercicios()).toContain(mockEjercicio); // Reverted
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('Métodos de Consulta', () => {
    it('debe filtrar ejercicios por nombre', () => {
      service['_ejercicios'].set([mockEjercicio]);
      const result = service.getEjerciciosByNombre('Press');
      expect(result()).toEqual([mockEjercicio]);
    });

    it('debe filtrar ejercicios por descripción', () => {
      service['_ejercicios'].set([mockEjercicio]);
      const result = service.getEjerciciosByDescripcion('pecho');
      expect(result()).toEqual([mockEjercicio]);
    });

    it('debe filtrar ejercicios por rango de series', () => {
      service['_ejercicios'].set([mockEjercicio]);
      const result = service.getEjerciciosBySeries(1, 5);
      expect(result()).toEqual([mockEjercicio]);
    });

    it('debe filtrar ejercicios por rango de repeticiones', () => {
      service['_ejercicios'].set([mockEjercicio]);
      const result = service.getEjerciciosByRepeticiones(5, 15);
      expect(result()).toEqual([mockEjercicio]);
    });

    it('debe obtener ejercicios con peso', () => {
      service['_ejercicios'].set([mockEjercicio]);
      const result = service.getEjerciciosConPeso();
      expect(result()).toEqual([mockEjercicio]);
    });

    it('debe obtener ejercicios sin peso', () => {
      const ejercicioSinPeso = { ...mockEjercicio, id: '2', peso: 0 };
      service['_ejercicios'].set([ejercicioSinPeso]);

      const result = service.getEjerciciosSinPeso();
      expect(result()).toEqual([ejercicioSinPeso]);
    });
  });

  describe('Métodos Estáticos', () => {
    it('debe verificar si un rol puede crear ejercicios', () => {
      expect(EjercicioService.canCreateEjercicio(Rol.ENTRENADOR)).toBe(true);
      expect(EjercicioService.canCreateEjercicio(Rol.ENTRENADO)).toBe(true);
      expect(EjercicioService.canCreateEjercicio(Rol.GIMNASIO)).toBe(false);
    });

    it('debe obtener los roles que pueden crear ejercicios', () => {
      const roles = EjercicioService.getRolesCreadores();
      expect(roles).toEqual([Rol.ENTRENADO, Rol.ENTRENADOR]);
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores del tipo EjercicioServiceError', async () => {
      const error = new Error('Network failed');
      mockAdapter.save.mockRejectedValue(error);

      await expect(service.save(mockEjercicio)).rejects.toThrow('Network failed');
      expect(service.error()).toBe('NETWORK_ERROR');
    });

    it('debe limpiar errores correctamente', () => {
      service['_error'].set('NETWORK_ERROR');
      expect(service.error()).toBe('NETWORK_ERROR');

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('debe limpiar todos los recursos', () => {
      service['_ejercicios'].set([mockEjercicio]);
      service['_error'].set('NETWORK_ERROR');
      service['_isLoading'].set(true);

      service.destroy();

      expect(service.ejercicios()).toEqual([]);
      expect(service.error()).toBeNull();
      expect(service.isLoading()).toBe(false);
    });

    it('debe llamar unsubscribe si el listener está inicializado', () => {
      service['_isListenerInitialized'].set(true);
      mockAdapter.unsubscribe = jest.fn();

      service.destroy();

      expect(mockAdapter.unsubscribe).toHaveBeenCalled();
    });

    it('debe limpiar suscripciones individuales', () => {
      const unsubscribeMock = jest.fn();
      service['ejercicioUnsubscribers'].set('test-id', unsubscribeMock);

      service.destroy();

      expect(unsubscribeMock).toHaveBeenCalled();
      expect(service['ejercicioUnsubscribers'].size).toBe(0);
    });
  });

  describe('getEjercicio', () => {
    it('debe retornar signal computado si el ejercicio existe en la lista', () => {
      service['_ejercicios'].set([mockEjercicio]);
      
      const result = service.getEjercicio('1');
      
      expect(result()).toEqual(mockEjercicio);
    });

    it('debe reutilizar signal computado para el mismo ID', () => {
      service['_ejercicios'].set([mockEjercicio]);
      
      const result1 = service.getEjercicio('1');
      const result2 = service.getEjercicio('1');
      
      expect(result1).toBe(result2);
    });

    it('debe crear nueva suscripción si el ejercicio no existe en la lista', () => {
      mockAdapter.subscribeToEjercicio.mockReturnValue(() => {});
      
      const result = service.getEjercicio('999');
      
      expect(mockAdapter.subscribeToEjercicio).toHaveBeenCalledWith('999', expect.any(Function));
      expect(result()).toBeNull();
    });

    it('debe almacenar función de unsubscribe si se proporciona', () => {
      const unsubscribeMock = jest.fn();
      mockAdapter.subscribeToEjercicio.mockReturnValue(unsubscribeMock);
      
      service.getEjercicio('999');
      
      expect(service['ejercicioUnsubscribers'].has('999')).toBe(true);
    });

    it('debe reutilizar signal existente para suscripciones individuales', () => {
      mockAdapter.subscribeToEjercicio.mockReturnValue(() => {});
      
      const result1 = service.getEjercicio('999');
      const result2 = service.getEjercicio('999');
      
      expect(mockAdapter.subscribeToEjercicio).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('debe actualizar el signal cuando el adaptador emite nuevos datos', () => {
      let updateCallback: (ejercicio: Ejercicio | null) => void;
      mockAdapter.subscribeToEjercicio.mockImplementation((id, callback) => {
        updateCallback = callback;
        return () => {};
      });

      const result = service.getEjercicio('999');
      expect(result()).toBeNull();

      const newEjercicio = { ...mockEjercicio, id: '999' };
      updateCallback!(newEjercicio);

      expect(result()).toEqual(newEjercicio);
    });
  });

  describe('setFirestoreAdapter', () => {
    it('debe desuscribirse del listener anterior si existe', () => {
      const oldAdapter = {
        ...mockAdapter,
        unsubscribe: jest.fn(),
      };

      const newService = new EjercicioService();
      newService.setFirestoreAdapter(oldAdapter);
      newService['_isListenerInitialized'].set(true);

      const newAdapter = { ...mockAdapter, unsubscribe: jest.fn() };
      newService.setFirestoreAdapter(newAdapter);

      expect(oldAdapter.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('normalizeEjercicio', () => {
    it('debe normalizar nombre y descripción', () => {
      const ejercicio = {
        ...mockEjercicio,
        nombre: '  Press de Banca  ',
        descripcion: '  Ejercicio para pecho  ',
      };

      const normalized = service['normalizeEjercicio'](ejercicio);

      expect(normalized.nombre).toBe('Press de Banca');
      expect(normalized.descripcion).toBe('Ejercicio para pecho');
    });

    it('debe eliminar descripción vacía después de trim', () => {
      const ejercicio = {
        ...mockEjercicio,
        descripcion: '   ',
      };

      const normalized = service['normalizeEjercicio'](ejercicio);

      expect(normalized.descripcion).toBeUndefined();
    });

    it('debe eliminar campos undefined', () => {
      const ejercicio: any = {
        ...mockEjercicio,
        campoUndefined: undefined,
      };

      const normalized = service['normalizeEjercicio'](ejercicio);

      expect('campoUndefined' in normalized).toBe(false);
    });

    it('debe agregar fechaCreacion si el ejercicio es nuevo', () => {
      const ejercicio = {
        ...mockEjercicio,
        id: '',
      };

      const normalized = service['normalizeEjercicio'](ejercicio);

      expect(normalized.fechaCreacion).toBeDefined();
      expect(normalized.fechaCreacion).toBeInstanceOf(Date);
    });

    it('debe actualizar fechaModificacion siempre', () => {
      const oldDate = new Date('2020-01-01');
      const ejercicio = {
        ...mockEjercicio,
        fechaModificacion: oldDate,
      };

      const normalized = service['normalizeEjercicio'](ejercicio);

      expect(normalized.fechaModificacion).not.toEqual(oldDate);
      expect(normalized.fechaModificacion).toBeInstanceOf(Date);
    });
  });

  describe('delete - casos adicionales', () => {
    it('debe manejar ejercicio no encontrado', async () => {
      service['_ejercicios'].set([]);

      await expect(service.delete('999')).rejects.toThrow('Ejercicio no encontrado');
      expect(service.error()).toBe('VALIDATION_ERROR');
    });
  });

  describe('initializeListener - manejo de errores', () => {
    it('debe capturar errores al inicializar el listener', () => {
      const errorAdapter = {
        ...mockAdapter,
        initializeListener: jest.fn(() => {
          throw new Error('Listener failed');
        }),
      };

      const newService = new EjercicioService();
      newService.setFirestoreAdapter(errorAdapter);

      newService.initializeEjerciciosListener();

      expect(newService.error()).toBe('NETWORK_ERROR');
    });

    it('debe llamar callback de error si el adaptador lo emite', () => {
      let errorCallback: (error: string) => void;
      mockAdapter.initializeListener.mockImplementation((onUpdate, onError) => {
        errorCallback = onError!;
      });

      service.initializeEjerciciosListener();

      errorCallback!('Test error');

      expect(service.error()).toBe('NETWORK_ERROR');
    });

    it('debe actualizar ejercicios cuando el adaptador emite datos', () => {
      let updateCallback: (ejercicios: Ejercicio[]) => void;
      mockAdapter.initializeListener.mockImplementation((onUpdate, onError) => {
        updateCallback = onUpdate;
      });

      service.initializeEjerciciosListener();

      const ejercicios = [mockEjercicio];
      updateCallback!(ejercicios);

      expect(service.ejercicios()).toEqual(ejercicios);
    });
  });

  describe('filterByRange', () => {
    it('debe filtrar sin máximo cuando max no está definido', () => {
      const ejercicios = [
        { ...mockEjercicio, id: '1', series: 3 },
        { ...mockEjercicio, id: '2', series: 5 },
        { ...mockEjercicio, id: '3', series: 8 },
      ];
      service['_ejercicios'].set(ejercicios);

      const result = service.getEjerciciosBySeries(5);

      expect(result()).toHaveLength(2);
      expect(result()[0].id).toBe('2');
      expect(result()[1].id).toBe('3');
    });
  });
});