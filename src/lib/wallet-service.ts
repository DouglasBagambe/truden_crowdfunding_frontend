import { apiClient } from './api-client';

export interface WalletBalance {
    fiatBalance: {
        UGX: number;
        USD: number;
    };
    cryptoBalance: {
        ETH: number;
        USDC: number;
    };
    totalBalanceUSD: number;
}

export interface DepositParams {
    amount: number;
    currency: string;
    redirectUrl: string;
}

export interface WithdrawParams {
    amount: number;
    currency: string;
    withdrawalMethodIndex: number;
}

export interface AddWithdrawalMethodParams {
    type: 'mobile_money' | 'bank_account';
    provider: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
}

export interface WalletInvestmentParams {
    amount: number;
    currency: string;
    projectId: string;
}

export const walletService = {
    /**
     * Get wallet balance
     */
    async getBalance(): Promise<WalletBalance> {
        const response = await apiClient.get('/wallet/balance');
        return response.data;
    },

    /**
     * Get full wallet details
     */
    async getWallet() {
        const response = await apiClient.get('/wallet');
        return response.data;
    },

    /**
     * Deposit to wallet
     */
    async deposit(params: DepositParams) {
        const response = await apiClient.post('/wallet/deposit', params);
        return response.data;
    },

    /**
     * Invest using wallet balance
     */
    async invest(params: WalletInvestmentParams) {
        const response = await apiClient.post('/wallet/invest', params);
        return response.data;
    },

    /**
     * Withdraw from wallet
     */
    async withdraw(params: WithdrawParams) {
        const response = await apiClient.post('/wallet/withdraw', params);
        return response.data;
    },

    /**
     * Add withdrawal method
     */
    async addWithdrawalMethod(params: AddWithdrawalMethodParams) {
        const response = await apiClient.post('/wallet/withdrawal-method', params);
        return response.data;
    },

    /**
     * Get wallet transactions
     */
    async getTransactions() {
        const response = await apiClient.get('/wallet/transactions');
        return response.data;
    },
};
