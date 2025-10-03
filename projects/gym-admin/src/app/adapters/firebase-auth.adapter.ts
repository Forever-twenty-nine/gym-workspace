import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  UserCredential
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { User, Rol } from 'gym-library';

interface IAuthAdapter {
  createUserWithEmailAndPassword(email: string, password: string, userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthAdapter implements IAuthAdapter {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /**
   * Crea un nuevo usuario con email y contraseña en Firebase Auth
   * y guarda los datos adicionales en Firestore
   */
  async createUserWithEmailAndPassword(
    email: string, 
    password: string, 
    userData: Partial<User>
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
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

        // Crear objeto User completo
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          emailVerified: firebaseUser.emailVerified,
          nombre: userData.nombre || firebaseUser.displayName || this.inferNameFromEmail(email),
          role: userData.role || this.inferRoleFromEmail(email),
          entrenadorId: userData.entrenadorId,
          gimnasioId: userData.gimnasioId,
          onboarded: userData.onboarded || false,
          plan: userData.plan
        };

        // Guardar datos adicionales en Firestore
        const userDocRef = doc(this.firestore, 'usuarios', firebaseUser.uid);
        await setDoc(userDocRef, newUser);

        return { success: true, user: newUser };
      }
      
      return { success: false, error: 'No se pudo crear el usuario en Firebase Auth' };
    } catch (error: any) {
      console.error('❌ FirebaseAuthAdapter: Error creando usuario:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
        const userSnap = await getDoc(userDocRef);
        let user: User;
        
        if (userSnap.exists()) {
          user = userSnap.data() as User;
        } else {
          user = {
            uid: firebaseUser.uid,
            nombre: firebaseUser.displayName || firebaseUser.email || 'Usuario',
            email: firebaseUser.email || '',
            role: this.inferRoleFromEmail(firebaseUser.email || ''),
            emailVerified: firebaseUser.emailVerified,
            onboarded: false
          };
        }
        
        return { success: true, user };
      }
      
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, async (firebaseUser) => {
        unsubscribe();
        
        if (firebaseUser) {
          try {
            const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
              resolve(userSnap.data() as User);
            } else {
              resolve({
                uid: firebaseUser.uid,
                nombre: firebaseUser.displayName || firebaseUser.email || 'Usuario',
                email: firebaseUser.email || '',
                role: this.inferRoleFromEmail(firebaseUser.email || ''),
                emailVerified: firebaseUser.emailVerified,
                onboarded: false
              });
            }
          } catch (error) {
            console.error('Error obteniendo usuario:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
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
    return Rol.CLIENTE;
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