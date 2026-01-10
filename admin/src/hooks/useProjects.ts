import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type ProjectsFilters, type CreateProjectData, type UpdateProjectData } from '@/api/projects';
import { useToast } from '@/components/ui';

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (filters: ProjectsFilters) => [...projectsKeys.lists(), filters] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectsKeys.details(), id] as const,
  tags: () => [...projectsKeys.all, 'tags'] as const,
};

export function useProjects(filters: ProjectsFilters = {}) {
  return useQuery({
    queryKey: projectsKeys.list(filters),
    queryFn: () => projectsApi.list(filters),
  });
}

export function useProject(id: number | null) {
  return useQuery({
    queryKey: projectsKeys.detail(id!),
    queryFn: () => projectsApi.get(id!),
    enabled: id !== null,
  });
}

export function useTags() {
  return useQuery({
    queryKey: projectsKeys.tags(),
    queryFn: () => projectsApi.getTags(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      success('Проект создан');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectData }) =>
      projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
      success('Проект обновлён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось обновить');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      success('Проект удалён');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (ids: number[]) => projectsApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось изменить порядок');
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (name: string) => projectsApi.createTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.tags() });
      success('Тег создан');
    },
    onError: (err) => {
      error('Ошибка', err instanceof Error ? err.message : 'Не удалось создать тег');
    },
  });
}
