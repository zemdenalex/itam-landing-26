import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, type TeamFilters, type CreateTeamMemberData, type UpdateTeamMemberData } from '@/api/team';
import { useToast } from '@/components/ui';

export const teamKeys = {
  all: ['team'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamKeys.details(), id] as const,
};

export function useTeam(filters: TeamFilters = {}) {
  return useQuery({
    queryKey: teamKeys.list(filters),
    queryFn: () => teamApi.list(filters),
  });
}

export function useTeamMember(id: number | null) {
  return useQuery({
    queryKey: teamKeys.detail(id!),
    queryFn: () => teamApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateTeamMemberData) => teamApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      success('Участник добавлен');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось добавить');
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTeamMemberData }) =>
      teamApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
      success('Участник обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => teamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      success('Участник удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

export function useReorderTeam() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (ids: number[]) => teamApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить порядок');
    },
  });
}
