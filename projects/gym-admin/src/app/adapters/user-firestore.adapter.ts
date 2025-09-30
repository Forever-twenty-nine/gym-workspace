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
import { User } from 'gym-library';

interface IUserFirestoreAdapter {
  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'uid'>): Promise<string>;
  updateUser(uid: string, userData: Partial<User>): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class UserFirestoreAdapter implements IUserFirestoreAdapter {
  private readonly COLLECTION_NAME = 'usuarios';
  private firestore = inject(Firestore);

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

  async addUser(user: Omit<User, 'uid'>): Promise<string> {
    const usersCol = collection(this.firestore, this.COLLECTION_NAME);
    const docRef = await addDoc(usersCol, user);
    return docRef.id;
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