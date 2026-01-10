import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get token from zustand persisted storage
function getToken(): string | null {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

// Helper to clear auth storage
function clearAuthStorage() {
  localStorage.removeItem('auth-storage');
}

// Request interceptor - добавляем токен
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - обработка 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      // Only redirect if we're on a protected page and not already on login
      const isLoginPage = window.location.pathname === '/login';
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      // Don't redirect for auth endpoints (login, me) - let the app handle it
      if (!isLoginPage && !isAuthEndpoint) {
        clearAuthStorage();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper для извлечения данных из API response
export function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  if (response.data.data === null) {
    throw new Error('No data in response');
  }
  return response.data.data;
}

export default apiClient;