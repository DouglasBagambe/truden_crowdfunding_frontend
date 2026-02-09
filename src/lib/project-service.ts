import { apiClient } from './api-client';

export const projectService = {
  async getProjects(params?: any) {
    const response = await apiClient.get('/projects', { params });
    const data = response.data;
    // Normalize to { items: [...] }
    if (Array.isArray(data)) return { items: data };
    if (data?.items) return data;
    if (data?.projects) return { ...data, items: data.projects };
    return { items: data?.data ?? [], ...((data && typeof data === 'object') ? data : {}) };
  },

  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: any) {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async invest(data: { projectId: string; amount: number; txHash?: string }) {
    const response = await apiClient.post('/investments/invest', data);
    return response.data;
  },

  async getUserInvestments(userId: string) {
    const response = await apiClient.get(`/investments/user/${userId}`);
    return response.data;
  }
};
