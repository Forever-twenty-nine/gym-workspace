import { Injectable, inject, signal } from '@angular/core';
import { AUTH } from './firebase.tokens';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private auth = inject(AUTH);
  private router = inject(Router);

  // Signals para el estado
  public user = signal<User | null>(null);
  public isAdmin = signal<boolean>(false);
  public isInitialized = signal<boolean>(false);

  constructor() {
    // Escuchar cambios de estado de autenticación
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verificar si tiene el claim admin
        const tokenResult = await firebaseUser.getIdTokenResult();
        if (tokenResult.claims['admin'] === true) {
          this.user.set(firebaseUser);
          this.isAdmin.set(true);
        } else {
          // Si no es admin, cerramos la sesión de admin
          await signOut(this.auth);
          this.user.set(null);
          this.isAdmin.set(false);
        }
      } else {
        this.user.set(null);
        this.isAdmin.set(false);
      }
      this.isInitialized.set(true);
    });
  }

  async login(email: string, pass: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(this.auth, email, pass);
    const tokenResult = await cred.user.getIdTokenResult();
    
    if (tokenResult.claims['admin'] !== true) {
      await signOut(this.auth);
      throw new Error('No tienes permisos de administrador.');
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
