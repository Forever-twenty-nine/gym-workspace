import { Injectable, signal, Signal, inject, Injector, runInInjectionContext, isDevMode } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { User, Rol } from 'gym-library';
import { AUTH, FIRESTORE } from '../firebase.tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(AUTH);
  private readonly firestore = inject(FIRESTORE);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  constructor() {
    this.loadInitialSession();
    this.initializeAuthListener();
  }

  private loadInitialSession() {
    try {
      const savedUser = localStorage.getItem('gym_auth_user');
      if (savedUser) {
        console.log('🛡️ Auth: Cargando sesión inicial de localStorage...');
        const user = JSON.parse(savedUser) as User;
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        // Dejamos _isLoading como true para que Firebase termine su proceso real
      }
    } catch (e) {
      console.warn('🛡️ Auth: Error cargando sesión inicial:', e);
    }
  }

  private initializeAuthListener() {
    console.log('🛡️ Auth: Inicializando listener de Firebase...');
    // Escuchamos cambios de auth de forma directa y sincronizada
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      console.log('🛡️ Auth: Cambio en Firebase User:', firebaseUser ? firebaseUser.email : 'NULL');
      if (firebaseUser) {
        try {
          // Cargamos los datos ANTES de emitir que no estamos cargando
          const userData = await this.getUserData(firebaseUser);
          console.log('🛡️ Auth: Perfil cargado de Firestore para:', userData.email);
          this._currentUser.set(userData);
          this._isAuthenticated.set(true);

          // Guardamos en local para restaurar rápido en recargas
          localStorage.setItem('gym_auth_user', JSON.stringify(userData));

          this._isLoading.set(false);
        } catch (error) {
          console.error('🛡️ Auth: Error cargando perfil:', error);
          this._isLoading.set(false);
          // Si hay error autenticado pero no hay perfil, bajamos el flag por ahora
        }
      } else {
        console.warn('🛡️ Auth: Sesión de Firebase terminada (NULL)');
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
        this._isLoading.set(false);
        localStorage.removeItem('gym_auth_user');
      }
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
   * Signal del estado de carga (fundamental para los guards)
   */
  get isLoading(): Signal<boolean> {
    return this._isLoading.asReadonly();
  }

  get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  async loginWithEmail(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      if (cred.user) {
        // Forzamos carga inmediata para que el router.navigate siguiente funcione
        const user = await this.getUserData(cred.user);
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        return true;
      }
      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      if (isDevMode()) console.error('Error en login con email:', error);
      this._error.set(this.getErrorMessage(error));
      this._isLoading.set(false);
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      if (cred.user) {
        const user = await this.getUserData(cred.user);
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        return true;
      }
      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      if (isDevMode()) console.error('Error en login con Google:', error);
      this._error.set(this.getErrorMessage(error));
      this._isLoading.set(false);
      return false;
    }
  }

  async registerWithEmail(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      if (userCredential.user) {
        const newUser: User = {
          uid: userCredential.user.uid,
          nombre: userCredential.user.displayName || userCredential.user.email || 'Usuario',
          email: userCredential.user.email || '',
          role: this.inferRoleFromEmail(email),
          onboarded: false
        };
        this._currentUser.set(newUser);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        return true;
      }
      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      if (isDevMode()) console.error('Error en registro:', error);
      this._error.set(this.getRegistrationErrorMessage(error));
      this._isLoading.set(false);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {

    await signOut(this.auth);
  }

  private async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
    const userSnap = await getDoc(userDocRef);

    let userData: User;
    if (userSnap.exists()) {
      userData = userSnap.data() as User;
      // Si Firestore no tiene foto pero Firebase sí, la usamos
      if (!userData.photoURL && firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }
    } else {
      userData = {
        uid: firebaseUser.uid,
        nombre: firebaseUser.displayName || firebaseUser.email || 'Usuario',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
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
      case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde';
      default: return 'Error al iniciar sesión';
    }
  }

  private getRegistrationErrorMessage(error: any): string {
    const errorCode = error.code || '';
    switch (errorCode) {
      case 'auth/email-already-in-use': return 'Este email ya está registrado';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email': return 'El email no tiene un formato válido';
      default: return 'Error al crear la cuenta';
    }
  }


  async refreshAuth(): Promise<void> {
    if (this.auth.currentUser) {
      const user = await this.getUserData(this.auth.currentUser);
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
    }
    this._isLoading.set(false);
  }
}
