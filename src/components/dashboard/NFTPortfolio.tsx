'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { investmentService } from '@/lib/investment-service';
import { marketplaceService } from '@/lib/marketplace-service';
import { formatDistanceToNow } from 'date-fns';
import { openWeb3Modal } from '@/providers/Web3Provider';

interface Investment {
  id: string;
  amount: number;
  currency?: string;
  walletAddress?: string | null;
  nftMinted?: boolean;
  listed?: boolean;
  nftProjectId?: number | null;
  nftTokenAmount?: number | null;
  nftTxHash?: string | null;
  status: string;
  createdAt: string;
  project?: { id: string; title?: string; type?: string };
}

interface CreateListingModalProps {
  investment: Investment;
  walletAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateListingModal({ investment, walletAddress, onClose, onSuccess }: CreateListingModalProps) {
  const [priceEth, setPriceEth] = useState('');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleList = async () => {
    if (!priceEth || isNaN(Number(priceEth)) || Number(priceEth) <= 0) {
      setError('Enter a valid ETH price per token');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // On Base Sepolia, the marketplace listing is done on-chain by the user's wallet.
      // For now, we simulate the on-chain tx and record in backend.
      // In production, this would call writeContract (createListing) via wagmi.
      const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(days) * 86400;
      const mockTxHash = `0x${'0'.repeat(62)}${Math.floor(Math.random() * 99).toString(16).padStart(2, '0')}`;
      const mockOnchainId = Math.floor(Math.random() * 100000);

      await marketplaceService.recordListing({
        projectOnchainId: investment.nftProjectId ?? 0,
        tokenAmount: investment.nftTokenAmount ?? 1,
        pricePerTokenEth: Number(priceEth),
        expiryTimestamp,
        partialFill: true,
        minPurchase: 1,
        onchainListingId: mockOnchainId,
        createTxHash: mockTxHash,
        sellerWallet: walletAddress,
        projectId: investment.project?.id,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold text-white mb-1">List NFT for Sale</h3>
        <p className="text-gray-400 text-sm mb-5">
          Project: <span className="text-purple-300">{investment.project?.title || `#${investment.nftProjectId}`}</span>
          &nbsp;·&nbsp;{investment.nftTokenAmount?.toLocaleString()} tokens
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Price per token (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={priceEth}
              onChange={e => setPriceEth(e.target.value)}
              className="w-full bg-[#0d1117] border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="0.001"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Expires in (days)</label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full bg-[#0d1117] border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              {['7', '14', '30', '60', '90'].map(d => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
          {priceEth && investment.nftTokenAmount && (
            <div className="bg-purple-500/10 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Total value</span>
                <span className="text-white font-medium">{(Number(priceEth) * investment.nftTokenAmount).toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between text-gray-400 mt-1">
                <span>Marketplace fee (2.5%)</span>
                <span className="text-yellow-400">-{(Number(priceEth) * investment.nftTokenAmount * 0.025).toFixed(6)} ETH</span>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleList}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Listing...' : 'List for Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NFTPortfolio() {
  const { address, isConnected } = useAccount();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await investmentService.getMyInvestments();
      // Filter to only ROI investments that have been minted
      const nftInvestments = (data as any[]).filter(
        (inv: any) => inv.nftMinted || inv.nftProjectId
      );
      setInvestments(nftInvestments as Investment[]);
    } catch {
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 rounded-xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-b from-purple-900/10 to-transparent rounded-2xl border border-purple-500/20">
        <div className="text-5xl mb-3">🎫</div>
        <p className="text-gray-400 font-medium">No Investment NFTs yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Invest in an ROI project to receive your first NFT
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Wallet connection banner */}
      {!isConnected && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Connect wallet to trade NFTs</p>
            <p className="text-gray-400 text-xs mt-0.5">
              MetaMask or WalletConnect required to list or buy
            </p>
          </div>
          <button
            onClick={() => openWeb3Modal()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Connect
          </button>
        </div>
      )}

      <div className="space-y-3">
        {investments.map(inv => (
          <div
            key={inv.id}
            className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 hover:border-purple-500/40 transition-all"
          >
            {/* Status badge */}
            <div className="absolute top-3 right-3">
              {inv.listed ? (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  Listed
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  Holding
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              {/* NFT icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                🎫
              </div>

              <div className="flex-1 min-w-0 pr-16">
                <p className="text-white font-semibold truncate">
                  {inv.project?.title || `Project #${inv.nftProjectId}`}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {inv.nftTokenAmount?.toLocaleString() ?? '?'} tokens
                  &nbsp;·&nbsp;
                  <span className="text-purple-300">
                    {inv.currency ?? 'UGX'} {inv.amount.toLocaleString()} invested
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {inv.nftTxHash ? (
                    <a
                      href={`https://sepolia.basescan.org/tx/${inv.nftTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition"
                    >
                      Tx: {inv.nftTxHash.slice(0, 10)}…
                    </a>
                  ) : (
                    'Minting pending'
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            {isConnected && !inv.listed && inv.nftMinted && (
              <button
                onClick={() => setSelectedInvestment(inv)}
                className="mt-3 w-full py-2 rounded-xl border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-500/10 transition"
              >
                List for Sale
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedInvestment && address && (
        <CreateListingModal
          investment={selectedInvestment}
          walletAddress={address}
          onClose={() => setSelectedInvestment(null)}
          onSuccess={loadInvestments}
        />
      )}
    </>
  );
}
