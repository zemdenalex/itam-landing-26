import apiClient, { unwrapResponse } from './client';
import type { ApiResponse } from '@/types';

export interface UploadResponse {
  url: string;
}

export const uploadApi = {
  // Upload image (jpg, jpeg, png, webp)
  image: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<UploadResponse>>(
      '/api/upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return unwrapResponse(response);
  },

  // Upload SVG
  svg: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<UploadResponse>>(
      '/api/upload/svg',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return unwrapResponse(response);
  },

  // Delete file
  delete: async (filename: string): Promise<void> => {
    await apiClient.delete(`/api/upload/${filename}`);
  },
};

export default uploadApi;
