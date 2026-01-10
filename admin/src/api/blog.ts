import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, PaginatedResponse, BlogPost } from '@/types';

export interface BlogFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_published?: boolean;
}

export interface CreateBlogPostData {
  title: string;
  slug?: string;
  content_json?: Record<string, unknown> | null;
  content_html?: string | null;
  cover_image?: string | null;
  is_published?: boolean;
}

export interface UpdateBlogPostData extends CreateBlogPostData {
  sort_order?: number;
  published_at?: string | null;
}

export const blogApi = {
  list: async (filters: BlogFilters = {}): Promise<PaginatedResponse<BlogPost>> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.page_size) params.set('page_size', String(filters.page_size));
    if (filters.search) params.set('search', filters.search);
    if (filters.is_published !== undefined) params.set('is_published', String(filters.is_published));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<BlogPost>>>(
      `/api/blog?${params.toString()}`
    );
    return unwrapResponse(response);
  },

  get: async (id: number): Promise<BlogPost> => {
    const response = await apiClient.get<ApiResponse<BlogPost>>(`/api/blog/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateBlogPostData): Promise<BlogPost> => {
    const response = await apiClient.post<ApiResponse<BlogPost>>('/api/blog', data);
    return unwrapResponse(response);
  },

  update: async (id: number, data: UpdateBlogPostData): Promise<BlogPost> => {
    const response = await apiClient.put<ApiResponse<BlogPost>>(`/api/blog/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/blog/${id}`);
  },

  // Publish post (sets published_at to current time)
  publish: async (id: number): Promise<BlogPost> => {
    const response = await apiClient.put<ApiResponse<BlogPost>>(`/api/blog/${id}`, {
      is_published: true,
      published_at: new Date().toISOString(),
    });
    return unwrapResponse(response);
  },

  // Unpublish post
  unpublish: async (id: number): Promise<BlogPost> => {
    const response = await apiClient.put<ApiResponse<BlogPost>>(`/api/blog/${id}`, {
      is_published: false,
      published_at: null,
    });
    return unwrapResponse(response);
  },
};

export default blogApi;
