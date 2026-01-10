import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi, type ClubsFilters, type CreateClubData, type UpdateClubData } from '@/api/clubs';
import { useToast } from '@/components/ui';

export const clubsKeys = {
  all: ['clubs'] as const,
  lists: () => [...clubsKeys.all, 'list'] as const,
  list: (filters: ClubsFilters) => [...clubsKeys.lists(), filters] as const,
  details: () => [...clubsKeys.all, 'detail'] as const,
  detail: (id: number) => [...clubsKeys.details(), id] as const,
};

export function useClubs(filters: ClubsFilters = {}) {
  return useQuery({
    queryKey: clubsKeys.list(filters),
    queryFn: () => clubsApi.list(filters),
  });
}

export function useClub(id: number | null) {
  return useQuery({
    queryKey: clubsKeys.detail(id!),
    queryFn: () => clubsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateClubData) => clubsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
      success('Клуб создан');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать');
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClubData }) =>
      clubsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clubsKeys.detail(id) });
      success('Клуб обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => clubsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
      success('Клуб удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

export function useReorderClubs() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (ids: number[]) => clubsApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить порядок');
    },
  });
}
