export type WinningTeam = 'equipoA' | 'equipoB';
// Golpes ganadores propios del partido (cuentan como winners en estadísticas)
// Errores que hacen perder el punto al jugador que los comete
// ace y doble_falta son exclusivos del saque
export type EventType =
  // --- Golpes ganadores ---
  | 'winner'             // winner directo: drive, revés, volea, smash (vía shotType)
  | 'bandeja_ganadora'
  | 'vibora_ganadora'
  | 'globo_ganador'
  | 'passing_shot'
  | 'x3_ganador'         // pelota sale por pared de fondo + lateral (Regla 13d FIP)
  | 'x4_ganador'         // pelota sale a +4m de altura (Regla 13d FIP)
  | 'recuperacion_defensiva'
  | 'punto_largo_ganado'
  // --- Saque ---
  | 'ace'
  | 'doble_falta'
  // --- Errores ---
  | 'error_no_forzado'
  | 'error_forzado'
  | 'doble_toque';       // golpe doble sobre la misma pelota (Regla 13i FIP)

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
  | 'x3'
  | 'x4'
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
  targetPlayerId?: string; // jugador al que iba dirigido el golpe
  notes?: string;
  createdAt: string;
}

export type CreateMatchEventInput = Omit<MatchEvent, 'id' | 'createdAt'>;
