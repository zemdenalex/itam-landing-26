import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, Partner } from '@/types';

export interface PartnersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_visible?: boolean;
}

export interface CreatePartnerData {
  name: string;
  logo_svg?: string | null;
  website?: string | null;
  is_visible?: boolean;
}

export interface UpdatePartnerData extends CreatePartnerData {
  sort_order?: number;
}

export const partnersApi = {
  list: async (filters: PartnersFilters = {}): Promise<PaginatedResponse<Partner>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.is_visible !== undefined) params.set('is_visible', String(filters.is_visible));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Partner>>>(
      `/api/partners?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<Partner> => {
    const response = await apiClient.get<ApiResponse<Partner>>(`/api/partners/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreatePartnerData): Promise<Partner> => {
    const response = await apiClient.post<ApiResponse<Partner>>('/api/partners', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdatePartnerData): Promise<Partner> => {
    const response = await apiClient.put<ApiResponse<Partner>>(`/api/partners/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/partners/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/api/partners/reorder', { ids });
  },
};

export default partnersApi;
