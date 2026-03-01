import { Injectable, signal, WritableSignal, Signal, inject, Injector, runInInjectionContext, computed, isDevMode } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  authState,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { User, Rol } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Signal para el estado de autenticación de Firebase
  private readonly authStateSignal: Signal<FirebaseUser | null | undefined> = toSignal(authState(this.auth));

  constructor() {
    // Monitorear cambios en el estado de autenticación
    this.setupAuthSync();
  }

  /**
   * Ejecuta el callback en el contexto correcto (zona o inyección)
   */
  private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
    if (this.zoneRunner) {
      return this.zoneRunner.run(callback);
    }
    return runInInjectionContext(this.injector, callback as any);
  }

  private setupAuthSync() {
    // Sincronizar el estado de auth de Firebase con nuestros signals internos
    computed(() => {
      const firebaseUser = this.authStateSignal();
      if (firebaseUser === undefined) return; // Cargando inicial

      this.runInZone(async () => {
        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
        } else {
          this._currentUser.set(null);
          this._isAuthenticated.set(false);
        }
      });
    });
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
    this._isLoading.set(true);
    this._error.set(null);
    try {
      return await this.runInZone(async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(this.auth, provider);
        const firebaseUser = cred.user;

        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          return true;
        }

        this._error.set('No se pudo obtener información del usuario');
        return false;
      });
    } catch (error: any) {
      if (isDevMode()) console.error('Error en login con Google:', error);
      this._error.set(this.getErrorMessage(error));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async loginWithEmail(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      return await this.runInZone(async () => {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        const firebaseUser = cred.user;

        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          return true;
        }

        this._error.set('No se pudo obtener información del usuario');
        return false;
      });
    } catch (error: any) {
      if (isDevMode()) console.error('Error en login con email:', error);
      this._error.set(this.getErrorMessage(error));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  async registerWithEmail(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      return await this.runInZone(async () => {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
          const newUser: User = {
            uid: firebaseUser.uid,
            nombre: firebaseUser.displayName || firebaseUser.email || 'Usuario',
            email: firebaseUser.email || '',
            role: this.inferRoleFromEmail(email),
            onboarded: false
          };
          this._currentUser.set(newUser);
          this._isAuthenticated.set(true);
          return true;
        }

        this._error.set('No se pudo crear la cuenta');
        return false;
      });
    } catch (error: any) {
      if (isDevMode()) console.error('Error en registro:', error);
      this._error.set(this.getRegistrationErrorMessage(error));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      await this.runInZone(async () => {
        await signOut(this.auth);
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
      });
    } catch (error: any) {
      this._error.set('Error al cerrar sesión');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  private async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
    const userSnap = await getDoc(userDocRef);

    let userData: User;

    if (userSnap.exists()) {
      userData = userSnap.data() as User;
    } else {
      userData = {
        uid: firebaseUser.uid,
        nombre: firebaseUser.displayName || firebaseUser.email || 'Usuario',
        email: firebaseUser.email || '',
        role: undefined,
        onboarded: false
      };
    }

    if (!userData.role) {
      userData.role = this.inferRoleFromEmail(userData.email || '');
    }

    return { ...userData, uid: firebaseUser.uid };
  }

  private inferRoleFromEmail(email: string): Rol {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('trainer') || emailLower.includes('entrenador')) return Rol.ENTRENADOR;
    if (emailLower.includes('gimnasio') || emailLower.includes('gym')) return Rol.GIMNASIO;
    if (emailLower.includes('personal')) return Rol.PERSONAL_TRAINER;
    return Rol.ENTRENADO;
  }

  private getErrorMessage(error: any): string {
    const errorCode = error.code || '';
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password': return 'Email o contraseña incorrectos';
      case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada';
      case 'auth/too-many-requests': return 'Demasiados intentos fallidos. Intenta más tarde';
      case 'auth/network-request-failed': return 'Error de conexión. Verifica tu internet';
      case 'auth/popup-closed-by-user': return 'Inicio de sesión cancelado';
      case 'auth/popup-blocked': return 'El navegador bloqueó la ventana emergente';
      default: return error.message || 'Error al iniciar sesión';
    }
  }

  private getRegistrationErrorMessage(error: any): string {
    const errorCode = error.code || '';
    switch (errorCode) {
      case 'auth/email-already-in-use': return 'Este email ya está registrado';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email': return 'El email no tiene un formato válido';
      case 'auth/operation-not-allowed': return 'Método de registro no habilitado';
      default: return error.message || 'Error al crear la cuenta';
    }
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  clearError(): void {
    this._error.set(null);
  }

  async refreshAuth(): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    if (firebaseUser) {
      const user = await this.getUserData(firebaseUser);
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
    } else {
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    }
  }
}
