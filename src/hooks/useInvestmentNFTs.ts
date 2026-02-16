import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { INVESTMENT_NFT_ADDRESS } from '@/constants/contracts';
import { InvestmentNFTABI } from '@/contracts/InvestmentNFT';

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
    abi: InvestmentNFTABI,
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
    abi: InvestmentNFTABI,
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
    abi: InvestmentNFTABI,
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
    abi: InvestmentNFTABI,
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
