import { AuthService, IAuthAdapter } from './auth.service';
import { User } from 'gym-library';

describe('AuthService', () => {
  let service: AuthService;
  let mockAdapter: jest.Mocked<IAuthAdapter>;
  const mockUser: User = { uid: '123', nombre: 'Test', email: 'test@example.com' };

  beforeEach(() => {
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

  it('debe iniciar sesión con Google correctamente', async () => {
    const result = await service.loginWithGoogle();
    expect(result).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('debe iniciar sesión con email y contraseña correctamente', async () => {
    const result = await service.loginWithEmail('test@example.com', '1234');
    expect(result).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('debe registrar usuario con email correctamente', async () => {
    const result = await service.registerWithEmail('test@example.com', '1234');
    expect(result).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('debe cerrar sesión correctamente', async () => {
    await service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('debe manejar errores en login', async () => {
    mockAdapter.loginWithGoogle.mockResolvedValue({ success: false, error: 'Error de login' });
    const result = await service.loginWithGoogle();
    expect(result).toBe(false);
    expect(service.error()).toBe('Error de login');
  });

  it('debe limpiar errores', () => {
    service['_error'].set('Error');
    service.clearError();
    expect(service.error()).toBeNull();
  });

  it('debe actualizar usuario actual', () => {
    service.updateCurrentUser(mockUser);
    expect(service.currentUser()).toEqual(mockUser);
  });

  it('debe refrescar autenticación', async () => {
    await service.refreshAuth();
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('debe lanzar error si el adapter no está configurado en loginWithGoogle', async () => {
    const serviceWithoutAdapter = new AuthService();
    await expect(serviceWithoutAdapter.loginWithGoogle()).rejects.toThrow('Auth adapter no configurado');
  });

  it('debe lanzar error si el adapter no está configurado en loginWithEmail', async () => {
    const serviceWithoutAdapter = new AuthService();
    await expect(serviceWithoutAdapter.loginWithEmail('test@example.com', '1234')).rejects.toThrow('Auth adapter no configurado');
  });

  it('debe lanzar error si el adapter no está configurado en registerWithEmail', async () => {
    const serviceWithoutAdapter = new AuthService();
    await expect(serviceWithoutAdapter.registerWithEmail('test@example.com', '1234')).rejects.toThrow('Auth adapter no configurado');
  });

  it('debe lanzar error si el adapter no está configurado en logout', async () => {
    const serviceWithoutAdapter = new AuthService();
    await expect(serviceWithoutAdapter.logout()).rejects.toThrow('Auth adapter no configurado');
  });

  it('debe manejar errores en register', async () => {
    mockAdapter.registerWithEmail.mockResolvedValue({ success: false, error: 'Error de registro' });
    const result = await service.registerWithEmail('test@example.com', '1234');
    expect(result).toBe(false);
    expect(service.error()).toBe('Error de registro');
  });

  it('debe manejar errores en login con email', async () => {
    mockAdapter.loginWithEmail.mockResolvedValue({ success: false, error: 'Credenciales inválidas' });
    const result = await service.loginWithEmail('test@example.com', 'wrong');
    expect(result).toBe(false);
    expect(service.error()).toBe('Credenciales inválidas');
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

  it('debe mantener el estado de carga durante operaciones', async () => {
    // Mock para que tarde un poco
    mockAdapter.loginWithGoogle.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, user: mockUser }), 10))
    );
    
    const loginPromise = service.loginWithGoogle();
    expect(service.isLoading()).toBe(true);
    
    await loginPromise;
    expect(service.isLoading()).toBe(false);
  });

  it('debe resetear error al iniciar nueva operación', async () => {
    // Primero setear un error
    mockAdapter.loginWithGoogle.mockResolvedValueOnce({ success: false, error: 'Error anterior' });
    await service.loginWithGoogle();
    expect(service.error()).toBe('Error anterior');
    
    // Luego hacer login exitoso
    mockAdapter.loginWithGoogle.mockResolvedValue({ success: true, user: mockUser });
    const result = await service.loginWithGoogle();
    expect(result).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('debe manejar refreshAuth cuando adapter falla', async () => {
    mockAdapter.getCurrentUser.mockRejectedValue(new Error('Auth check failed'));
    mockAdapter.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));
    
    await service.refreshAuth();
    // No debería cambiar el estado ya que no hay usuario inicial
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('debe permitir cambiar el adapter después de la inicialización', () => {
    const newMockAdapter = { ...mockAdapter };
    service.setAuthAdapter(newMockAdapter);
    // El servicio debería aceptar el nuevo adapter sin problemas
    expect(() => service.setAuthAdapter(newMockAdapter)).not.toThrow();
  });

  it('debe exponer signals internos para testing', () => {
    const internalSignals = service['_signals'];
    expect(internalSignals).toHaveProperty('_currentUser');
    expect(internalSignals).toHaveProperty('_isAuthenticated');
    expect(internalSignals).toHaveProperty('_isLoading');
    expect(internalSignals).toHaveProperty('_error');
  });
});
