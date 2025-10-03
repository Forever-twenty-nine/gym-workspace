import { Injectable, inject } from '@angular/core';
import { 
  Firestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  onSnapshot,
  setDoc,
  QuerySnapshot
} from '@angular/fire/firestore';
import { Auth, deleteUser as deleteAuthUser } from '@angular/fire/auth';
import { User } from 'gym-library';
import { FirebaseAuthAdapter } from './firebase-auth.adapter';

interface IUserFirestoreAdapter {
  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'uid'>, password?: string): Promise<string>;
  updateUser(uid: string, userData: Partial<User>): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class UserFirestoreAdapter implements IUserFirestoreAdapter {
  private readonly COLLECTION_NAME = 'usuarios';
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private firebaseAuthAdapter = inject(FirebaseAuthAdapter);

  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void {
    const usersCol = collection(this.firestore, this.COLLECTION_NAME);
    
    onSnapshot(usersCol, (snapshot: QuerySnapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as User));
      
      onUpdate(usersList);
    }, (error) => {
      onError(error.message);
    });
  }

  async getUsers(): Promise<User[]> {
    const usersCol = collection(this.firestore, this.COLLECTION_NAME);
    const snapshot = await getDocs(usersCol);
    
    const usersList = snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as User));
    
    return usersList;
  }

  async addUser(user: Omit<User, 'uid'>, password?: string): Promise<string> {
    // Si se proporciona un email y password, crear usuario con Firebase Auth
    if (user.email && password) {
      const authResult = await this.firebaseAuthAdapter.createUserWithEmailAndPassword(
        user.email,
        password,
        user
      );
      
      if (authResult.success && authResult.user) {
        return authResult.user.uid;
      } else {
        throw new Error(authResult.error || 'Error creando usuario con Firebase Auth');
      }
    } else {
      // Crear usuario solo en Firestore (comportamiento anterior)
      const usersCol = collection(this.firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(usersCol, user);
      return docRef.id;
    }
  }

  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    const userDoc = doc(this.firestore, this.COLLECTION_NAME, uid);
    await setDoc(userDoc, userData, { merge: true });
  }

  async deleteUser(uid: string): Promise<void> {
    const userDoc = doc(this.firestore, this.COLLECTION_NAME, uid);
    await deleteDoc(userDoc);
  }
}