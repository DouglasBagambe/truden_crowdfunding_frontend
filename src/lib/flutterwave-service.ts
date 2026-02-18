import { apiClient } from './api-client';

export interface InitializePaymentParams {
    amount: number;
    currency: 'UGX' | 'USD';
    email: string;
    phoneNumber?: string;
    paymentMethod: 'mobile_money' | 'card' | 'bank_transfer' | 'wallet';
    mobileMoneyProvider?: 'mtn' | 'airtel' | 'vodafone';
    projectId: string;
    redirectUrl: string;
}

export interface PaymentResponse {
    transactionId: string;
    paymentLink?: string;
    reference: string;
    status: string;
}

export interface VerifyPaymentResponse {
    status: string;
    transaction: any;
}

export const flutterwaveService = {
    /**
     * Initialize a payment
     */
    async initializePayment(params: InitializePaymentParams): Promise<PaymentResponse> {
        const response = await apiClient.post('/payments/initialize', params);
        return response.data;
    },

    /**
     * Verify a payment
     */
    async verifyPayment(txRef: string): Promise<VerifyPaymentResponse> {
        const response = await apiClient.post(`/payments/verify/${txRef}`);
        return response.data;
    },

    /**
     * Get transaction details
     */
    async getTransaction(id: string) {
        const response = await apiClient.get(`/payments/transaction/${id}`);
        return response.data;
    },

    /**
     * Get user's payment history
     */
    async getUserTransactions() {
        const response = await apiClient.get('/payments/user/transactions');
        return response.data;
    },
};
