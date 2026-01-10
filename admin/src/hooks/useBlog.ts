import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi, type BlogFilters, type CreateBlogPostData, type UpdateBlogPostData } from '@/api/blog';
import { useToast } from '@/components/ui';

export const blogKeys = {
  all: ['blog'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: number) => [...blogKeys.details(), id] as const,
};

export function useBlogPosts(filters: BlogFilters = {}) {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: () => blogApi.list(filters),
  });
}

export function useBlogPost(id: number | null) {
  return useQuery({
    queryKey: blogKeys.detail(id!),
    queryFn: () => blogApi.get(id!),
    enabled: id !== null && id > 0,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateBlogPostData) => blogApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      success('Пост создан');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать пост');
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBlogPostData }) =>
      blogApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      success('Пост обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить пост');
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => blogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      success('Пост удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить пост');
    },
  });
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => blogApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      success('Пост опубликован');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось опубликовать пост');
    },
  });
}

export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => blogApi.unpublish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      success('Пост снят с публикации');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось снять с публикации');
    },
  });
}
