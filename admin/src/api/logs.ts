import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, AuditLog } from '@/types';

export interface LogsFilters {
  page?: number;
  page_size?: number;
  user_id?: number;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
}

export const logsApi = {
  list: async (filters: LogsFilters = {}): Promise<PaginatedResponse<AuditLog>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.user_id) params.set('user_id', String(filters.user_id));
    if (filters.entity_type) params.set('entity_type', filters.entity_type);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
      `/api/logs?${params.toString()}`
    );
    return unwrapResponse(response);
  },
};

export default logsApi;
