import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
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
  const queryClient = useQueryClient();

  // Fetch NFT balance
  const { data: balance = 0n } = useReadContract({
    address: INVESTMENT_NFT_ADDRESS,
    abi: INVESTMENT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Fetch all NFT token IDs owned by the user
  const { data: nftData, isLoading, error } = useQuery({
    queryKey: ['user-nfts', address],
    queryFn: async () => {
      if (!address || !isConnected || balance === 0n) {
        return [];
      }

      const nfts = [];
      const balanceNumber = Number(balance);

      // Fetch each token ID
      for (let i = 0; i < balanceNumber; i++) {
        try {
          // This would need to be implemented based on your NFT contract
          // Most NFT contracts have tokenOfOwnerByIndex or similar
          // For now, we'll return a placeholder structure
          nfts.push({
            tokenId: i,
            owner: address,
          });
        } catch (err) {
          console.error(`Error fetching token ${i}:`, err);
        }
      }

      return nfts;
    },
    enabled: !!address && isConnected && balance > 0n,
    staleTime: 30000,
  });

  // Watch for NFT transfers TO this address
  useWatchContractEvent({
    address: INVESTMENT_NFT_ADDRESS,
    abi: INVESTMENT_NFT_ABI,
    eventName: 'Transfer',
    args: {
      to: address,
    },
    onLogs: (logs) => {
      console.log('[NFT Sync] Received NFT:', logs);
      // Invalidate queries to refresh NFT list
      queryClient.invalidateQueries({ queryKey: ['user-nfts', address] });
      queryClient.invalidateQueries({ queryKey: ['user-investments', address] });
    },
    enabled: !!address && isConnected,
  });

  // Watch for NFT transfers FROM this address
  useWatchContractEvent({
    address: INVESTMENT_NFT_ADDRESS,
    abi: INVESTMENT_NFT_ABI,
    eventName: 'Transfer',
    args: {
      from: address,
    },
    onLogs: (logs) => {
      console.log('[NFT Sync] Transferred NFT:', logs);
      // Invalidate queries to refresh NFT list
      queryClient.invalidateQueries({ queryKey: ['user-nfts', address] });
      queryClient.invalidateQueries({ queryKey: ['user-investments', address] });
    },
    enabled: !!address && isConnected,
  });

  return {
    nfts: nftData || [],
    balance: Number(balance),
    isLoading,
    error,
    hasNFTs: balance > 0n,
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
