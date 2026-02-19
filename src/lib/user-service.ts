import { apiClient } from './api-client';

export const userService = {
  async getMe() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.patch('/users/me/profile', data);
    return response.data;
  },

  async getSiweNonce(address: string) {
    const response = await apiClient.post('/auth/siwe/nonce', { address });
    return response.data.nonce;
  },

  async linkWallet(data: { wallet: string; message: string; signature: string }) {
    const response = await apiClient.post('/users/me/wallets', data);
    return response.data;
  },

  async unlinkWallet(wallet: string) {
    const response = await apiClient.delete(`/users/me/wallets/${wallet}`);
    return response.data;
  },

  async submitKyc(data: any) {
    const response = await apiClient.patch('/users/me/kyc', data);
    return response.data;
  },

  async startSmileKyc(data: any) {
    const response = await apiClient.post('/users/me/kyc/session', data);
    return response.data;
  },

  async submitCreatorVerification(data: any) {
    const response = await apiClient.post('/users/me/creator-verification', data);
    return response.data;
  }
};
