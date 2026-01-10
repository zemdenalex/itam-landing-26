import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi, type PartnersFilters, type CreatePartnerData, type UpdatePartnerData } from '@/api/partners';
import { useToast } from '@/components/ui';

export const partnersKeys = {
  all: ['partners'] as const,
  lists: () => [...partnersKeys.all, 'list'] as const,
  list: (filters: PartnersFilters) => [...partnersKeys.lists(), filters] as const,
  details: () => [...partnersKeys.all, 'detail'] as const,
  detail: (id: number) => [...partnersKeys.details(), id] as const,
};

export function usePartners(filters: PartnersFilters = {}) {
  return useQuery({
    queryKey: partnersKeys.list(filters),
    queryFn: () => partnersApi.list(filters),
  });
}

export function usePartner(id: number | null) {
  return useQuery({
    queryKey: partnersKeys.detail(id!),
    queryFn: () => partnersApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreatePartnerData) => partnersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.lists() });
      success('Партнёр добавлен');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось добавить');
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerData }) =>
      partnersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: partnersKeys.detail(id) });
      success('Партнёр обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => partnersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.lists() });
      success('Партнёр удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

export function useReorderPartners() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (ids: number[]) => partnersApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.lists() });
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить порядок');
    },
  });
}
