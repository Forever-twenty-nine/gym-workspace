import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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

  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      const firebaseUser = cred.user;
      
      if (firebaseUser) {
        // 🔥 Consulta Firestore para obtener el usuario real
        const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
        const userSnap = await getDoc(userDocRef);
        let newUser: User;
        
        if (userSnap.exists()) {
          newUser = userSnap.data() as User;
        } else {
          // Si no existe, crea usuario básico
          newUser = {
            uid: firebaseUser.uid,
            nombre: firebaseUser.displayName || firebaseUser.email || 'Google User',
            email: firebaseUser.email || '',
            role: undefined,
            onboarded: false
          };
        }
        
        // Inferir el rol si no está definido
        if (!newUser.role) {
          newUser.role = this.inferRoleFromEmail(newUser.email || '');
        }
        
        return { success: true, user: newUser };
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
            onboarded: false
          };
        }
        
        return { success: true, user };
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
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
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
    
    return Rol.CLIENTE;
  }
}