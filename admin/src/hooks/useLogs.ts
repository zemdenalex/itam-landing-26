import { useQuery } from '@tanstack/react-query';
import { logsApi, type LogsFilters } from '@/api/logs';

export const logsKeys = {
  all: ['logs'] as const,
  lists: () => [...logsKeys.all, 'list'] as const,
  list: (filters: LogsFilters) => [...logsKeys.lists(), filters] as const,
};

export function useLogs(filters: LogsFilters = {}) {
  return useQuery({
    queryKey: logsKeys.list(filters),
    queryFn: () => logsApi.list(filters),
  });
}
