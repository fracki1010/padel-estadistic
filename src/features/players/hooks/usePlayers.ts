import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playersService } from '@/features/players/services/playersService';
import { queryKeys } from '@/shared/constants/queryKeys';
import type { CreatePlayerInput, UpdatePlayerInput } from '@/features/players/types/player';

export const usePlayers = (activeOnly = false) =>
  useQuery({
    queryKey: [...queryKeys.players, { activeOnly }],
    queryFn: () => playersService.getAll(activeOnly)
  });

export const usePlayer = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.player(id) : ['players', 'empty'],
    queryFn: () => playersService.getById(id ?? ''),
    enabled: Boolean(id)
  });

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlayerInput) => playersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
    }
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlayerInput }) => playersService.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
      queryClient.invalidateQueries({ queryKey: queryKeys.player(variables.id) });
    }
  });
};

export const useDeactivatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playersService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
    }
  });
};
