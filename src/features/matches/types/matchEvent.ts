export type WinningTeam = 'equipoA' | 'equipoB';
export type EventType =
  | 'winner'
  | 'error_no_forzado'
  | 'error_forzado'
  | 'ace'
  | 'doble_falta'
  | 'punto_largo_ganado'
  | 'globo_ganador'
  | 'bandeja_ganadora'
  | 'vibora_ganadora'
  | 'passing_shot'
  | 'recuperacion_defensiva';

export type ShotType =
  | 'saque'
  | 'resto'
  | 'drive'
  | 'reves'
  | 'volea_drive'
  | 'volea_reves'
  | 'bandeja'
  | 'vibora'
  | 'smash'
  | 'globo'
  | 'salida_de_pared'
  | 'contra_pared'
  | 'otro';

export type ZoneType = 'red' | 'fondo' | 'transicion' | null;

export interface MatchEvent {
  id: string;
  matchId: string;
  timestamp: string;
  setNumber: number;
  gameNumber: number;
  pointNumber: number;
  winningTeam: WinningTeam;
  playerId: string;
  eventType: EventType;
  shotType: ShotType;
  zone?: ZoneType;
  notes?: string;
  createdAt: string;
}

export type CreateMatchEventInput = Omit<MatchEvent, 'id' | 'createdAt'>;
