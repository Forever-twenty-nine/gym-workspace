import { EntrenadoService, IEntrenadoFirestoreAdapter } from './entrenado.service';
import { Entrenado } from '../models/entrenado.model';
import { Objetivo } from '../enums/objetivo.enum';

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

describe('EntrenadoService', () => {
  let service: EntrenadoService;
  let mockAdapter: jest.Mocked<IEntrenadoFirestoreAdapter>;

  const mockEntrenado: Entrenado = {
    id: '1',
    objetivo: Objetivo.AUMENTAR_MUSCULO,
    entrenadoresId: ['trainer1'],
    rutinasCreadas: ['rutina1'],
    rutinasAsignadasIds: ['asignada1'],
    fechaRegistro: new Date(),
  };

  const mockEntrenado2: Entrenado = {
    id: '2',
    objetivo: Objetivo.BAJAR_PESO,
    entrenadoresId: ['trainer2'],
    rutinasCreadas: [],
    rutinasAsignadasIds: [],
    fechaRegistro: new Date(),
  };

  beforeEach(() => {
    // Silenciar console durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockAdapter = {
      initializeListener: jest.fn((onUpdate) => {
        // Retorna función de cleanup
        return () => {};
      }),
      subscribeToEntrenado: jest.fn((id, onUpdate) => {
        // Retorna función de cleanup
        return () => {};
      }),
      save: jest.fn(),
      delete: jest.fn(),
    };

    service = new EntrenadoService();
    service.setFirestoreAdapter(mockAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('setFirestoreAdapter', () => {
    it('debe configurar el adaptador de Firestore', () => {
      const newService = new EntrenadoService();
      newService.setFirestoreAdapter(mockAdapter);

      expect(newService['firestoreAdapter']).toBe(mockAdapter);
    });
  });

  describe('entrenados', () => {
    it('debe retornar signal readonly vacío inicialmente', () => {
      const newService = new EntrenadoService();
      
      expect(newService.entrenados()).toEqual([]);
    });

    it('debe inicializar el listener al acceder por primera vez', () => {
      service.entrenados();

      expect(mockAdapter.initializeListener).toHaveBeenCalled();
    });

    it('no debe inicializar el listener múltiples veces', () => {
      service.entrenados();
      service.entrenados();
      service.entrenados();

      expect(mockAdapter.initializeListener).toHaveBeenCalledTimes(1);
    });

    it('debe actualizar cuando el adaptador emite datos', () => {
      let updateCallback: (entrenados: Entrenado[]) => void;
      mockAdapter.initializeListener.mockImplementation((onUpdate) => {
        updateCallback = onUpdate;
        return () => {};
      });

      service.entrenados();

      const entrenados = [mockEntrenado, mockEntrenado2];
      updateCallback!(entrenados);

      expect(service.entrenados()).toEqual(entrenados);
    });

    it('no debe inicializar listener si no hay adaptador', () => {
      const newService = new EntrenadoService();

      newService.entrenados();

      expect(newService['isListenerInitialized']).toBe(false);
    });
  });

  describe('initializeListener', () => {
    it('debe manejar errores al inicializar el listener', () => {
      const errorAdapter: IEntrenadoFirestoreAdapter = {
        ...mockAdapter,
        initializeListener: jest.fn(() => {
          throw new Error('Listener failed');
        }),
      };

      const newService = new EntrenadoService();
      newService.setFirestoreAdapter(errorAdapter);

      // No debería lanzar error
      expect(() => newService.entrenados()).not.toThrow();
      expect(newService['isListenerInitialized']).toBe(false);
    });

    it('debe crear nuevo array al actualizar (inmutabilidad)', () => {
      let updateCallback: (entrenados: Entrenado[]) => void;
      mockAdapter.initializeListener.mockImplementation((onUpdate) => {
        updateCallback = onUpdate;
        return () => {};
      });

      service.entrenados();

      const originalArray = [mockEntrenado];
      updateCallback!(originalArray);

      const resultArray = service.entrenados();
      expect(resultArray).toEqual(originalArray);
      expect(resultArray).not.toBe(originalArray); // Debe ser un nuevo array
    });
  });

  describe('getEntrenado', () => {
    it('debe crear un signal para un entrenado específico', () => {
      const result = service.getEntrenado('1');

      expect(result()).toBeNull();
      expect(mockAdapter.subscribeToEntrenado).toHaveBeenCalledWith('1', expect.any(Function));
    });

    it('debe reutilizar signal existente para el mismo ID', () => {
      const result1 = service.getEntrenado('1');
      const result2 = service.getEntrenado('1');

      expect(result1).toBe(result2);
      expect(mockAdapter.subscribeToEntrenado).toHaveBeenCalledTimes(1);
    });

    it('debe actualizar el signal cuando el adaptador emite datos', () => {
      let updateCallback: (entrenado: Entrenado | null) => void;
      mockAdapter.subscribeToEntrenado.mockImplementation((id, onUpdate) => {
        updateCallback = onUpdate;
        return () => {};
      });

      const result = service.getEntrenado('1');
      expect(result()).toBeNull();

      updateCallback!(mockEntrenado);

      expect(result()).toEqual(mockEntrenado);
    });

    it('debe almacenar función de cleanup', () => {
      const cleanupMock = jest.fn();
      mockAdapter.subscribeToEntrenado.mockReturnValue(cleanupMock);

      service.getEntrenado('1');

      expect(service['entrenadoSignals'].has('1')).toBe(true);
      expect(service['entrenadoSignals'].get('1')?.cleanup).toBe(cleanupMock);
    });

    it('debe funcionar sin adaptador configurado', () => {
      const newService = new EntrenadoService();

      const result = newService.getEntrenado('1');

      expect(result()).toBeNull();
    });
  });

  describe('save', () => {
    beforeEach(() => {
      // Inicializar con datos
      service['_entrenados'].set([mockEntrenado]);
    });

    it('debe guardar un nuevo entrenado', async () => {
      mockAdapter.save.mockResolvedValue(undefined);
      const newEntrenado = { ...mockEntrenado2, id: '2' };

      await service.save(newEntrenado);

      expect(service.entrenados()).toContain(newEntrenado);
      expect(mockAdapter.save).toHaveBeenCalledWith(newEntrenado);
    });

    it('debe actualizar un entrenado existente (actualización optimista)', async () => {
      mockAdapter.save.mockResolvedValue(undefined);
      const updatedEntrenado = { ...mockEntrenado, objetivo: Objetivo.MANTENER_PESO };

      await service.save(updatedEntrenado);

      const entrenados = service.entrenados();
      expect(entrenados.find(e => e.id === '1')?.objetivo).toBe(Objetivo.MANTENER_PESO);
      expect(mockAdapter.save).toHaveBeenCalledWith(updatedEntrenado);
    });

    it('debe revertir cambios si falla el guardado', async () => {
      const error = new Error('Save failed');
      mockAdapter.save.mockRejectedValue(error);
      const updatedEntrenado = { ...mockEntrenado, objetivo: Objetivo.MANTENER_PESO };

      await expect(service.save(updatedEntrenado)).rejects.toThrow('Save failed');

      // Debe revertir al estado anterior
      const entrenados = service.entrenados();
      expect(entrenados.find(e => e.id === '1')?.objetivo).toBe(Objetivo.AUMENTAR_MUSCULO);
    });

    it('debe lanzar error si el adaptador no está configurado', async () => {
      const newService = new EntrenadoService();

      await expect(newService.save(mockEntrenado)).rejects.toThrow('Firestore adapter no configurado');
    });

    it('debe mantener la inmutabilidad al actualizar', async () => {
      mockAdapter.save.mockResolvedValue(undefined);
      const previousState = service.entrenados();
      const updatedEntrenado = { ...mockEntrenado, nombre: 'Juan Updated' };

      await service.save(updatedEntrenado);

      const newState = service.entrenados();
      expect(newState).not.toBe(previousState);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
    });

    it('debe eliminar un entrenado (actualización optimista)', async () => {
      mockAdapter.delete.mockResolvedValue(undefined);

      await service.delete('1');

      const entrenados = service.entrenados();
      expect(entrenados).not.toContainEqual(mockEntrenado);
      expect(entrenados).toHaveLength(1);
      expect(mockAdapter.delete).toHaveBeenCalledWith('1');
    });

    it('debe revertir cambios si falla la eliminación', async () => {
      const error = new Error('Delete failed');
      mockAdapter.delete.mockRejectedValue(error);

      await expect(service.delete('1')).rejects.toThrow('Delete failed');

      // Debe revertir al estado anterior
      const entrenados = service.entrenados();
      expect(entrenados).toContainEqual(mockEntrenado);
      expect(entrenados).toHaveLength(2);
    });

    it('debe lanzar error si el adaptador no está configurado', async () => {
      const newService = new EntrenadoService();

      await expect(newService.delete('1')).rejects.toThrow('Firestore adapter no configurado');
    });
  });

  describe('getEntrenadoById', () => {
    beforeEach(() => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
    });

    it('debe encontrar entrenado por ID', () => {
      const result = service.getEntrenadoById('1');

      expect(result()).toEqual(mockEntrenado);
    });

    it('debe retornar null si no encuentra el entrenado', () => {
      const result = service.getEntrenadoById('999');

      expect(result()).toBeNull();
    });

    it('debe retornar computed signal reactivo', () => {
      mockAdapter.initializeListener.mockImplementation((onUpdate) => {
        onUpdate([mockEntrenado]);
        return () => {};
      });

      service.entrenados(); // Inicializa listener

      const result = service.getEntrenadoById('1');
      expect(result()).toEqual(mockEntrenado);
    });
  });

  describe('getEntrenadosByObjetivo', () => {
    beforeEach(() => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
    });

    it('debe filtrar entrenados por objetivo', () => {
      const result = service.getEntrenadosByObjetivo(Objetivo.AUMENTAR_MUSCULO);

      expect(result()).toEqual([mockEntrenado]);
      expect(result()).toHaveLength(1);
    });

    it('debe retornar array vacío si no hay coincidencias', () => {
      const result = service.getEntrenadosByObjetivo(Objetivo.MANTENER_PESO);

      expect(result()).toEqual([]);
    });

    it('debe retornar computed signal reactivo', () => {
      mockAdapter.initializeListener.mockImplementation((onUpdate) => {
        onUpdate([mockEntrenado]);
        return () => {};
      });

      service.entrenados(); // Inicializa listener

      const result = service.getEntrenadosByObjetivo(Objetivo.AUMENTAR_MUSCULO);
      expect(result()).toHaveLength(1);
      expect(result()[0]).toEqual(mockEntrenado);
    });
  });

  describe('getEntrenadosByEntrenador', () => {
    beforeEach(() => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
    });

    it('debe filtrar entrenados por entrenador', () => {
      const result = service.getEntrenadosByEntrenador('trainer1');

      expect(result()).toEqual([mockEntrenado]);
      expect(result()).toHaveLength(1);
    });

    it('debe retornar array vacío si no hay coincidencias', () => {
      const result = service.getEntrenadosByEntrenador('trainer999');

      expect(result()).toEqual([]);
    });

    it('debe manejar entrenados sin entrenadoresId', () => {
      const entrenadoSinEntrenador = { ...mockEntrenado, id: '3', entrenadoresId: undefined };
      service['_entrenados'].set([entrenadoSinEntrenador]);

      const result = service.getEntrenadosByEntrenador('trainer1');

      expect(result()).toEqual([]);
    });
  });

  describe('getEntrenadosByRutinaCreada', () => {
    beforeEach(() => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
    });

    it('debe filtrar entrenados por rutina creada', () => {
      const result = service.getEntrenadosByRutinaCreada('rutina1');

      expect(result()).toEqual([mockEntrenado]);
      expect(result()).toHaveLength(1);
    });

    it('debe retornar array vacío si no hay coincidencias', () => {
      const result = service.getEntrenadosByRutinaCreada('rutina999');

      expect(result()).toEqual([]);
    });

    it('debe manejar entrenados sin rutinasCreadas', () => {
      const entrenadoSinRutinas = { ...mockEntrenado, id: '3', rutinasCreadas: undefined };
      service['_entrenados'].set([entrenadoSinRutinas]);

      const result = service.getEntrenadosByRutinaCreada('rutina1');

      expect(result()).toEqual([]);
    });
  });

  describe('getEntrenadosByRutinaAsignada', () => {
    it('debe retornar array vacío (no implementado)', () => {
      const result = service.getEntrenadosByRutinaAsignada('rutina1');

      expect(result()).toEqual([]);
    });
  });

  describe('getEntrenadosActivos', () => {
    it('debe retornar todos los entrenados', () => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);

      const result = service.getEntrenadosActivos();

      expect(result()).toEqual([mockEntrenado, mockEntrenado2]);
      expect(result()).toHaveLength(2);
    });
  });

  describe('Computed Signals', () => {
    it('debe inicializar con conteo de entrenados en 0', () => {
      expect(service.entrenadoCount()).toBe(0);
      expect(service.entrenadoActivoCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('debe limpiar el listener principal', () => {
      const cleanupMock = jest.fn();
      mockAdapter.initializeListener.mockReturnValue(cleanupMock);

      service.entrenados();

      service['cleanup']();

      expect(cleanupMock).toHaveBeenCalled();
      expect(service['listenerCleanup']).toBeUndefined();
    });

    it('debe limpiar todos los listeners individuales', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();
      mockAdapter.subscribeToEntrenado.mockReturnValueOnce(cleanup1).mockReturnValueOnce(cleanup2);

      service.getEntrenado('1');
      service.getEntrenado('2');

      service['cleanup']();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
      expect(service['entrenadoSignals'].size).toBe(0);
    });

    it('debe resetear el flag de listener inicializado', () => {
      service.entrenados();
      expect(service['isListenerInitialized']).toBe(true);

      service['cleanup']();

      expect(service['isListenerInitialized']).toBe(false);
    });

    it('debe manejar cleanup sin listener inicializado', () => {
      expect(() => service['cleanup']()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('debe limpiar y resetear el estado', () => {
      service['_entrenados'].set([mockEntrenado, mockEntrenado2]);
      // Forzar inicialización del listener sin acceder al getter
      service['initializeListener']();

      service.reset();

      expect(service['_entrenados']()).toEqual([]);
      expect(service['isListenerInitialized']).toBe(false);
    });

    it('debe limpiar listeners al resetear', () => {
      const cleanupMock = jest.fn();
      mockAdapter.initializeListener.mockReturnValue(cleanupMock);

      service.entrenados();
      service.reset();

      expect(cleanupMock).toHaveBeenCalled();
    });
  });

  describe('Integración con DestroyRef', () => {
    it('debe registrar callback de cleanup en constructor', () => {
      // El servicio debe registrar un callback con destroyRef
      expect(service['destroyRef']).toBeDefined();
    });
  });
});
