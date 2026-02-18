import { apiClient } from './api-client';

export enum ProjectType {
  ROI = 'ROI',
  CHARITY = 'CHARITY',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  FUNDED = 'FUNDED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export interface ProjectMilestone {
  title: string;
  description: string;
  amount: number;
  expectedDate?: string;
}

export interface CreateProjectParams {
  name: string;
  projectType: ProjectType;
  category: string;
  summary: string;
  story: string;
  targetAmount: number;
  currency: string;
  fundingEndDate: string;
  milestones: ProjectMilestone[];
  mediaUrls?: {
    videoUrls?: string[];
    galleryImages?: string[];
  };
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export const projectService = {
  /**
   * List projects with filters
   */
  async getProjects(params?: any) {
    const response = await apiClient.get('/projects', { params });
    const data = response.data;
    // Normalize to { items: [...] }
    if (Array.isArray(data)) return { items: data };
    if (data?.items) return data;
    if (data?.projects) return { ...data, items: data.projects };
    return { items: data?.data ?? [], ...((data && typeof data === 'object') ? data : {}) };
  },

  /**
   * Get project details
   */
  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Create a new project draft
   */
  async createProject(data: CreateProjectParams) {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  /**
   * Update a project
   */
  async updateProject(id: string, params: Partial<CreateProjectParams>) {
    const response = await apiClient.patch(`/projects/${id}`, params);
    return response.data;
  },

  /**
   * Submit project for review
   */
  async submitForReview(id: string) {
    const response = await apiClient.post(`/projects/${id}/submit`);
    return response.data;
  },

  /**
   * Upload project media
   */
  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/projects/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Simple invest (deprecated in favor of flutterwave/wallet flow)
   */
  async invest(data: { projectId: string; amount: number }) {
  async invest(data: { projectId: string; amount: number; txHash?: string }) {
    const response = await apiClient.post('/investments/invest', data);
    return response.data;
  }
};
