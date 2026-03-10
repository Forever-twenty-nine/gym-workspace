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
import { Firestore, doc, getDoc, onSnapshot as onFirestoreSnapshot, Unsubscribe, setDoc } from 'firebase/firestore';
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
  private userSnapshotUnsubscribe?: Unsubscribe;

  constructor() {
    this.loadInitialSession();
    this.initializeAuthListener();
  }

  private loadInitialSession() {
    try {
      const savedUser = localStorage.getItem('gym_auth_user');
      if (savedUser) {
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
    // Escuchamos cambios de auth de forma directa y sincronizada
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      // Limpiar listener previo si existe
      if (this.userSnapshotUnsubscribe) {
        this.userSnapshotUnsubscribe();
      }

      if (firebaseUser) {
        try {
          // Primero una carga inicial rápida
          const userData = await this.getUserData(firebaseUser);
          this._currentUser.set(userData);
          this._isAuthenticated.set(true);
          this._isLoading.set(false);

          // Suscribirse a cambios en tiempo real del documento del usuario
          const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
          this.userSnapshotUnsubscribe = onFirestoreSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as User;
              const updatedUser = { ...data, uid: firebaseUser.uid };
              this._currentUser.set(updatedUser);
              localStorage.setItem('gym_auth_user', JSON.stringify(updatedUser));
            }
          });

        } catch (error) {
          console.error('🛡️ Auth: Error procesando sesión:', error);
          this._isLoading.set(false);
        }
      } else {
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
        // Obtenemos o creamos los datos en Firestore
        const user = await this.getUserData(cred.user, true);
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        return true;
      }
      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      if (isDevMode()) console.error('🛡️ Auth: Error en login con Google:', error);
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
        // Forzamos la creación del documento en Firestore inmediatamente
        const newUser = await this.getUserData(userCredential.user, true);
        this._currentUser.set(newUser);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
        return true;
      }
      this._isLoading.set(false);
      return false;
    } catch (error: any) {
      if (isDevMode()) console.error('🛡️ Auth: Error en registro:', error);
      this._error.set(this.getRegistrationErrorMessage(error));
      this._isLoading.set(false);
      return false;
    }
  }

  async logout(): Promise<void> {

    await signOut(this.auth);
  }

  private async getUserData(firebaseUser: FirebaseUser, createIfMissing = false): Promise<User> {
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
      // Si no existe, preparamos un objeto básico
      userData = {
        uid: firebaseUser.uid,
        nombre: firebaseUser.displayName || firebaseUser.email || 'Nuevo Usuario',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        role: this.inferRoleFromEmail(firebaseUser.email || ''),
        onboarded: false
      };

      // Si se nos pide crear el documento (en registro o primer login con Google)
      if (createIfMissing) {
        try {
          // Guardamos en Firestore
          await setDoc(userDocRef, userData);
          if (isDevMode()) console.log('🛡️ Auth: Nuevo perfil de usuario creado en Firestore');
        } catch (e) {
          console.error('🛡️ Auth: Error al crear perfil inicial en Firestore:', e);
        }
      }
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
      case 'auth/popup-closed-by-user': return 'La ventana de Google se cerró antes de completar';
      case 'auth/operation-not-allowed': return 'El inicio de sesión con Google no está habilitado en Firebase';
      case 'auth/unauthorized-domain': return 'Este dominio (localhost) no está autorizado en Firebase';
      default: return `Error al iniciar sesión: ${errorCode || error.message || 'Error desconocido'}`;
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
