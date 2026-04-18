import { useMemo } from 'react';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { useMatchEvents, useMatches } from '@/features/matches/hooks/useMatches';

export const useStatsData = () => {
  const playersQuery = usePlayers(false);
  const matchesQuery = useMatches();
  const eventsQuery = useMatchEvents();

  const loading = playersQuery.isLoading || matchesQuery.isLoading || eventsQuery.isLoading;

  return useMemo(
    () => ({
      players: playersQuery.data ?? [],
      matches: matchesQuery.data ?? [],
      events: eventsQuery.data ?? [],
      loading
    }),
    [eventsQuery.data, loading, matchesQuery.data, playersQuery.data]
  );
};
