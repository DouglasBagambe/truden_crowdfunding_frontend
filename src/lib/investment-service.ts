import { apiClient } from './api-client';

export enum InvestmentStatus {
    Pending = 'pending',
    Active = 'active',
    Completed = 'completed',
    Refunded = 'refunded',
}

export interface CreateInvestmentDto {
    projectId: string;
    amount: string;
    projectOnchainId?: string;
}

export interface Investment {
    id: string;
    projectId: string;
    investorId: string;
    amount: number;
    txHash: string | null;
    nftId: string | null;
    status: InvestmentStatus;
    createdAt: Date;
    updatedAt: Date;
    project?: {
        id: string;
        title?: string;
        category?: string;
        type?: string;
        creatorId?: string;
    };
    investor?: {
        id: string;
        walletAddress?: string;
        kycStatus?: string;
    };
    nft?: {
        id: string | null;
        metadata: Record<string, unknown> | null;
    };
}

export const investmentService = {
    async createInvestment(data: CreateInvestmentDto): Promise<Investment> {
        const response = await apiClient.post('/investments/invest', data);
        return response.data;
    },

    async getMyInvestments(): Promise<Investment[]> {
        const response = await apiClient.get('/investments/me'); // ← was '/investments/my'
        return response.data;
    },

    async getUserInvestments(userId: string): Promise<Investment[]> {
        const response = await apiClient.get(`/investments/user/${userId}`);
        return response.data;
    },

    async getProjectInvestments(projectId: string): Promise<Investment[]> {
        const response = await apiClient.get(`/investments/project/${projectId}`);
        return response.data;
    },

    async getInvestment(id: string): Promise<Investment> {
        const response = await apiClient.get(`/investments/${id}`);
        return response.data;
    },

    async listInvestments(params?: {
        userId?: string;
        projectId?: string;
        status?: InvestmentStatus;
        limit?: number;
        skip?: number;
    }): Promise<{ items: Investment[]; total: number }> {
        const response = await apiClient.get('/investments', { params });
        return response.data;
    },
};