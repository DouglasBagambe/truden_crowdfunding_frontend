import { apiClient } from './api-client';

export interface DPOInitResponse {
    token: string;
    redirectUrl: string;
    status: string;
}

export interface DPOVerifyResponse {
    status: string;
    verify: {
        status: string;
        message: string;
        transactionRef?: string;
        amount?: string;
        currency?: string;
    };
}

export const paymentService = {
    /**
     * Step 1: Create a DPO payment token.
     * Returns a redirectUrl — send user there to pay via DPO hosted page.
     */
    async initializeDPOPayment(params: {
        projectId: string;
        amount: number;
        currency?: string;
        paymentMethod?: string;
        projectType?: string;
        description?: string;
    }): Promise<DPOInitResponse> {
        const response = await apiClient.post('/payments/dpo/initialize', {
            projectId: params.projectId,
            amount: params.amount,
            currency: params.currency ?? 'UGX',
            paymentMethod: params.paymentMethod ?? 'card',
            projectType: params.projectType,
            description: params.description,
        });
        return response.data;
    },

    /**
     * Step 2: Verify payment status after user returns from DPO.
     * Call this on the /payment/result page.
     */
    async verifyDPOPayment(token: string): Promise<DPOVerifyResponse> {
        const response = await apiClient.get(`/payments/dpo/verify/${token}`);
        return response.data;
    },
};
