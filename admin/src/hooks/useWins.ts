import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { winsApi, type WinsFilters, type CreateWinData, type UpdateWinData } from '@/api/wins';
import { useToast } from '@/components/ui';

// Query keys
export const winsKeys = {
  all: ['wins'] as const,
  lists: () => [...winsKeys.all, 'list'] as const,
  list: (filters: WinsFilters) => [...winsKeys.lists(), filters] as const,
  details: () => [...winsKeys.all, 'detail'] as const,
  detail: (id: number) => [...winsKeys.details(), id] as const,
  years: () => [...winsKeys.all, 'years'] as const,
  stats: () => [...winsKeys.all, 'stats'] as const,
};

// List wins with filters
export function useWins(filters: WinsFilters = {}) {
  return useQuery({
    queryKey: winsKeys.list(filters),
    queryFn: () => winsApi.list(filters),
  });
}

// Get single win
export function useWin(id: number | null) {
  return useQuery({
    queryKey: winsKeys.detail(id!),
    queryFn: () => winsApi.get(id!),
    enabled: id !== null,
  });
}

// Get available years
export function useWinsYears() {
  return useQuery({
    queryKey: winsKeys.years(),
    queryFn: () => winsApi.years(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get wins stats
export function useWinsStats() {
  return useQuery({
    queryKey: winsKeys.stats(),
    queryFn: () => winsApi.stats(),
  });
}

// Create win
export function useCreateWin() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateWinData) => winsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: winsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: winsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: winsKeys.years() });
      success('Победа создана');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать');
    },
  });
}

// Update win
export function useUpdateWin() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWinData }) =>
      winsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: winsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: winsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: winsKeys.stats() });
      success('Победа обновлена');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

// Delete win
export function useDeleteWin() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => winsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: winsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: winsKeys.stats() });
      success('Победа удалена');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

// Import CSV
export function useImportWins() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (file: File) => winsApi.import(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: winsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: winsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: winsKeys.years() });
      
      if (result.errors.length > 0) {
        success(
          'Импорт завершён с предупреждениями',
          `Импортировано: ${result.imported}, пропущено: ${result.skipped}`
        );
      } else {
        success('Импорт завершён', `Импортировано записей: ${result.imported}`);
      }
    },
    onError: (err) => {
      error('Ошибка импорта', err instanceof Error ? err.message : 'Не удалось импортировать');
    },
  });
}
