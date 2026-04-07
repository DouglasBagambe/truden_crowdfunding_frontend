/**
 * NFT Investment Hooks
 *
 * ⚠️  TEMPORARILY DISABLED
 * These hooks depend on `investment-nft-service.ts` and wagmi/blockchain.
 * Preserved in full in the `blockchain/nfts-future` branch.
 *
 * Stub exports so any imports of this file don't break the build.
 */

export const useInvestorNFTs = () => ({ data: undefined, isLoading: false, error: null });
export const useNFTData = () => ({ data: null, isLoading: false, error: null });
export const useInvestorNFTsWithData = () => ({ data: [], isLoading: false, error: null });
export const useProjectNFTs = () => ({ data: undefined, isLoading: false, error: null });
export const useNFTPortfolioMetrics = () => ({
  metrics: { totalInitialInvestment: 0, totalCurrentValue: 0, totalProfitLoss: 0, averageROI: 0 },
  nfts: [],
  isLoading: false,
  error: null,
});
export const useInvestmentNFTs = () => ({
  nfts: [],
  balance: 0,
  isLoading: false,
  error: null,
  hasNFTs: false,
});
export const useNFTMetadata = () => ({ metadata: null, tokenURI: undefined, isLoading: false });
