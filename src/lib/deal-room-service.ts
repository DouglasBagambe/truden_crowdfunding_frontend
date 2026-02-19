import { apiClient } from './api-client';

export type DealRoomFileItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  category?: string;
  tags: string[];
  state: string;
  canDownload: boolean;
  canAnnotate: boolean;
  canManage: boolean;
  createdAt: string;
};

export type DealRoomListResponse = {
  items: DealRoomFileItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const dealRoomService = {
  async listProjectFiles(projectId: string, params?: { page?: number; pageSize?: number; sort?: string }) {
    const response = await apiClient.get<DealRoomListResponse>(`/deal-room/${projectId}/files`, { params });
    return response.data;
  },

  async getPreviewUrl(documentId: string) {
    const response = await apiClient.get<{ url: string; expiresIn: number }>(`/deal-room/file/${documentId}/preview`);
    return response.data;
  },

  async getDownloadUrl(documentId: string) {
    const response = await apiClient.get<{ url: string; expiresIn: number }>(`/deal-room/file/${documentId}/download`);
    return response.data;
  },
};
