import { apiClient } from "./api-client";

type ProfileUpdate = Record<string, unknown>;
type CreatorVerificationSubmission = Record<string, unknown>;

export const userService = {
  async getMe() {
    const response = await apiClient.get("/users/me");
    return response.data;
  },

  async updateProfile(data: ProfileUpdate) {
    const response = await apiClient.patch("/users/me/profile", data);
    return response.data;
  },

  async getSiweChallenge(address: string, purpose: "link" | "unlink" = "link") {
    const response = await apiClient.post<{
      nonce: string;
      purpose: "link" | "unlink";
      domain: string;
      uri: string;
      chainIds: number[];
      issuedAt: string;
      expiresAt: string;
    }>("/auth/siwe/nonce", { address, purpose });
    return response.data;
  },

  async linkWallet(data: {
    wallet: string;
    message: string;
    signature: string;
  }) {
    const response = await apiClient.post("/users/me/wallets", data);
    return response.data;
  },

  async unlinkWallet(data: {
    wallet: string;
    message: string;
    signature: string;
  }) {
    const response = await apiClient.delete(
      `/users/me/wallets/${data.wallet}`,
      {
        data,
      },
    );
    return response.data;
  },
  async submitCreatorVerification(data: CreatorVerificationSubmission) {
    const response = await apiClient.post(
      "/users/me/creator-verification",
      data,
    );
    return response.data;
  },
};
