import type { Match } from '@/features/matches/types/match';
import type { MatchEvent } from '@/features/matches/types/matchEvent';
import type { Player } from '@/features/players/types/player';

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  totalEvents: number;
  // Golpes ganadores
  winners: number;
  netWinners: number;
  baselineWinners: number;
  bandejas: number;
  viboras: number;
  globos: number;
  passingShotsWon: number;
  x3Winners: number;
  x4Winners: number;
  recuperaciones: number;
  // Saque
  aces: number;
  doubleFaults: number;
  // Errores
  unforcedErrors: number;
  forcedErrors: number;
  doubleTouches: number;
  // Ratios
  winnersRate: number;
  unforcedErrorRate: number;
  winnersMinusUnforcedErrors: number;
}

export interface PlayerMatchStats {
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  aces: number;
  doubleFaults: number;
  bandejas: number;
  viboras: number;
  globos: number;
  passingShotsWon: number;
  x3Winners: number;
  x4Winners: number;
  totalEvents: number;
}

export interface TeamStats {
  winners: number;
  aces: number;
  doubleFaults: number;
  unforcedErrors: number;
  forcedErrors: number;
  balance: number;
}

export interface MatchStats {
  totalEvents: number;
  winnersByPlayer: Record<string, number>;
  errorsByPlayer: Record<string, number>;
  targetedByPlayer: Record<string, number>;
  playerBreakdown: Record<string, PlayerMatchStats>;
  teamA: TeamStats;
  teamB: TeamStats;
  // legacy — mantenidos por compatibilidad
  teamAWinners: number;
  teamBWinners: number;
  topWinnerPlayerId: string | null;
  topUnforcedErrorsPlayerId: string | null;
  topTargetedPlayerId: string | null;
}

export interface Rankings {
  byWins: Array<{ playerId: string; value: number }>;
  byWinRate: Array<{ playerId: string; value: number }>;
  byWinners: Array<{ playerId: string; value: number }>;
  byLessUnforcedErrors: Array<{ playerId: string; value: number }>;
  byBalance: Array<{ playerId: string; value: number }>;
  byAces: Array<{ playerId: string; value: number }>;
}

export interface DashboardStats {
  activePlayers: number;
  totalMatches: number;
  totalEvents: number;
  bestWinRatePlayerId: string | null;
  matchesByMonth: Array<{ month: string; count: number }>;
  winnersByPlayer: Array<{ playerId: string; value: number }>;
  unforcedErrorsByPlayer: Array<{ playerId: string; value: number }>;
  recentMatches: Match[];
}

export interface StatsInput {
  players: Player[];
  matches: Match[];
  events: MatchEvent[];
}
