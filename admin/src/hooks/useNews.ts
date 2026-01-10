import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi, type NewsFilters, type CreateNewsData, type UpdateNewsData } from '@/api/news';
import { useToast } from '@/components/ui';

export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: NewsFilters) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: number) => [...newsKeys.details(), id] as const,
};

export function useNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: () => newsApi.list(filters),
  });
}

export function useNewsItem(id: number | null) {
  return useQuery({
    queryKey: newsKeys.detail(id!),
    queryFn: () => newsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateNewsData) => newsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      success('Новость создана');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать');
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNewsData }) =>
      newsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(id) });
      success('Новость обновлена');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => newsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      success('Новость удалена');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

export function useReorderNews() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (ids: number[]) => newsApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить порядок');
    },
  });
}
