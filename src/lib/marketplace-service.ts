import { apiClient } from './api-client';

export interface MarketplaceListing {
    _id: string;
    onchainListingId: number;
    projectOnchainId: number;
    projectId?: string;
    sellerId: string;
    sellerWallet: string;
    tokenAmount: number;
    pricePerTokenWei: string;
    pricePerTokenEth: number;
    totalValueEth: number;
    originalFiatValue: number;
    paymentToken: string;
    expiryTimestamp: number;
    partialFill: boolean;
    minPurchase: number;
    status: 'active' | 'sold' | 'cancelled' | 'expired';
    createTxHash?: string;
    projectTitle?: string;
    createdAt: string;
}

export interface ListingsResponse {
    items: MarketplaceListing[];
    total: number;
}

export interface CreateListingPayload {
    projectOnchainId: number;
    tokenAmount: number;
    pricePerTokenEth: number;
    paymentToken?: string;
    expiryTimestamp: number;
    partialFill?: boolean;
    minPurchase?: number;
    onchainListingId: number;
    createTxHash: string;
    sellerWallet: string;
    projectId?: string;
}

export interface RecordPurchasePayload {
    tokenAmount: number;
    buyerWallet: string;
    purchaseTxHash: string;
}

export const marketplaceService = {
    async getListings(params?: {
        projectOnchainId?: number;
        sellerId?: string;
        skip?: number;
        limit?: number;
    }): Promise<ListingsResponse> {
        const response = await apiClient.get('/marketplace/listings', { params });
        return response.data;
    },

    async getListing(id: string): Promise<MarketplaceListing> {
        const response = await apiClient.get(`/marketplace/listings/${id}`);
        return response.data;
    },

    async getMyListings(): Promise<MarketplaceListing[]> {
        const response = await apiClient.get('/marketplace/listings/mine');
        return response.data;
    },

    async recordListing(payload: CreateListingPayload): Promise<MarketplaceListing> {
        const response = await apiClient.post('/marketplace/listings', payload);
        return response.data;
    },

    async cancelListing(id: string): Promise<MarketplaceListing> {
        const response = await apiClient.delete(`/marketplace/listings/${id}`);
        return response.data;
    },

    async recordPurchase(
        listingId: string,
        payload: RecordPurchasePayload,
    ): Promise<{ listing: MarketplaceListing }> {
        const response = await apiClient.post(
            `/marketplace/listings/${listingId}/purchase`,
            payload,
        );
        return response.data;
    },
};
