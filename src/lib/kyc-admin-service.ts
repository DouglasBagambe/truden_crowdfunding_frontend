import { apiClient } from './api-client';

export type KycAdminListItem = {
  id: string;
  userId: string;
  status: string;
  userKycStatus: string;
  level?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type KycAdminListResponse = {
  items: KycAdminListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const kycAdminService = {
  async listProfiles(params?: {
    status?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await apiClient.get<KycAdminListResponse>('/kyc/admin/profiles', { params });
    return response.data;
  },

  async overrideStatus(
    profileId: string,
    dto: { status: string; rejectionReason?: string; manualNotes?: string; level?: string },
  ) {
    const response = await apiClient.post(`/kyc/admin/profiles/${profileId}/override-status`, dto);
    return response.data;
  },
};
