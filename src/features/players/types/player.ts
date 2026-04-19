import type { EntityId, TimestampFields } from '@/shared/types/base';

export type DominantHand = 'derecha' | 'izquierda';
export type PreferredSide = 'drive' | 'reves' | 'indistinto';

export interface Player extends TimestampFields {
  id: EntityId;
  firstName: string;
  lastName: string;
  nickname?: string;
  dominantHand: DominantHand;
  preferredSide: PreferredSide;
  active: boolean;
  anonymous?: boolean;
}

export type CreatePlayerInput = Omit<Player, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePlayerInput = Partial<CreatePlayerInput>;
