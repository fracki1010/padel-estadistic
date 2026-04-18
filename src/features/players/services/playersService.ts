import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/firebase';
import { nowIso, toISOString } from '@/shared/utils/firestore';
import type { CreatePlayerInput, Player, UpdatePlayerInput } from '@/features/players/types/player';

const playersCollection = collection(db, 'players');

const mapPlayer = (id: string, data: Record<string, unknown>): Player => ({
  id,
  firstName: String(data.firstName ?? ''),
  lastName: String(data.lastName ?? ''),
  nickname: data.nickname ? String(data.nickname) : '',
  dominantHand: (data.dominantHand as Player['dominantHand']) ?? 'derecha',
  preferredSide: (data.preferredSide as Player['preferredSide']) ?? 'indistinto',
  active: Boolean(data.active ?? true),
  createdAt: toISOString(data.createdAt as string),
  updatedAt: toISOString(data.updatedAt as string)
});

export const playersService = {
  async getAll(activeOnly = false): Promise<Player[]> {
    const q = activeOnly
      ? query(playersCollection, where('active', '==', true), orderBy('lastName', 'asc'))
      : query(playersCollection, orderBy('lastName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => mapPlayer(item.id, item.data()));
  },

  async getById(id: string): Promise<Player | null> {
    const snapshot = await getDoc(doc(db, 'players', id));
    if (!snapshot.exists()) return null;
    return mapPlayer(snapshot.id, snapshot.data());
  },

  async create(input: CreatePlayerInput) {
    const now = nowIso();
    await addDoc(playersCollection, {
      ...input,
      createdAt: now,
      updatedAt: now
    });
  },

  async update(id: string, input: UpdatePlayerInput) {
    await updateDoc(doc(db, 'players', id), {
      ...input,
      updatedAt: nowIso()
    });
  },

  async deactivate(id: string) {
    await updateDoc(doc(db, 'players', id), {
      active: false,
      updatedAt: nowIso()
    });
  }
};
