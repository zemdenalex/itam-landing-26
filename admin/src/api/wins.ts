import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, Win, WinsStats } from '@/types';

export interface WinsFilters {
  page?: number;
  page_size?: number;
  year?: number;
  search?: string;
}

export interface CreateWinData {
  team_name: string;
  hackathon_name: string;
  result: string;
  prize?: number;
  award_date?: string;
  year: number;
  link?: string;
}

export interface UpdateWinData extends CreateWinData {
  sort_order?: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export const winsApi = {
  // List with filters and pagination
  list: async (filters: WinsFilters = {}): Promise<PaginatedResponse<Win>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.year) params.set('year', String(filters.year));
    if (filters.search) params.set('search', filters.search);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Win>>>(
      `/api/wins?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  // Get single win
  get: async (id: number): Promise<Win> => {
    const response = await apiClient.get<ApiResponse<Win>>(`/api/wins/${id}`);
    return unwrapResponse(response);
  },

  // Create win
  create: async (data: CreateWinData): Promise<Win> => {
    const response = await apiClient.post<ApiResponse<Win>>('/api/wins', data);
    return unwrapResponse(response);
  },

  // Update win
  update: async (id: number, data: UpdateWinData): Promise<Win> => {
    const response = await apiClient.put<ApiResponse<Win>>(`/api/wins/${id}`, data);
    return unwrapResponse(response);
  },

  // Delete win
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/wins/${id}`);
  },

  // Get available years
  years: async (): Promise<number[]> => {
    const response = await apiClient.get<ApiResponse<number[]>>('/api/wins/years');
    return unwrapResponse(response);
  },

  // Get stats for dashboard
  stats: async (): Promise<WinsStats> => {
    const response = await apiClient.get<ApiResponse<WinsStats>>('/api/wins/stats');
    return unwrapResponse(response);
  },

  // Import from CSV
  import: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<ImportResult>>(
      '/api/wins/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return unwrapResponse(response);
  },
};

export default winsApi;
