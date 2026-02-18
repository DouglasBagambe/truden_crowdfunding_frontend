import { apiClient } from './api-client';

export enum InvestmentStatus {
    Pending = 'Pending',
    Active = 'Active',
    Completed = 'Completed',
    Refunded = 'Refunded',
}

export interface CreateInvestmentDto {
    projectId: string;
    amount: number;
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
    /**
     * Create a new investment
     */
    async createInvestment(data: CreateInvestmentDto): Promise<Investment> {
        const response = await apiClient.post('/investments/invest', data);
        return response.data;
    },

    /**
     * Get user's investments
     */
    async getUserInvestments(userId: string): Promise<Investment[]> {
        const response = await apiClient.get(`/investments/user/${userId}`);
        return response.data;
    },

    /**
     * Get my investments (current user)
     */
    async getMyInvestments(): Promise<Investment[]> {
        const response = await apiClient.get('/investments/my');
        return response.data;
    },

    /**
     * Get investments for a specific project
     */
    async getProjectInvestments(projectId: string): Promise<Investment[]> {
        const response = await apiClient.get(`/investments/project/${projectId}`);
        return response.data;
    },

    /**
     * Get a single investment by ID
     */
    async getInvestment(id: string): Promise<Investment> {
        const response = await apiClient.get(`/investments/${id}`);
        return response.data;
    },

    /**
     * List all investments (admin only)
     */
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
