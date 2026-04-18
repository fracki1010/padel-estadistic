export const queryKeys = {
  players: ['players'] as const,
  player: (id: string) => ['players', id] as const,
  matches: ['matches'] as const,
  match: (id: string) => ['matches', id] as const,
  matchEvents: (matchId: string) => ['matches', matchId, 'events'] as const,
  allEvents: ['match_events'] as const
};
