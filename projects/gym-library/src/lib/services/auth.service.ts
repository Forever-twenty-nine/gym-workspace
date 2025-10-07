import { Injectable, signal, WritableSignal, Signal } from '@angular/core';
import { User } from '../models/user.model';

export interface IAuthAdapter {
  loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  private authAdapter?: IAuthAdapter;

  constructor() {
    // La inicialización se hará cuando se configure el adaptador
  }

  /**
   * Configura el adaptador de autenticación
   */
  setAuthAdapter(adapter: IAuthAdapter): void {
    this.authAdapter = adapter;
    // No llamar checkCurrentUser automáticamente para evitar problemas con contextos de inyección
    // Debe ser llamado explícitamente con refreshAuth() cuando sea necesario
  }

  /**
   * Signal del usuario actual
   */
  get currentUser(): Signal<User | null> {
    return this._currentUser.asReadonly();
  }

  /**
   * Signal del estado de autenticación
   */
  get isAuthenticated(): Signal<boolean> {
    return this._isAuthenticated.asReadonly();
  }

  /**
   * Signal del estado de carga
   */
  get isLoading(): Signal<boolean> {
    return this._isLoading.asReadonly();
  }

  /**
   * Signal de errores
   */
  get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  /**
   * Inicia sesión con Google
   */
  async loginWithGoogle(): Promise<boolean> {
    if (!this.authAdapter) {
      throw new Error('Auth adapter no configurado');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.authAdapter.loginWithGoogle();
      
      if (result.success && result.user) {
        this._currentUser.set(result.user);
        this._isAuthenticated.set(true);
        return true;
      } else {
        this._error.set(result.error || 'Error desconocido en login con Google');
        return false;
      }
    } catch (error: any) {
      this._error.set(error.message || 'Error desconocido');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async loginWithEmail(email: string, password: string): Promise<boolean> {
    if (!this.authAdapter) {
      throw new Error('Auth adapter no configurado');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.authAdapter.loginWithEmail(email, password);
      
      if (result.success && result.user) {
        this._currentUser.set(result.user);
        this._isAuthenticated.set(true);
        return true;
      } else {
        this._error.set(result.error || 'Error desconocido en login con email');
        return false;
      }
    } catch (error: any) {
      this._error.set(error.message || 'Error desconocido');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    if (!this.authAdapter) {
      throw new Error('Auth adapter no configurado');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.authAdapter.logout();
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    } catch (error: any) {
      this._error.set(error.message || 'Error desconocido en logout');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Verifica el usuario actual
   */
  private async checkCurrentUser(): Promise<void> {
    if (!this.authAdapter) return;

    this._isLoading.set(true);

    try {
      const user = await this.authAdapter.getCurrentUser();
      const isAuth = await this.authAdapter.isAuthenticated();
      
      this._currentUser.set(user);
      this._isAuthenticated.set(isAuth);
    } catch (error: any) {
      console.warn('Error verificando usuario actual:', error);
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Actualiza el usuario actual (útil para cambios de perfil)
   */
  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  /**
   * Limpia errores
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Refresca el estado de autenticación
   */
  async refreshAuth(): Promise<void> {
    await this.checkCurrentUser();
  }
}