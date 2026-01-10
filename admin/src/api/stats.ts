import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, Stat } from '@/types';

export const statsApi = {
  // Get all stats
  list: async (): Promise<Stat[]> => {
    const response = await apiClient.get<ApiResponse<Stat[]>>('/api/stats');
    return unwrapResponse(response);
  },

  // Update stat value
  update: async (key: string, value: string, label?: string): Promise<Stat> => {
    const response = await apiClient.put<ApiResponse<Stat>>(`/api/stats/${key}`, {
      value,
      label,
    });
    return unwrapResponse(response);
  },
};

export default statsApi;
