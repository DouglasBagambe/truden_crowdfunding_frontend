import { apiClient } from './api-client';

export interface DPOInitializeResult {
  transactionId: string;
  token: string;
  instructions: string | null;
  status: string;
}

export interface DPOVerifyResult {
  status: 'pending' | 'successful' | 'failed';
  verify: {
    status: string;
    message: string;
    transactionRef?: string;
    amount?: string;
    currency?: string;
  };
}

export const dpoService = {
  /**
   * Step 1: Initialize a DPO payment (mobile money or card).
   */
  async initialize(params: {
    projectId: string;
    amount: number;
    currency?: string;
    paymentMethod: 'mobile_money' | 'card';
    phoneNumber?: string;
    mno?: 'MTN' | 'AIRTEL';
    card?: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      holderName: string;
    };
  }): Promise<DPOInitializeResult> {
    const res = await apiClient.post<DPOInitializeResult>('/payments/dpo/initialize', params);
    return res.data;
  },

  /**
   * Step 2: Poll for payment status.
   */
  async verify(token: string): Promise<DPOVerifyResult> {
    const res = await apiClient.get<DPOVerifyResult>(`/payments/dpo/verify/${token}`);
    return res.data;
  },

  /**
   * Poll until confirmed or timed out.
   * Resolves with the final status string.
   */
  async pollUntilComplete(
    token: string,
    onUpdate?: (status: string) => void,
    maxAttempts = 36,
    intervalMs = 5000,
  ): Promise<'successful' | 'failed' | 'timeout'> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        const result = await dpoService.verify(token);
        onUpdate?.(result.status);
        if (result.status === 'successful') return 'successful';
        if (result.status === 'failed') return 'failed';
      } catch {
        // network error — keep polling
      }
    }
    return 'timeout';
  },
};
