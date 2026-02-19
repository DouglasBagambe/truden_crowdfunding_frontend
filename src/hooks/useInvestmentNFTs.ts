import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { investmentNFTService, type NFTData, type InvestorNFTsResponse } from '@/lib/investment-nft-service';
import { INVESTMENT_NFT_ADDRESS, INVESTMENT_NFT_ABI } from '@/constants/contracts';

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

/**
 * Hook to fetch and sync NFT ownership for the connected wallet
 * Automatically updates when new NFTs are minted or transferred
 */
export function useInvestmentNFTs() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-nfts', address],
    queryFn: async () => {
      if (!address || !isConnected) return { tokenIds: [], count: 0 };
      return investmentNFTService.getInvestorNFTs(address);
    },
    enabled: !!address && isConnected,
    staleTime: 30000,
  });

  const tokenIds = data?.tokenIds ?? [];
  const balance = tokenIds.length;

  return {
    nfts: tokenIds.map((tokenId) => ({ tokenId, owner: address })),
    balance,
    isLoading,
    error,
    hasNFTs: balance > 0,
  };
}

/**
 * Hook to get detailed NFT metadata
 */
export function useNFTMetadata(tokenId: number) {
  const { data: tokenURI } = useReadContract({
    address: INVESTMENT_NFT_ADDRESS,
    abi: INVESTMENT_NFT_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: {
      enabled: tokenId !== undefined,
    },
  });

  // Fetch and parse metadata from tokenURI
  const { data: metadata, isLoading } = useQuery({
    queryKey: ['nft-metadata', tokenId],
    queryFn: async () => {
      if (!tokenURI) return null;

      try {
        // Handle both IPFS and HTTP URIs
        const uri = tokenURI.toString().replace('ipfs://', 'https://ipfs.io/ipfs/');
        const response = await fetch(uri);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return null;
      }
    },
    enabled: !!tokenURI,
    staleTime: Infinity, // Metadata rarely changes
  });

  return {
    metadata,
    tokenURI,
    isLoading,
  };
}
