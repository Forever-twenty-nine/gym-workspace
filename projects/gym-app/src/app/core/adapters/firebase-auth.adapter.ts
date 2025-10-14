import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { isDevMode } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, authState, User as FirebaseUser, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from 'gym-library';
import { Rol } from 'gym-library';
import { computed, Signal } from '@angular/core';

interface IAuthAdapter {
  loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  registerWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthAdapter implements IAuthAdapter {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(Injector);
  
  // Signal para el estado de autenticación (lazy initialization en contexto de inyección)
  private readonly authStateSignal: Signal<FirebaseUser | null | undefined> = runInInjectionContext(
    this.injector,
    () => toSignal(authState(this.auth))
  );

  // Computed signal para verificar autenticación (más reactivo)
  readonly isAuthenticatedSignal = computed(() => !!this.authStateSignal());

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser);
        return { success: true, user };
      }
      
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      // En desarrollo, mostrar errores de Firebase en consola para debugging
      if (isDevMode()) {
        console.error('Error en login con Google:', error.code || error.message);
      }
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser);
        return { success: true, user };
      }
      
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      // En desarrollo, mostrar errores de Firebase en consola para debugging
      if (isDevMode()) {
        console.error('Error en login con email:', error.code || error.message);
      }
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async registerWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
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

        return { success: true, user: newUser };
      }
      
      return { success: false, error: 'No se pudo crear la cuenta' };
    } catch (error: any) {
      // En desarrollo, mostrar errores de Firebase en consola para debugging
      if (isDevMode()) {
        console.error('Error en registro con email:', error.code || error.message);
      }
      return { success: false, error: this.getRegistrationErrorMessage(error) };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return runInInjectionContext(this.injector, async () => {
      const firebaseUser = this.authStateSignal();
      
      if (!firebaseUser) {
        return null;
      }
      
      return await this.getUserData(firebaseUser);
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return runInInjectionContext(this.injector, () => {
      return this.isAuthenticatedSignal();
    });
  }

  // Método privado reutilizable para obtener datos del usuario
  private async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    return runInInjectionContext(this.injector, async () => {
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
      
      // Asegurar que tenga rol
      if (!userData.role) {
        userData.role = this.inferRoleFromEmail(userData.email || '');
      }
      
      // Asegurar que el uid esté incluido
      return {
        ...userData,
        uid: firebaseUser.uid
      };
    });
  }

  private inferRoleFromEmail(email: string): Rol {
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes('trainer') || emailLower.includes('entrenador')) {
      return Rol.ENTRENADOR;
    } else if (emailLower.includes('gimnasio') || emailLower.includes('gym')) {
      return Rol.GIMNASIO;
    } else if (emailLower.includes('personal')) {
      return Rol.PERSONAL_TRAINER;
    }
    
    return Rol.ENTRENADO;
  }

  private getErrorMessage(error: any): string {
    const errorCode = error.code || '';
    
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email o contraseña incorrectos';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      case 'auth/popup-closed-by-user':
        return 'Inicio de sesión cancelado';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente';
      default:
        return error.message || 'Error al iniciar sesión';
    }
  }

  private getRegistrationErrorMessage(error: any): string {
    const errorCode = error.code || '';
    
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'El email no tiene un formato válido';
      case 'auth/operation-not-allowed':
        return 'Método de registro no habilitado';
      default:
        return error.message || 'Error al crear la cuenta';
    }
  }
}