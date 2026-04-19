import type { EntityId, TimestampFields } from '@/shared/types/base';

export type MatchFormat = 'amistoso' | 'entrenamiento' | 'torneo';
export type MatchStatus = 'pendiente' | 'en_curso' | 'finalizado';
export type MatchWinner = 'equipoA' | 'equipoB' | null;
export type MatchTeam = 'equipoA' | 'equipoB';

export interface MatchLiveState {
  setNumber: number;
  gameNumber: number;
  pointNumber: number;
  gamesInSetA: number;
  gamesInSetB: number;
  currentServerPlayerId: string | null;
  updatedAt: string;
}

export type PlayerSide = 'drive' | 'reves';

export interface Match extends TimestampFields {
  id: EntityId;
  date: string;
  location?: string;
  format: MatchFormat;
  teamA: [string, string];
  teamB: [string, string];
  notes?: string;
  status: MatchStatus;
  setsWonTeamA: number;
  setsWonTeamB: number;
  winner: MatchWinner;
  bestOf?: 3 | 5;
  deuce?: 'oro' | 'ventaja';
  playerSides?: Record<string, PlayerSide>;
  liveState?: MatchLiveState;
}

export interface MatchFilters {
  from?: string;
  to?: string;
  format?: MatchFormat | 'all';
  status?: MatchStatus | 'all';
  playerId?: string | 'all';
}

export type CreateMatchInput = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMatchInput = Partial<CreateMatchInput>;
