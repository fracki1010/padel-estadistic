import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '@/firebase';
import { db } from '@/firebase';
import { nowIso } from '@/shared/utils/firestore';
import { FirebaseError } from 'firebase/app';

const ensureUserProfile = async (user: User) => {
  // Upsert idempotente sin lectura previa:
  // evita fallos frecuentes de getDoc cuando el cliente está offline.
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      role: 'coach',
      updatedAt: nowIso(),
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : nowIso()
    },
    { merge: true }
  );
};

const syncUserProfileBestEffort = (user: User) => {
  // Never block auth flow due to profile sync in Firestore.
  void ensureUserProfile(user).catch((error) => {
    if (error instanceof FirebaseError && (error.code === 'firestore/unavailable' || error.message.includes('client is offline'))) {
      // Esperable si la red se corta o Firestore no es alcanzable.
      console.warn('User profile sync skipped: Firestore offline/unavailable.');
      return;
    }
    console.error('User profile sync failed:', error);
  });
};

export const authService = {
  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    syncUserProfileBestEffort(result.user);
    return result;
  },
  logout() {
    return signOut(auth);
  },
  observeAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
      if (user) {
        syncUserProfileBestEffort(user);
      }
    });
  }
};
