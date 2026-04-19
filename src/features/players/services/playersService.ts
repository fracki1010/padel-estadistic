import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/firebase';
import { nowIso, toISOString, withTimeout } from '@/shared/utils/firestore';
import type { CreatePlayerInput, Player, UpdatePlayerInput } from '@/features/players/types/player';

const playersCollection = collection(db, 'players');
const WRITE_TIMEOUT_MS = 10000;

const assertOnline = () => {
  if (!navigator.onLine) {
    throw new Error('Sin conexión a internet. Revisa tu red e intenta nuevamente.');
  }
};

const mapPlayer = (id: string, data: Record<string, unknown>): Player => ({
  id,
  firstName: String(data.firstName ?? ''),
  lastName: String(data.lastName ?? ''),
  nickname: data.nickname ? String(data.nickname) : '',
  dominantHand: (data.dominantHand as Player['dominantHand']) ?? 'derecha',
  preferredSide: (data.preferredSide as Player['preferredSide']) ?? 'indistinto',
  active: Boolean(data.active ?? true),
  anonymous: Boolean(data.anonymous ?? false),
  createdAt: toISOString(data.createdAt as string),
  updatedAt: toISOString(data.updatedAt as string)
});

export const playersService = {
  async getAll(activeOnly = false): Promise<Player[]> {
    // Avoid composite-index dependency in development by sorting client-side.
    const q = activeOnly
      ? query(playersCollection, where('active', '==', true))
      : query(playersCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((item) => mapPlayer(item.id, item.data()))
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  },

  async getById(id: string): Promise<Player | null> {
    const snapshot = await getDoc(doc(db, 'players', id));
    if (!snapshot.exists()) return null;
    return mapPlayer(snapshot.id, snapshot.data());
  },

  async create(input: CreatePlayerInput) {
    assertOnline();
    const now = nowIso();
    await withTimeout(
      addDoc(playersCollection, {
        ...input,
        createdAt: now,
        updatedAt: now
      }),
      WRITE_TIMEOUT_MS
    );
  },

  async update(id: string, input: UpdatePlayerInput) {
    assertOnline();
    await withTimeout(
      updateDoc(doc(db, 'players', id), {
        ...input,
        updatedAt: nowIso()
      }),
      WRITE_TIMEOUT_MS
    );
  },

  async deactivate(id: string) {
    assertOnline();
    await withTimeout(
      updateDoc(doc(db, 'players', id), {
        active: false,
        updatedAt: nowIso()
      }),
      WRITE_TIMEOUT_MS
    );
  }
};
