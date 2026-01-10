import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    return unwrapResponse(response);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    return unwrapResponse(response);
  },
};

export default authApi;
