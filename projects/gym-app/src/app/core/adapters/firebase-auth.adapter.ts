import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, authState, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from 'gym-library';
import { Rol } from 'gym-library';

interface IAuthAdapter {
  loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthAdapter implements IAuthAdapter {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  
  // Signal para el estado de autenticación (inicializado en contexto de inyección)
  private authStateSignal = toSignal(authState(this.auth));

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        // Consulta Firestore usando runInInjectionContext
        return await runInInjectionContext(this.injector, async () => {
          const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
          const userSnap = await getDoc(userDocRef);
          let newUser: User;
          
          if (userSnap.exists()) {
            newUser = userSnap.data() as User;
          } else {
            newUser = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || firebaseUser.email || 'Google User',
              email: firebaseUser.email || '',
              role: undefined,
              onboarded: false
            };
          }
          
          if (!newUser.role) {
            newUser.role = this.inferRoleFromEmail(newUser.email || '');
          }
          
          return { success: true, user: newUser };
        });
      }
      
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        // Consulta Firestore usando runInInjectionContext
        return await runInInjectionContext(this.injector, async () => {
          const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
          const userSnap = await getDoc(userDocRef);
          let newUser: User;
          
          if (userSnap.exists()) {
            newUser = userSnap.data() as User;
          } else {
            newUser = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || firebaseUser.email || 'Email User',
              email: firebaseUser.email || '',
              role: undefined,
              onboarded: false
            };
          }
          
          if (!newUser.role) {
            newUser.role = this.inferRoleFromEmail(newUser.email || '');
          }
          
          return { success: true, user: newUser };
        });
      }
      
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = this.authStateSignal();
    
    if (!firebaseUser) {
      return null;
    }
    
    // Consulta Firestore usando runInInjectionContext
    return await runInInjectionContext(this.injector, async () => {
      const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as User;
      }
      
      return null;
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.authStateSignal();
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
}