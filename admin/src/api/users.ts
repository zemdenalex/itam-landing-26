import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, User } from '@/types';

export interface UsersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  role?: 'admin' | 'editor' | '';
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'editor';
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'editor';
  is_active?: boolean;
}

export const usersApi = {
  list: async (filters: UsersFilters = {}): Promise<UsersListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);

    const response = await apiClient.get<ApiResponse<UsersListResponse>>(
      `/api/users?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/api/users/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/api/users', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/api/users/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};

export default usersApi;
