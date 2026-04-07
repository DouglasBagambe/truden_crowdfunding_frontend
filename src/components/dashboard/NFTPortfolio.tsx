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
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h3 className="mb-1 text-xl font-bold text-[var(--text-main)]">List NFT for Sale</h3>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          Project: <span className="text-blue-700 dark:text-blue-300">{investment.project?.title || `#${investment.nftProjectId}`}</span>
          &nbsp;·&nbsp;{investment.nftTokenAmount?.toLocaleString()} tokens
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--text-main)]">Price per token (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={priceEth}
              onChange={e => setPriceEth(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
              placeholder="0.001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-main)]">Expires in (days)</label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-blue-500"
            >
              {['7', '14', '30', '60', '90'].map(d => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
          {priceEth && investment.nftTokenAmount && (
            <div className="rounded-lg border border-blue-200/60 bg-blue-50 p-3 text-sm dark:border-blue-900/30 dark:bg-blue-950/20">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Total value</span>
                <span className="font-medium text-[var(--text-main)]">{(Number(priceEth) * investment.nftTokenAmount).toFixed(6)} ETH</span>
              </div>
              <div className="mt-1 flex justify-between text-[var(--text-muted)]">
                <span>Marketplace fee (2.5%)</span>
                <span className="text-amber-600 dark:text-amber-400">-{(Number(priceEth) * investment.nftTokenAmount * 0.025).toFixed(6)} ETH</span>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-[var(--text-muted)] transition hover:bg-[var(--background)]"
          >
            Cancel
          </button>
          <button
            onClick={handleList}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
  const marketplaceEnabled =
    String(process.env.NEXT_PUBLIC_ENABLE_NFT_MARKETPLACE || '').toLowerCase() === 'true';
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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
        <div className="text-5xl mb-3">🎫</div>
        <p className="font-medium text-[var(--text-main)]">No Investment NFTs yet</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Invest in an ROI project to receive your first NFT
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Wallet connection banner */}
      {!isConnected && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200/60 bg-blue-50 px-4 py-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Connect wallet to trade NFTs</p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
              MetaMask or WalletConnect required to list or buy
            </p>
          </div>
          <button
            onClick={() => openWeb3Modal()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Connect
          </button>
        </div>
      )}

      <div className="space-y-3">
        {investments.map(inv => (
          <div
            key={inv.id}
            className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-blue-400/60 hover:shadow-lg"
          >
            {/* Status badge */}
            <div className="absolute top-3 right-3">
              {inv.listed ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                  Listed
                </span>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                  Holding
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              {/* NFT icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-blue-950/20">
                🎫
              </div>

              <div className="flex-1 min-w-0 pr-16">
                <p className="truncate font-semibold text-[var(--text-main)]">
                  {inv.project?.title || `Project #${inv.nftProjectId}`}
                </p>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  {inv.nftTokenAmount?.toLocaleString() ?? '?'} tokens
                  &nbsp;·&nbsp;
                  <span className="text-blue-700 dark:text-blue-300">
                    {inv.currency ?? 'UGX'} {inv.amount.toLocaleString()} invested
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {inv.nftTxHash ? (
                    <a
                      href={`https://sepolia.basescan.org/tx/${inv.nftTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-blue-600 dark:hover:text-blue-300"
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
            {isConnected && marketplaceEnabled && !inv.listed && inv.nftMinted && (
              <button
                onClick={() => setSelectedInvestment(inv)}
                className="mt-3 w-full py-2 rounded-xl border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-500/10 transition"
              >
                List for Sale
              </button>
            )}

            {isConnected && !marketplaceEnabled && inv.nftMinted && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Marketplace trading is temporarily disabled while settlement verification is being hardened.
              </p>
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
