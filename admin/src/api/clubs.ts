import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, Club } from '@/types';

export interface ClubsFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_visible?: boolean;
}

export interface CreateClubData {
  name: string;
  description?: string | null;
  goal?: string | null;
  cover_image?: string | null;
  chat_link?: string | null;
  channel_link?: string | null;
  members_count?: number;
  events_count?: number;
  wins_count?: number;
  image_urls?: string[];
  is_visible?: boolean;
}

export interface UpdateClubData extends CreateClubData {
  sort_order?: number;
}

export const clubsApi = {
  list: async (filters: ClubsFilters = {}): Promise<PaginatedResponse<Club>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.is_visible !== undefined) params.set('is_visible', String(filters.is_visible));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Club>>>(
      `/api/clubs?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<Club> => {
    const response = await apiClient.get<ApiResponse<Club>>(`/api/clubs/${id}`);
    return unwrapResponse(response);
  },

  getBySlug: async (slug: string): Promise<Club> => {
    const response = await apiClient.get<ApiResponse<Club>>(`/api/clubs/slug/${slug}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateClubData): Promise<Club> => {
    const response = await apiClient.post<ApiResponse<Club>>('/api/clubs', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateClubData): Promise<Club> => {
    const response = await apiClient.put<ApiResponse<Club>>(`/api/clubs/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/clubs/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/api/clubs/reorder', { ids });
  },

  // Club images management
  addImage: async (clubId: number, imageUrl: string): Promise<void> => {
    await apiClient.post(`/api/clubs/${clubId}/images`, { image_url: imageUrl });
  },

  removeImage: async (clubId: number, imageId: number): Promise<void> => {
    await apiClient.delete(`/api/clubs/${clubId}/images/${imageId}`);
  },

  reorderImages: async (clubId: number, imageIds: number[]): Promise<void> => {
    await apiClient.put(`/api/clubs/${clubId}/images/reorder`, { ids: imageIds });
  },
};

export default clubsApi;
