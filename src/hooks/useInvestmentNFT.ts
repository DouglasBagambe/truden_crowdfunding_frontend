import { useReadContract, useAccount } from 'wagmi';
import { Address } from 'viem';
import InvestmentNFTArtifact from '@/abis/InvestmentNFT.json';
import { useState, useEffect } from 'react';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;

export function useInvestmentNFT(projectOnChainId?: string | number) {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<number>(0);

  // Convert to BigInt for the contract call, handle undefined/null
  const tokenId = projectOnChainId ? BigInt(projectOnChainId) : BigInt(0);

  const { data, isError, isLoading, refetch } = useReadContract({
    address: NFT_ADDRESS,
    abi: InvestmentNFTArtifact.abi,
    functionName: 'balanceOf',
    args: [address as Address, tokenId],
    query: {
      enabled: isConnected && !!address && !!projectOnChainId,
    },
  });

  useEffect(() => {
    if (data) {
      // Data is returned as bigint
      setBalance(Number(data));
    } else {
      setBalance(0);
    }
  }, [data]);

  return {
    balance,
    hasInvestment: balance > 0,
    isLoading,
    isError,
    refetch,
    nftAddress: NFT_ADDRESS,
  };
}
