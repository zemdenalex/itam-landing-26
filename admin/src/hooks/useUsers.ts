import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UsersFilters, type CreateUserData, type UpdateUserData } from '@/api/users';
import { useToast } from '@/components/ui';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: UsersFilters) => [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: number) => [...usersKeys.details(), id] as const,
};

export function useUsers(filters: UsersFilters = {}) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => usersApi.list(filters),
  });
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: usersKeys.detail(id!),
    queryFn: () => usersApi.get(id!),
    enabled: id !== null && id > 0,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      success('Пользователь создан');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать пользователя');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      success('Пользователь обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить пользователя');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      success('Пользователь удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить пользователя');
    },
  });
}
