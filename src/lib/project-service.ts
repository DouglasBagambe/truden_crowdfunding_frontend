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
  type: ProjectType;
  category?: string;
  subcategory?: string;
  industry?: string;
  summary: string;
  story: string;
  country: string;
  location?: string;
  beneficiary: string;
  paymentMethod: string;
  targetAmount: number;
  currency: string;
  fundingStartDate?: string;
  fundingEndDate?: string;
  tags?: string[];
  videoUrls?: string[];
  galleryImages?: string[];
  imageUrl?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  website?: string;
  milestones?: Array<{
    title: string;
    description: string;
    dueDate: string;
    payoutPercentage?: number;
  }>;
  useOfFunds?: Array<{
    item: string;
    amount: number;
    percentage: number;
  }>;
  risks?: string;
  challenges?: string;
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
   * Get project details (works for all statuses including DRAFT)
   */
  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Get public projects for explore page
   */
  async getPublicProjects(params?: any) {
    const response = await apiClient.get('/projects', { params });
    const data = response.data;
    if (Array.isArray(data)) return { items: data };
    if (data?.items) return data;
    if (data?.projects) return { ...data, items: data.projects };
    return { items: data?.data ?? [] };
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

  async adminListPending() {
    const response = await apiClient.get('/admin/projects/pending');
    return response.data;
  },

  async adminDecision(id: string, dto: { finalStatus: string; reason?: string }) {
    const response = await apiClient.post(`/admin/projects/${id}/decision`, dto);
    return response.data;
  },

  /**
   * Get current user's own projects (including drafts)
   */
  async getMyProjects() {
    const response = await apiClient.get('/projects/me');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.projects) return data.projects;
    if (data?.items) return data.items;
    return data?.data ?? [];
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
  async invest(data: { projectId: string; amount: number; txHash?: string }) {
    const response = await apiClient.post('/investments/invest', data);
    return response.data;
  }
};
