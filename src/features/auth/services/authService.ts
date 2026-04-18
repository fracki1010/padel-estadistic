import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '@/firebase';
import { db } from '@/firebase';
import { nowIso } from '@/shared/utils/firestore';

const ensureUserProfile = async (user: User) => {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      role: snapshot.exists() ? snapshot.data().role ?? 'coach' : 'coach',
      createdAt: snapshot.exists() ? snapshot.data().createdAt ?? nowIso() : nowIso()
    },
    { merge: true }
  );
};

export const authService = {
  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(result.user);
    return result;
  },
  logout() {
    return signOut(auth);
  },
  observeAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserProfile(user);
      }
      callback(user);
    });
  }
};
