import apiClient, { unwrapResponse } from './client';
import type { ApiResponse } from '@/types';

// Channel statistics
export interface ChannelStats {
  channel_id: number;
  username: string;
  title: string;
  subscribers_count: number;
  posts_count: number;
  last_post_date: string | null;
  collected_at: string;
}

// Single post
export interface ChannelPost {
  id: number;
  text: string;
  date: string;
  views: number;
  forwards: number;
  reactions: Record<string, number>;
  reactions_total: number;
  comments_count: number;
  link: string;
  has_media: boolean;
  media_type: string | null;
}

// Combined response
export interface TelegramData {
  stats: ChannelStats | null;
  posts: ChannelPost[];
  last_update: string | null;
}

export const telegramApi = {
  // Get all data (stats + posts)
  getAll: async (): Promise<TelegramData> => {
    const response = await apiClient.get<ApiResponse<TelegramData>>('/api/telegram');
    return unwrapResponse(response);
  },

  // Get stats only
  getStats: async (): Promise<ChannelStats> => {
    const response = await apiClient.get<ApiResponse<ChannelStats>>('/api/telegram/stats');
    return unwrapResponse(response);
  },

  // Get posts only
  getPosts: async (): Promise<ChannelPost[]> => {
    const response = await apiClient.get<ApiResponse<ChannelPost[]>>('/api/telegram/posts');
    return unwrapResponse(response);
  },

  // Force refresh (admin only)
  refresh: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/telegram/refresh');
    return unwrapResponse(response);
  },

  // Public endpoint
  getPublic: async (): Promise<TelegramData> => {
    const response = await apiClient.get<ApiResponse<TelegramData>>('/api/public/telegram');
    return unwrapResponse(response);
  },
};

export default telegramApi;
