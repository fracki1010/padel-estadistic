import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/firebase';
import { nowIso, toISOString } from '@/shared/utils/firestore';
import type { CreateMatchInput, Match, MatchFilters, UpdateMatchInput } from '@/features/matches/types/match';
import type { CreateMatchEventInput, MatchEvent } from '@/features/matches/types/matchEvent';

const matchesCollection = collection(db, 'matches');
const matchEventsCollection = collection(db, 'match_events');

const mapLiveState = (data: Record<string, unknown>): Match['liveState'] => {
  if (!data.liveState || typeof data.liveState !== 'object') return undefined;
  const liveState = data.liveState as Record<string, unknown>;
  return {
    setNumber: Number(liveState.setNumber ?? 1),
    gameNumber: Number(liveState.gameNumber ?? 1),
    pointNumber: Number(liveState.pointNumber ?? 1),
    gamesInSetA: Number(liveState.gamesInSetA ?? 0),
    gamesInSetB: Number(liveState.gamesInSetB ?? 0),
    currentServerPlayerId: liveState.currentServerPlayerId ? String(liveState.currentServerPlayerId) : null,
    updatedAt: toISOString(liveState.updatedAt as string)
  };
};

const mapMatch = (id: string, data: Record<string, unknown>): Match => ({
  id,
  date: String(data.date ?? ''),
  location: data.location ? String(data.location) : '',
  format: (data.format as Match['format']) ?? 'amistoso',
  teamA: (data.teamA as [string, string]) ?? ['', ''],
  teamB: (data.teamB as [string, string]) ?? ['', ''],
  notes: data.notes ? String(data.notes) : '',
  status: (data.status as Match['status']) ?? 'pendiente',
  setsWonTeamA: Number(data.setsWonTeamA ?? 0),
  setsWonTeamB: Number(data.setsWonTeamB ?? 0),
  winner: (data.winner as Match['winner']) ?? null,
  bestOf: (data.bestOf === 5 ? 5 : 3) as 3 | 5,
  deuce: (data.deuce === 'oro' ? 'oro' : 'ventaja') as 'oro' | 'ventaja',
  playerSides: data.playerSides ? (data.playerSides as Record<string, 'drive' | 'reves'>) : undefined,
  liveState: mapLiveState(data),
  createdAt: toISOString(data.createdAt as string),
  updatedAt: toISOString(data.updatedAt as string)
});

const mapMatchEvent = (id: string, data: Record<string, unknown>): MatchEvent => ({
  id,
  matchId: String(data.matchId ?? ''),
  timestamp: String(data.timestamp ?? nowIso()),
  setNumber: Number(data.setNumber ?? 1),
  gameNumber: Number(data.gameNumber ?? 1),
  pointNumber: Number(data.pointNumber ?? 1),
  winningTeam: (data.winningTeam as MatchEvent['winningTeam']) ?? 'equipoA',
  playerId: String(data.playerId ?? ''),
  eventType: (data.eventType as MatchEvent['eventType']) ?? 'winner',
  shotType: (data.shotType as MatchEvent['shotType']) ?? 'drive',
  zone: (data.zone as MatchEvent['zone']) ?? null,
  courtZone: data.courtZone ? (data.courtZone as MatchEvent['courtZone']) : undefined,
  toZone: data.toZone ? (data.toZone as MatchEvent['toZone']) : undefined,
  targetPlayerId: data.targetPlayerId ? String(data.targetPlayerId) : undefined,
  notes: data.notes ? String(data.notes) : '',
  createdAt: toISOString(data.createdAt as string)
});

const applyFilters = (matches: Match[], filters?: MatchFilters): Match[] => {
  if (!filters) return matches;

  return matches.filter((match) => {
    const date = new Date(match.date).getTime();
    const from = filters.from ? new Date(filters.from).getTime() : null;
    const to = filters.to ? new Date(filters.to).getTime() : null;
    const isWithinDate = (from === null || date >= from) && (to === null || date <= to);
    const isFormat = !filters.format || filters.format === 'all' || match.format === filters.format;
    const isStatus = !filters.status || filters.status === 'all' || match.status === filters.status;
    const isPlayer =
      !filters.playerId ||
      filters.playerId === 'all' ||
      [...match.teamA, ...match.teamB].includes(filters.playerId);

    return isWithinDate && isFormat && isStatus && isPlayer;
  });
};

export const matchesService = {
  async getAll(filters?: MatchFilters): Promise<Match[]> {
    const q = query(matchesCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const matches = snapshot.docs.map((item) => mapMatch(item.id, item.data()));
    return applyFilters(matches, filters);
  },

  async getById(id: string): Promise<Match | null> {
    const snapshot = await getDoc(doc(db, 'matches', id));
    if (!snapshot.exists()) return null;
    return mapMatch(snapshot.id, snapshot.data());
  },

  async create(input: CreateMatchInput) {
    const now = nowIso();
    await addDoc(matchesCollection, { ...input, createdAt: now, updatedAt: now });
  },

  async update(id: string, input: UpdateMatchInput) {
    await updateDoc(doc(db, 'matches', id), {
      ...input,
      updatedAt: nowIso()
    });
  },

  async remove(id: string) {
    await deleteDoc(doc(db, 'matches', id));
  },

  async getEventsByMatch(matchId: string): Promise<MatchEvent[]> {
    const q = query(matchEventsCollection, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((item) => mapMatchEvent(item.id, item.data()))
      .filter((event) => event.matchId === matchId);
  },

  async getAllEvents(): Promise<MatchEvent[]> {
    const q = query(matchEventsCollection, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => mapMatchEvent(item.id, item.data()));
  },

  async createEvent(input: CreateMatchEventInput) {
    const payload: Record<string, unknown> = { ...input, createdAt: nowIso() };
    Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });
    await addDoc(matchEventsCollection, payload);
  },

  async deleteEvent(eventId: string) {
    await deleteDoc(doc(db, 'match_events', eventId));
  }
};
