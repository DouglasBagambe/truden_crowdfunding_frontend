import { apiClient } from './api-client';

export interface NFTData {
    tokenId: number;
    projectId: string;
    investor: string;
    initialAmount: string;
    currentValue: string;
    investmentDate: Date;
    isActive: boolean;
    investmentId: string;
    profitLoss: string;
    roiPercentage: number;
}

export interface InvestorNFTsResponse {
    tokenIds: number[];
    count: number;
    message?: string;
}

export interface ProjectNFTsResponse {
    tokenIds: number[];
    count: number;
    message?: string;
}

export const investmentNFTService = {
    /**
     * Get all NFT token IDs owned by an investor
     */
    async getInvestorNFTs(investorAddress: string): Promise<InvestorNFTsResponse> {
        try {
            const response = await apiClient.get<InvestorNFTsResponse>(
                `/investments/nfts/${investorAddress}`
            );
            return response.data;
        } catch (error) {
            console.error('Failed to fetch investor NFTs:', error);
            return { tokenIds: [], count: 0, message: 'Failed to fetch NFTs' };
        }
    },

    /**
     * Get detailed data for a specific NFT by token ID
     */
    async getNFTData(tokenId: number): Promise<NFTData | null> {
        try {
            const response = await apiClient.get<NFTData>(`/investments/nft/${tokenId}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch NFT data for token ${tokenId}:`, error);
            return null;
        }
    },

    /**
     * Get all NFT token IDs for a specific project
     */
    async getProjectNFTs(projectId: string): Promise<ProjectNFTsResponse> {
        try {
            const response = await apiClient.get<ProjectNFTsResponse>(
                `/investments/project/${projectId}/nfts`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch project NFTs for ${projectId}:`, error);
            return { tokenIds: [], count: 0, message: 'Failed to fetch NFTs' };
        }
    },

    /**
     * Get full NFT data for all NFTs owned by an investor
     */
    async getInvestorNFTsWithData(investorAddress: string): Promise<NFTData[]> {
        try {
            const { tokenIds } = await this.getInvestorNFTs(investorAddress);

            if (tokenIds.length === 0) {
                return [];
            }

            const nftsData = await Promise.all(
                tokenIds.map(tokenId => this.getNFTData(tokenId))
            );

            return nftsData.filter((nft): nft is NFTData => nft !== null);
        } catch (error) {
            console.error('Failed to fetch investor NFTs with data:', error);
            return [];
        }
    },

    /**
     * Calculate total portfolio value from NFTs
     */
    calculatePortfolioValue(nfts: NFTData[]): {
        totalInitialInvestment: number;
        totalCurrentValue: number;
        totalProfitLoss: number;
        averageROI: number;
    } {
        if (nfts.length === 0) {
            return {
                totalInitialInvestment: 0,
                totalCurrentValue: 0,
                totalProfitLoss: 0,
                averageROI: 0,
            };
        }

        const totalInitialInvestment = nfts.reduce(
            (sum, nft) => sum + parseFloat(nft.initialAmount),
            0
        );

        const totalCurrentValue = nfts.reduce(
            (sum, nft) => sum + parseFloat(nft.currentValue),
            0
        );

        const totalProfitLoss = totalCurrentValue - totalInitialInvestment;

        const averageROI = nfts.reduce(
            (sum, nft) => sum + nft.roiPercentage,
            0
        ) / nfts.length;

        return {
            totalInitialInvestment,
            totalCurrentValue,
            totalProfitLoss,
            averageROI,
        };
    },
};
