import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, News } from '@/types';

export interface NewsFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_visible?: boolean;
}

export interface CreateNewsData {
  title: string;
  source: string;
  source_link?: string | null;
  image?: string | null;
  published_date?: string | null;
  is_visible?: boolean;
}

export interface UpdateNewsData extends CreateNewsData {
  sort_order?: number;
}

export const newsApi = {
  list: async (filters: NewsFilters = {}): Promise<PaginatedResponse<News>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.is_visible !== undefined) params.set('is_visible', String(filters.is_visible));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<News>>>(
      `/api/news?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<News> => {
    const response = await apiClient.get<ApiResponse<News>>(`/api/news/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateNewsData): Promise<News> => {
    const response = await apiClient.post<ApiResponse<News>>('/api/news', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateNewsData): Promise<News> => {
    const response = await apiClient.put<ApiResponse<News>>(`/api/news/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/news/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/api/news/reorder', { ids });
  },
};

export default newsApi;
