import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { matchesService } from '@/features/matches/services/matchesService';
import type { CreateMatchEventInput } from '@/features/matches/types/matchEvent';
import type { CreateMatchInput, MatchFilters, UpdateMatchInput } from '@/features/matches/types/match';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useMatches = (filters?: MatchFilters) =>
  useQuery({
    queryKey: [...queryKeys.matches, filters],
    queryFn: () => matchesService.getAll(filters)
  });

export const useMatch = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.match(id) : ['matches', 'empty'],
    queryFn: () => matchesService.getById(id ?? ''),
    enabled: Boolean(id)
  });

export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchInput) => matchesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
    }
  });
};

export const useUpdateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMatchInput }) => matchesService.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.match(variables.id) });
    }
  });
};

export const useDeleteMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matchesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
    }
  });
};

export const useEventsByMatch = (matchId?: string) =>
  useQuery({
    queryKey: matchId ? queryKeys.matchEvents(matchId) : ['matches', 'events', 'empty'],
    queryFn: () => matchesService.getEventsByMatch(matchId ?? ''),
    enabled: Boolean(matchId)
  });

export const useMatchEvents = () =>
  useQuery({
    queryKey: queryKeys.allEvents,
    queryFn: () => matchesService.getAllEvents()
  });

export const useCreateMatchEvent = (matchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchEventInput) => matchesService.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchEvents(matchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allEvents });
    }
  });
};

export const useDeleteMatchEvent = (matchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => matchesService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchEvents(matchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allEvents });
    }
  });
};
