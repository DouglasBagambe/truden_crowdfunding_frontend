import { apiClient } from './api-client';

export const projectService = {
  async getProjects(params?: any) {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: any) {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async invest(data: { projectId: string; amount: number }) {
    const response = await apiClient.post('/investments/invest', data);
    return response.data;
  }
};
