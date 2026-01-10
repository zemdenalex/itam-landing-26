import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, TeamMember } from '@/types';

export interface TeamFilters {
  page?: number;
  page_size?: number;
  search?: string;
  club_id?: number;
  is_visible?: boolean;
}

export interface CreateTeamMemberData {
  name: string;
  role?: string | null;
  photo?: string | null;
  club_id?: number | null;
  badge?: string | null;
  telegram_link?: string | null;
  is_visible?: boolean;
}

export interface UpdateTeamMemberData extends CreateTeamMemberData {
  sort_order?: number;
}

export const teamApi = {
  list: async (filters: TeamFilters = {}): Promise<PaginatedResponse<TeamMember>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.club_id) params.set('club_id', String(filters.club_id));
    if (filters.is_visible !== undefined) params.set('is_visible', String(filters.is_visible));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<TeamMember>>>(
      `/api/team?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<TeamMember> => {
    const response = await apiClient.get<ApiResponse<TeamMember>>(`/api/team/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateTeamMemberData): Promise<TeamMember> => {
    const response = await apiClient.post<ApiResponse<TeamMember>>('/api/team', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateTeamMemberData): Promise<TeamMember> => {
    const response = await apiClient.put<ApiResponse<TeamMember>>(`/api/team/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/team/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/api/team/reorder', { ids });
  },
};

export default teamApi;
