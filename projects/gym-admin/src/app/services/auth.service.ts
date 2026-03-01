import { Injectable, signal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { User, Rol } from 'gym-library';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  authState,
  updateProfile,
  UserCredential,
  User as FirebaseUser
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private readonly firebaseUser: Signal<FirebaseUser | null | undefined> = toSignal(authState(this.auth));

  constructor() {
    // Inicializar el estado de autenticación basado en el usuario de Firebase
    this.refreshAuth();
  }

  /**
   * Signal del usuario actual (datos de Firestore)
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
   * Ejecuta el callback en el contexto correcto (zona o inyección)
   */
  private runInZone<T>(callback: () => Promise<T>): Promise<T> {
    if (this.zoneRunner) {
      return this.zoneRunner.run(callback);
    }
    return runInInjectionContext(this.injector, callback);
  }

  /**
   * Maneja la lógica de autenticación común
   */
  private async handleAuth(
    action: () => Promise<{ success: boolean; user?: User; error?: string }>,
    errorMsg: string
  ): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const result = await this.runInZone(action);
      if (result.success && result.user) {
        this._currentUser.set(result.user);
        this._isAuthenticated.set(true);
        return true;
      } else {
        this._error.set(result.error || errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ AuthService: ${errorMsg}:`, error.code || error.message);
      this._error.set(this.getErrorMessage(error) || errorMsg);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Inicia sesión con Google
   */
  async loginWithGoogle(): Promise<boolean> {
    return this.handleAuth(async () => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      const firebaseUser = cred.user;

      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser);
        return { success: true, user };
      }
      return { success: false, error: 'No se pudo obtener información del usuario' };
    }, 'Error en login con Google');
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async loginWithEmail(email: string, password: string): Promise<boolean> {
    return this.handleAuth(async () => {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser);
        return { success: true, user };
      }
      return { success: false, error: 'No se pudo iniciar sesión' };
    }, 'Error en login con email');
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  async registerWithEmail(email: string, password: string): Promise<boolean> {
    return this.handleAuth(async () => {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          emailVerified: firebaseUser.emailVerified
        };

        const userDocRef = doc(this.firestore, 'usuarios', firebaseUser.uid);
        await setDoc(userDocRef, newUser);

        return { success: true, user: newUser };
      }
      return { success: false, error: 'No se pudo crear el usuario' };
    }, 'Error en registro');
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      await this.runInZone(() => signOut(this.auth));
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Refresca el estado de autenticación
   */
  async refreshAuth(): Promise<void> {
    this._isLoading.set(true);
    try {
      const firebaseUser = this.auth.currentUser;
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser);
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      } else {
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
      }
    } catch (error) {
      console.warn('Error verificando usuario actual:', error);
      this._currentUser.set(null);
      this._isAuthenticated.set(false);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Obtiene datos del usuario desde Firestore
   */
  private async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
    const userSnap = await getDoc(userDocRef);

    let userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      emailVerified: firebaseUser.emailVerified
    };

    if (userSnap.exists()) {
      userData = { ...userData, ...(userSnap.data() as Partial<User>) };
    }

    return userData;
  }

  /**
   * Convierte errores de Firebase en mensajes legibles
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'El formato del email no es válido';
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      default:
        return error.message || 'Error desconocido';
    }
  }

  /**
   * Actualiza el usuario actual localmente
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
}
