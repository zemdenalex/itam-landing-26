import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, Project, Tag } from '@/types';

export interface ProjectsFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_published?: boolean;
}

export interface CreateProjectData {
  title: string;
  description?: string | null;
  cover_image?: string | null;
  tag_ids?: number[];
  is_published?: boolean;
}

export interface UpdateProjectData extends CreateProjectData {
  sort_order?: number;
}

export const projectsApi = {
  list: async (filters: ProjectsFilters = {}): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.is_published !== undefined) params.set('is_published', String(filters.is_published));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Project>>>(
      `/api/projects?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/api/projects/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>('/api/projects', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put<ApiResponse<Project>>(`/api/projects/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/projects/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/api/projects/reorder', { ids });
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/api/projects/tags');
    return unwrapResponse(response);
  },

  createTag: async (name: string): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>('/api/projects/tags', { name });
    return unwrapResponse(response);
  },
};

export default projectsApi;
