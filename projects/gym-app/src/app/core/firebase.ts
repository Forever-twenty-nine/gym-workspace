import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { environment } from '../../environments/environment';

const firebaseApp = initializeApp(environment.firebase);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

if ((environment as any).useEmulator) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
auth.useDeviceLanguage();

export default firebaseApp;
