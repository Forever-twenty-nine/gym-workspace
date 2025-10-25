import { AuthService, IAuthAdapter } from './auth.service';
import { User } from '../models/user.model';

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
});
