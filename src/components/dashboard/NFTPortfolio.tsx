'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Loader2, Wallet, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────
interface NFTItem {
    tokenId: number;
    projectId: string;
    initialAmount: string;
    currentValue: string;
    profitLoss: string;
    roiPercentage: number;
    isActive: boolean;
    investmentDate: Date;
}

interface CustodialInfo {
    address: string;
    nfts: NFTItem[];
}

// ─── Subcomponents ────────────────────────────────────────────
function WalletBadge({ address }: { address: string }) {
    const [copied, setCopied] = useState(false);
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

    const copy = () => {
        navigator.clipboard?.writeText(address).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex items-center gap-3 bg-[var(--secondary)] border border-[var(--border)] rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Your Custodial Wallet</p>
                <p className="font-mono text-sm font-bold text-[var(--text-main)] truncate">{short}</p>
            </div>
            <button
                onClick={copy}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Copy address"
            >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
}

function NFTCard({ nft }: { nft: NFTItem }) {
    const isProfit = parseFloat(nft.profitLoss) >= 0;
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card)] rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[var(--border)]"
        >
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Investment NFT</p>
                        <h3 className="text-white text-xl font-black">#{nft.tokenId}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${nft.isActive
                        ? 'bg-emerald-400/20 text-emerald-100'
                        : 'bg-gray-400/20 text-gray-100'}`}>
                        {nft.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Invested</p>
                        <p className="text-base font-black">{parseFloat(nft.initialAmount).toLocaleString()} UGX</p>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Current</p>
                        <p className="text-base font-black">{parseFloat(nft.currentValue).toLocaleString()} UGX</p>
                    </div>
                </div>

                <div className="bg-[var(--secondary)] rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isProfit
                                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                : <TrendingDown className="w-4 h-4 text-rose-400" />}
                            <span className="text-xs font-bold text-[var(--text-muted)]">ROI</span>
                        </div>
                        <span className={`text-base font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}{nft.roiPercentage.toFixed(2)}%
                        </span>
                    </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] font-medium">
                    Invested {new Date(nft.investmentDate).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>

                <a
                    href={`https://testnets.opensea.io/assets/sepolia/${contractAddress}/${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                    <ExternalLink className="w-3.5 h-3.5" /> View NFT
                </a>
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────
export function NFTPortfolio() {
    const { user, isAuthenticated } = useAuth();
    const [info, setInfo] = useState<CustodialInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError('');

        apiClient
            .get<{ custodialWalletAddress?: string; nfts?: NFTItem[] }>('/users/me/wallet')
            .then((res) => {
                const addr = res.data?.custodialWalletAddress;
                const nfts = res.data?.nfts ?? [];
                if (addr) {
                    setInfo({ address: addr, nfts });
                }
            })
            .catch(() => {
                setError('Could not load wallet information');
            })
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto border border-[var(--border)]">
                    <Wallet className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-black">Sign In to View NFTs</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium">
                    Log in to see your investment NFTs and custodial wallet.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Loading your NFT portfolio…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16 space-y-4">
                <p className="text-rose-400 font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-black">
                    Retry
                </button>
            </div>
        );
    }

    const nfts = info?.nfts ?? [];

    return (
        <div className="space-y-6">
            {/* Wallet Address */}
            {info?.address && <WalletBadge address={info.address} />}

            {nfts.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto border border-[var(--border)]">
                        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="font-black text-lg">No Investment NFTs Yet</h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                        When you invest in a project, you'll receive an NFT certificate representing your stake.
                    </p>
                    <a href="/explore" className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
                        Explore Projects
                    </a>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total NFTs', value: String(nfts.length) },
                            { label: 'Total Invested', value: `${nfts.reduce((s, n) => s + parseFloat(n.initialAmount), 0).toLocaleString()} UGX` },
                            { label: 'Current Value', value: `${nfts.reduce((s, n) => s + parseFloat(n.currentValue), 0).toLocaleString()} UGX` },
                            {
                                label: 'Avg ROI',
                                value: `${(nfts.reduce((s, n) => s + n.roiPercentage, 0) / nfts.length).toFixed(1)}%`,
                                green: nfts.reduce((s, n) => s + n.roiPercentage, 0) / nfts.length >= 0,
                            },
                        ].map((card) => (
                            <div key={card.label} className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{card.label}</p>
                                <p className={`text-xl font-black ${card.green !== undefined ? (card.green ? 'text-emerald-400' : 'text-rose-400') : ''}`}>
                                    {card.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* NFT Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {nfts.map((nft) => <NFTCard key={nft.tokenId} nft={nft} />)}
                    </div>
                </>
            )}
        </div>
    );
}

