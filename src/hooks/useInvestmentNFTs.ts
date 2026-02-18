import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { investmentNFTService, type NFTData, type InvestorNFTsResponse } from '@/lib/investment-nft-service';

/**
 * Hook to fetch all NFT token IDs for an investor
 */
export function useInvestorNFTs(investorAddress?: string): UseQueryResult<InvestorNFTsResponse> {
    return useQuery({
        queryKey: ['investor-nfts', investorAddress],
        queryFn: () => investmentNFTService.getInvestorNFTs(investorAddress!),
        enabled: !!investorAddress,
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to fetch detailed data for a specific NFT
 */
export function useNFTData(tokenId?: number): UseQueryResult<NFTData | null> {
    return useQuery({
        queryKey: ['nft-data', tokenId],
        queryFn: () => investmentNFTService.getNFTData(tokenId!),
        enabled: !!tokenId && tokenId > 0,
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook to fetch all NFTs with full data for an investor
 */
export function useInvestorNFTsWithData(investorAddress?: string): UseQueryResult<NFTData[]> {
    return useQuery({
        queryKey: ['investor-nfts-data', investorAddress],
        queryFn: () => investmentNFTService.getInvestorNFTsWithData(investorAddress!),
        enabled: !!investorAddress,
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to fetch all NFT token IDs for a project
 */
export function useProjectNFTs(projectId?: string): UseQueryResult<InvestorNFTsResponse> {
    return useQuery({
        queryKey: ['project-nfts', projectId],
        queryFn: () => investmentNFTService.getProjectNFTs(projectId!),
        enabled: !!projectId,
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook to calculate portfolio metrics from NFTs
 */
export function useNFTPortfolioMetrics(investorAddress?: string) {
    const { data: nfts, isLoading, error } = useInvestorNFTsWithData(investorAddress);

    const metrics = nfts ? investmentNFTService.calculatePortfolioValue(nfts) : {
        totalInitialInvestment: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        averageROI: 0,
    };

    return {
        metrics,
        nfts: nfts || [],
        isLoading,
        error,
    };
}
