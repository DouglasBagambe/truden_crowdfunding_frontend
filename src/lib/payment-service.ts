import { apiClient } from "./api-client";

export interface DPOInitResponse {
  token: string;
  redirectUrl: string;
  status: string;
  quote?: DPOQuoteResponse;
}

export interface DPOVerifyResponse {
  status:
    | "pending"
    | "authorized"
    | "captured"
    | "settled"
    | "released"
    | "refunded"
    | "failed"
    | "reversed"
    | "adjusted";
  paymentIntentId: string;
  verify: {
    status: string;
    message: string;
    transactionRef?: string;
    amount?: string;
    currency?: string;
    companyRef?: string;
    netAmount?: string;
    vatAmount?: string;
  };
}

export interface DPOQuoteResponse {
  projectId: string;
  projectType: string;
  projectName: string;
  currency: string;
  requestedAmount: number;
  grossAmount: number;
  dpoFee: number;
  dpoVat: number;
  keiboFee: number;
  providerNetAmount: number;
  projectNetAmount: number;
  roundingAdjustment: number;
  /** Present for ROI projects only. Used by UI to display testing-mode banner. */
  roi?: {
    bypassActive: boolean;
    nftMintingEnabled: boolean;
  };
}

export const paymentService = {
  /**
   * Step 1: Create a DPO payment token.
   * Returns a redirectUrl — send user there to pay via DPO hosted page.
   */
  async initializeDPOPayment(params: {
    paymentIntentId: string;
    projectId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    projectType?: string;
    description?: string;
    donorName?: string;
    walletAddress?: string;
  }): Promise<DPOInitResponse> {
    const response = await apiClient.post("/payments/dpo/initialize", {
      paymentIntentId: params.paymentIntentId,
      projectId: params.projectId,
      amount: params.amount,
      currency: params.currency ?? "UGX",
      paymentMethod: params.paymentMethod ?? "card",
      projectType: params.projectType,
      description: params.description,
      donorName: params.donorName,
      walletAddress: params.walletAddress,
    });
    return response.data;
  },

  async getDPOPaymentQuote(params: {
    projectId: string;
    amount: number;
    currency?: string;
  }): Promise<DPOQuoteResponse> {
    const response = await apiClient.post<DPOQuoteResponse>(
      "/payments/dpo/quote",
      {
        projectId: params.projectId,
        amount: params.amount,
        currency: params.currency ?? "UGX",
      },
    );
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
