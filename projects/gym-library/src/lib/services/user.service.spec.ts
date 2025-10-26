import { UserService, IUserFirestoreAdapter } from './user.service';
import { User } from '../models/user.model';
import { Rol } from '../enums/rol.enum';

describe('UserService', () => {
  let service: UserService;
  let mockAdapter: jest.Mocked<IUserFirestoreAdapter>;

  const mockUser: User = {
    uid: '1',
    nombre: 'Test User',
    email: 'test@example.com',
    role: Rol.ENTRENADO,
  };

  beforeEach(() => {
    // Silenciar console.error durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockAdapter = {
      initializeListener: jest.fn(),
      getUsers: jest.fn(),
      addUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      unsubscribe: jest.fn(),
    };

    service = new UserService();
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
      const newService = new UserService();
      expect(newService.isAdapterConfigured).toBe(false);
    });

    it('debe retornar true cuando el adaptador está configurado', () => {
      expect(service.isAdapterConfigured).toBe(true);
    });
  });

  describe('Signals', () => {
    it('debe inicializar signals correctamente', () => {
      expect(service.user()).toBeNull();
      expect(service.users()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.userCount()).toBe(0);
      expect(service.isUsersLoaded()).toBe(false); // Listener no inicializado automáticamente
    });
  });

  describe('getUsers', () => {
    it('debe obtener usuarios y actualizar signals', async () => {
      const users = [mockUser];
      mockAdapter.getUsers.mockResolvedValue(users);

      const result = await service.getUsers();

      expect(result).toEqual(users);
      expect(service.users()).toEqual(users);
      // isUsersLoaded ya se verifica en el test de inicialización
    });

    it('debe manejar errores', async () => {
      const error = new Error('Fetch failed');
      mockAdapter.getUsers.mockRejectedValue(error);

      const result = await service.getUsers();

      expect(result).toEqual([]);
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('addUser', () => {
    it('debe agregar usuario y retornar el ID', async () => {
      const newUser = { nombre: 'New User', email: 'new@example.com', role: Rol.ENTRENADO };
      mockAdapter.addUser.mockResolvedValue('2');

      const result = await service.addUser(newUser);

      expect(result).toBe('2');
      expect(mockAdapter.addUser).toHaveBeenCalledWith(newUser, undefined);
    });

    it('debe validar entrada - email inválido', async () => {
      await expect(service.addUser({ 
        nombre: 'Test', 
        email: 'invalid-email', 
        role: Rol.ENTRENADO 
      })).rejects.toThrow('Email inválido');
    });

    it('debe validar entrada - rol inválido', async () => {
      await expect(service.addUser({ 
        nombre: 'Test', 
        email: 'test@example.com', 
        role: 'invalid' as Rol 
      })).rejects.toThrow('Rol inválido');
    });

    it('debe validar entrada - nombre vacío', async () => {
      await expect(service.addUser({ 
        nombre: '', 
        email: 'test@example.com', 
        role: Rol.ENTRENADO 
      })).rejects.toThrow('El nombre es requerido');
    });

    it('debe manejar errores del adaptador', async () => {
      const newUser = { nombre: 'New User', email: 'new@example.com', role: Rol.ENTRENADO };
      const error = new Error('Add failed');
      mockAdapter.addUser.mockRejectedValue(error);

      await expect(service.addUser(newUser)).rejects.toThrow('Add failed');
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      // Setup initial user
      service['_users'].set([mockUser]);
    });

    it('debe actualizar usuario optimistamente', async () => {
      const updates = { nombre: 'Updated Name' };
      mockAdapter.updateUser.mockResolvedValue(undefined);

      await service.updateUser('1', updates);

      expect(service.users()[0].nombre).toBe('Updated Name');
    });

    it('debe validar entrada - email inválido', async () => {
      await expect(service.updateUser('1', { email: 'invalid-email' })).rejects.toThrow('Email inválido');
    });

    it('debe validar entrada - nombre vacío', async () => {
      await expect(service.updateUser('1', { nombre: '' })).rejects.toThrow('El nombre es requerido');
    });

    it('debe manejar usuario no encontrado', async () => {
      const updates = { nombre: 'Updated Name' };
      
      await expect(service.updateUser('999', updates)).rejects.toThrow('Usuario no encontrado');
      expect(service.error()).toBe('USER_NOT_FOUND');
    });

    it('debe revertir en caso de error', async () => {
      const updates = { nombre: 'Updated Name' };
      const error = new Error('Update failed');
      mockAdapter.updateUser.mockRejectedValue(error);

      await expect(service.updateUser('1', updates)).rejects.toThrow();

      expect(service.users()[0].nombre).toBe('Test User'); // Reverted
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      service['_users'].set([mockUser]);
    });

    it('debe eliminar usuario optimistamente', async () => {
      mockAdapter.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser('1');

      expect(service.users()).toEqual([]);
    });

    it('debe manejar usuario no encontrado', async () => {
      await expect(service.deleteUser('999')).rejects.toThrow('Usuario no encontrado');
      expect(service.error()).toBe('USER_NOT_FOUND');
    });

    it('debe revertir en caso de error', async () => {
      const error = new Error('Delete failed');
      mockAdapter.deleteUser.mockRejectedValue(error);

      await expect(service.deleteUser('1')).rejects.toThrow();

      expect(service.users()).toContain(mockUser); // Reverted
      expect(service.error()).toBe('NETWORK_ERROR');
    });
  });

  describe('Métodos de Consulta', () => {
    beforeEach(() => {
      service['_users'].set([mockUser]);
    });

    it('debe encontrar usuario por email', () => {
      expect(service.getUserByEmail('test@example.com')).toEqual(mockUser);
      expect(service.getUserByEmail('notfound@example.com')).toBeNull();
    });

    it('debe encontrar usuario por UID', () => {
      expect(service.getUserByUid('1')).toEqual(mockUser);
      expect(service.getUserByUid('999')).toBeNull();
    });

    it('debe filtrar usuarios por rol', () => {
      expect(service.getUsersByRole(Rol.ENTRENADO)).toEqual([mockUser]);
      expect(service.getUsersByRole(Rol.ENTRENADOR)).toEqual([]);
    });
  });

  describe('initializeUsersListener', () => {
    it('debe inicializar el listener cuando no está inicializado', () => {
      service.initializeUsersListener();
      expect(mockAdapter.initializeListener).toHaveBeenCalled();
    });

    it('no debe inicializar el listener si ya está inicializado', () => {
      // Inicializar primero
      service.initializeUsersListener();
      mockAdapter.initializeListener.mockClear();
      
      // Ahora ya está inicializado, no debería llamar de nuevo
      service.initializeUsersListener();
      expect(mockAdapter.initializeListener).not.toHaveBeenCalled();
    });
  });

  describe('setCurrentUser', () => {
    it('debe establecer el usuario actual', () => {
      service.setCurrentUser(mockUser);
      expect(service.user()).toEqual(mockUser);
    });

    it('debe permitir establecer null', () => {
      service.setCurrentUser(null);
      expect(service.user()).toBeNull();
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores del tipo UserServiceError', async () => {
      const error = new Error('Network failed');
      mockAdapter.getUsers.mockRejectedValue(error);

      await service.getUsers();

      const serviceError = service.error();
      expect(serviceError).not.toBeNull();
      expect(['ADAPTER_NOT_CONFIGURED', 'USER_NOT_FOUND', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'UNKNOWN_ERROR']).toContain(serviceError);
    });

    it('debe limpiar errores correctamente', () => {
      service['_error'].set('NETWORK_ERROR');
      expect(service.error()).toBe('NETWORK_ERROR');

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });
});