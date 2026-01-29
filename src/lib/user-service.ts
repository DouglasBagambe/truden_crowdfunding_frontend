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

  async linkWallet(wallet: string) {
    const response = await apiClient.post('/users/me/wallets', { wallet });
    return response.data;
  },

  async unlinkWallet(wallet: string) {
    const response = await apiClient.delete(`/users/me/wallets/${wallet}`);
    return response.data;
  }
};
