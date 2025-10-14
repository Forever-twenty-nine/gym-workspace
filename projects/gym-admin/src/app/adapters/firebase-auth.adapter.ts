import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  authState,
  onAuthStateChanged,
  updateProfile,
  UserCredential,
  User as FirebaseUser
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed, Signal } from '@angular/core';
import { User, Rol, Entrenado, Objetivo } from 'gym-library';

interface IAuthAdapter {
  createUserWithEmailAndPassword(email: string, password: string, userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
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

  async createUserWithEmailAndPassword(
    email: string, 
    password: string, 
    userData: Partial<User>
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      return await runInInjectionContext(this.injector, async () => {
        // Crear usuario en Firebase Auth
        const userCredential: UserCredential = await createUserWithEmailAndPassword(
          this.auth, 
          email, 
          password
        );
        
        const firebaseUser = userCredential.user;
        
        if (firebaseUser) {
          // Actualizar perfil de Firebase Auth con el nombre
          if (userData.nombre) {
            await updateProfile(firebaseUser, {
              displayName: userData.nombre
            });
          }

          // Crear objeto User mínimo - solo datos básicos sin inferencias
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            emailVerified: firebaseUser.emailVerified
          };

          // Solo agregar campos que estén explícitamente definidos en userData
          if (userData.nombre !== undefined) {
            newUser.nombre = userData.nombre;
          }
          if (userData.role !== undefined) {
            newUser.role = userData.role;
          }
          if (userData.entrenadorId !== undefined) {
            newUser.entrenadorId = userData.entrenadorId;
          }
          if (userData.gimnasioId !== undefined) {
            newUser.gimnasioId = userData.gimnasioId;
          }
          if (userData.plan !== undefined) {
            newUser.plan = userData.plan;
          }
          if ((userData as any).entrenadoId !== undefined) {
            (newUser as any).entrenadoId = (userData as any).entrenadoId;
          }
          if (userData.onboarded !== undefined) {
            newUser.onboarded = userData.onboarded;
          }

          // No crear documentos automáticamente al registrar usuario
          // Los documentos específicos (cliente, gimnasio, entrenador) se crearán al editar el rol

          // Guardar datos adicionales en Firestore
          const userDocRef = doc(this.firestore, 'usuarios', firebaseUser.uid);
          await setDoc(userDocRef, newUser);

          return { success: true, user: newUser };
        }
        
        return { success: false, error: 'No se pudo crear el usuario en Firebase Auth' };
      });
    } catch (error: any) {
      console.error('❌ FirebaseAuthAdapter: Error creando usuario:', error.code || error.message);
      
      // Si el usuario ya existe, informar al administrador
      if (error.code === 'auth/email-already-in-use') {
        return { 
          success: false, 
          error: 'Este email ya está registrado. El usuario debe iniciar sesión primero desde la app móvil antes de poder ser administrado desde aquí.' 
        };
      }
      
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      return await runInInjectionContext(this.injector, async () => {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        const firebaseUser = cred.user;
        
        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          return { success: true, user };
        }
        
        return { success: false, error: 'No se pudo obtener información del usuario' };
      });
    } catch (error: any) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async logout(): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      await signOut(this.auth);
    });
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
        // Si no existe documento en Firestore, devolver usuario mínimo
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified
        };
      }
      
      // Asegurar que el uid esté incluido
      return {
        ...userData,
        uid: firebaseUser.uid
      };
    });
  }

  /**
   * Infiere el nombre basado en el email
   */
  private inferNameFromEmail(email: string): string {
    // Tomar la parte antes del @ y convertir a formato legible
    const localPart = email.split('@')[0];
    return localPart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Infiere el rol basado en el email
   */
  private inferRoleFromEmail(email: string): Rol {
    if (email.includes('entrenador') || email.includes('trainer')) return Rol.ENTRENADOR;
    if (email.includes('gimnasio') || email.includes('gym')) return Rol.GIMNASIO;
    if (email.includes('personal')) return Rol.PERSONAL_TRAINER;
    return Rol.ENTRENADO;
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
}