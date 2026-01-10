import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '@/api/telegram';
import { useToast } from '@/components/ui';

export const telegramKeys = {
  all: ['telegram'] as const,
  data: () => [...telegramKeys.all, 'data'] as const,
  stats: () => [...telegramKeys.all, 'stats'] as const,
  posts: () => [...telegramKeys.all, 'posts'] as const,
};

export function useTelegramData() {
  return useQuery({
    queryKey: telegramKeys.data(),
    queryFn: () => telegramApi.getAll(),
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useTelegramStats() {
  return useQuery({
    queryKey: telegramKeys.stats(),
    queryFn: () => telegramApi.getStats(),
  });
}

export function useTelegramPosts() {
  return useQuery({
    queryKey: telegramKeys.posts(),
    queryFn: () => telegramApi.getPosts(),
  });
}

export function useRefreshTelegram() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: () => telegramApi.refresh(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: telegramKeys.all });
      success('Запрос отправлен', data.message);
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить данные');
    },
  });
}
