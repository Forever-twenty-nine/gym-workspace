import { AuthService, IAuthAdapter } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService - Gestion de Autenticacion', () => {
  let service: AuthService;
  let mockAdapter: jest.Mocked<IAuthAdapter>;
  const mockUser: User = { uid: '123', nombre: 'Test', email: 'test@example.com' };

  beforeEach(() => {
    // Silenciar console.warn durante tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    service = new AuthService();
    mockAdapter = {
      loginWithGoogle: jest.fn(),
      loginWithEmail: jest.fn(),
      registerWithEmail: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      isAuthenticated: jest.fn(),
    };
    mockAdapter.loginWithGoogle.mockResolvedValue({ success: true, user: mockUser });
    mockAdapter.loginWithEmail.mockResolvedValue({ success: true, user: mockUser });
    mockAdapter.registerWithEmail.mockResolvedValue({ success: true, user: mockUser });
    mockAdapter.logout.mockResolvedValue(undefined);
    mockAdapter.getCurrentUser.mockResolvedValue(mockUser);
    mockAdapter.isAuthenticated.mockResolvedValue(true);
    service.setAuthAdapter(mockAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Inicializacion y Configuracion
  describe('Inicializacion y Configuracion', () => {
    describe('Configuracion del Adapter', () => {
      it('debe lanzar error si el adapter no esta configurado en loginWithGoogle', async () => {
        const serviceWithoutAdapter = new AuthService();
        await expect(serviceWithoutAdapter.loginWithGoogle()).rejects.toThrow('Auth adapter no configurado');
      });

      it('debe lanzar error si el adapter no esta configurado en loginWithEmail', async () => {
        const serviceWithoutAdapter = new AuthService();
        await expect(serviceWithoutAdapter.loginWithEmail('test@example.com', '1234')).rejects.toThrow('Auth adapter no configurado');
      });

      it('debe lanzar error si el adapter no esta configurado en registerWithEmail', async () => {
        const serviceWithoutAdapter = new AuthService();
        await expect(serviceWithoutAdapter.registerWithEmail('test@example.com', '1234')).rejects.toThrow('Auth adapter no configurado');
      });

      it('debe lanzar error si el adapter no esta configurado en logout', async () => {
        const serviceWithoutAdapter = new AuthService();
        await expect(serviceWithoutAdapter.logout()).rejects.toThrow('Auth adapter no configurado');
      });

      it('debe permitir cambiar el adapter despues de la inicializacion', () => {
        const newMockAdapter = { ...mockAdapter };
        service.setAuthAdapter(newMockAdapter);
        expect(() => service.setAuthAdapter(newMockAdapter)).not.toThrow();
      });
    });
  });

  // Operaciones de Autenticacion
  describe('Operaciones de Autenticacion', () => {
    describe('Inicio de Sesion', () => {
      it('debe iniciar sesion con Google correctamente', async () => {
        const result = await service.loginWithGoogle();
        expect(result).toBe(true);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      it('debe iniciar sesion con email y contrasena correctamente', async () => {
        const result = await service.loginWithEmail('test@example.com', '1234');
        expect(result).toBe(true);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });
    });

    describe('Registro de Usuario', () => {
      it('debe registrar usuario con email correctamente', async () => {
        const result = await service.registerWithEmail('test@example.com', '1234');
        expect(result).toBe(true);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });
    });

    describe('Cierre de Sesion', () => {
      it('debe cerrar sesion correctamente', async () => {
        await service.logout();
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });
    });

    describe('Refresco de Autenticacion', () => {
      it('debe refrescar autenticacion', async () => {
        await service.refreshAuth();
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      it('debe manejar refreshAuth cuando adapter falla', async () => {
        mockAdapter.getCurrentUser.mockRejectedValue(new Error('Auth check failed'));
        mockAdapter.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));

        await service.refreshAuth();
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });
    });
  });

  // Gestion de Estado
  describe('Gestion de Estado', () => {
    describe('Usuario Actual', () => {
      it('debe actualizar usuario actual', () => {
        service.updateCurrentUser(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
      });
    });

    describe('Estados de Carga', () => {
      it('debe mantener el estado de carga durante operaciones', async () => {
        mockAdapter.loginWithGoogle.mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({ success: true, user: mockUser }), 10))
        );

        const loginPromise = service.loginWithGoogle();
        expect(service.isLoading()).toBe(true);

        await loginPromise;
        expect(service.isLoading()).toBe(false);
      });

      it('debe resetear error al iniciar nueva operacion', async () => {
        mockAdapter.loginWithGoogle.mockResolvedValueOnce({ success: false, error: 'Error anterior' });
        await service.loginWithGoogle();
        expect(service.error()).toBe('Error anterior');

        mockAdapter.loginWithGoogle.mockResolvedValue({ success: true, user: mockUser });
        const result = await service.loginWithGoogle();
        expect(result).toBe(true);
        expect(service.error()).toBeNull();
      });
    });

    describe('Testing Interno', () => {
      it('debe exponer signals internos para testing', () => {
        const internalSignals = service['_signals'];
        expect(internalSignals).toHaveProperty('_currentUser');
        expect(internalSignals).toHaveProperty('_isAuthenticated');
        expect(internalSignals).toHaveProperty('_isLoading');
        expect(internalSignals).toHaveProperty('_error');
      });
    });
  });

  // Manejo de Errores
  describe('Manejo de Errores', () => {
    it('debe manejar errores en login', async () => {
      mockAdapter.loginWithGoogle.mockResolvedValue({ success: false, error: 'Error de login' });
      const result = await service.loginWithGoogle();
      expect(result).toBe(false);
      expect(service.error()).toBe('Error de login');
    });

    it('debe manejar errores en register', async () => {
      mockAdapter.registerWithEmail.mockResolvedValue({ success: false, error: 'Error de registro' });
      const result = await service.registerWithEmail('test@example.com', '1234');
      expect(result).toBe(false);
      expect(service.error()).toBe('Error de registro');
    });

    it('debe manejar errores en login con email', async () => {
      mockAdapter.loginWithEmail.mockResolvedValue({ success: false, error: 'Credenciales invalidas' });
      const result = await service.loginWithEmail('test@example.com', 'wrong');
      expect(result).toBe(false);
      expect(service.error()).toBe('Credenciales invalidas');
    });

    it('debe manejar excepciones en loginWithGoogle', async () => {
      mockAdapter.loginWithGoogle.mockRejectedValue(new Error('Network error'));
      const result = await service.loginWithGoogle();
      expect(result).toBe(false);
      expect(service.error()).toBe('Network error');
    });

    it('debe manejar excepciones en registerWithEmail', async () => {
      mockAdapter.registerWithEmail.mockRejectedValue(new Error('Database error'));
      const result = await service.registerWithEmail('test@example.com', '1234');
      expect(result).toBe(false);
      expect(service.error()).toBe('Database error');
    });

    it('debe manejar excepciones en logout', async () => {
      mockAdapter.logout.mockRejectedValue(new Error('Logout failed'));
      await expect(service.logout()).rejects.toThrow('Logout failed');
      expect(service.error()).toBe('Logout failed');
    });

    it('debe limpiar errores', () => {
      service['_error'].set('Error');
      service.clearError();
      expect(service.error()).toBeNull();
    });
  });
});
