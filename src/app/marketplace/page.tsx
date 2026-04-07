'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { marketplaceService, MarketplaceListing } from '@/lib/marketplace-service';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
    ArrowLeft,
    RefreshCw,
    Wallet,
    TrendingUp,
    Clock,
    Tag,
    Layers,
    ShoppingCart,
    X,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRoiAccess } from '@/hooks/useRoiAccess';
import toast from 'react-hot-toast';
import { openWeb3Modal } from '@/providers/Web3Provider';

// ─── BuyModal ────────────────────────────────────────────────────────────────

function BuyModal({
    listing,
    walletAddress,
    onClose,
    onSuccess,
}: {
    listing: MarketplaceListing;
    walletAddress: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [tokenAmount, setTokenAmount] = useState(listing.minPurchase);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const totalEth = (listing.pricePerTokenEth * tokenAmount).toFixed(6);
    const fee = (listing.pricePerTokenEth * tokenAmount * 0.025).toFixed(6);
    const sellerGets = (listing.pricePerTokenEth * tokenAmount * 0.975).toFixed(6);

    const handleBuy = async () => {
        setLoading(true);
        setError('');
        try {
            const mockTxHash = `0x${'a'.repeat(62)}${Math.floor(Math.random() * 99).toString(16).padStart(2, '0')}`;
            await marketplaceService.recordPurchase(listing._id, {
                tokenAmount,
                buyerWallet: walletAddress,
                purchaseTxHash: mockTxHash,
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Purchase failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Buy Investment Stake</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">
                            {listing.projectTitle || `Project #${listing.projectOnchainId}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[var(--text-muted)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {listing.partialFill && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
                                Tokens to buy
                                <span className="text-[var(--text-muted)] font-normal ml-1">(max {listing.tokenAmount.toLocaleString()})</span>
                            </label>
                            <input
                                type="number"
                                min={listing.minPurchase}
                                max={listing.tokenAmount}
                                value={tokenAmount}
                                onChange={e => setTokenAmount(Math.min(Number(e.target.value), listing.tokenAmount))}
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                            />
                        </div>
                    )}

                    {/* Price breakdown */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2.5 text-sm border border-[var(--border)]">
                        <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Price per token</span>
                            <span className="font-semibold text-[var(--text-main)]">{listing.pricePerTokenEth} ETH</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Quantity</span>
                            <span className="font-semibold text-[var(--text-main)]">× {tokenAmount.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-[var(--border)] pt-2.5 flex justify-between">
                            <span className="text-[var(--text-muted)]">Subtotal</span>
                            <span className="font-bold text-[var(--text-main)]">{totalEth} ETH</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Marketplace fee (2.5%)</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">−{fee} ETH</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Seller receives</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{sellerGets} ETH</span>
                        </div>
                    </div>

                    <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p>You will receive the investment stake and rights to future ROI from this project.</p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBuy}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Confirming...' : `Buy · ${totalEth} ETH`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ListingCard ─────────────────────────────────────────────────────────────

function ListingCard({
    listing,
    isOwn,
    onBuy,
    onCancel,
}: {
    listing: MarketplaceListing;
    isOwn: boolean;
    onBuy: (l: MarketplaceListing) => void;
    onCancel: (l: MarketplaceListing) => void;
}) {
    const expiresAt = fromUnixTime(listing.expiryTimestamp);
    const isExpired = expiresAt < new Date();
    const timeLeft = isExpired
        ? 'Expired'
        : `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;

    return (
        <div className="group bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200">
            {/* Top accent strip */}
            <div className={`h-1 w-full ${isOwn ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-blue-600 to-emerald-500'}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                            <Layers size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                                {listing.projectTitle || `Project #${listing.projectOnchainId}`}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                                {listing.sellerWallet.slice(0, 6)}…{listing.sellerWallet.slice(-4)}
                            </p>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${isOwn
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40'
                        }`}>
                        {isOwn ? 'Your listing' : 'Available'}
                    </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-[var(--border)]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Tag size={11} className="text-[var(--text-muted)]" />
                            <p className="text-xs text-[var(--text-muted)]">Price / token</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-main)]">{listing.pricePerTokenEth} ETH</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-[var(--border)]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Layers size={11} className="text-[var(--text-muted)]" />
                            <p className="text-xs text-[var(--text-muted)]">Tokens</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-main)]">{listing.tokenAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-[var(--border)]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp size={11} className="text-[var(--text-muted)]" />
                            <p className="text-xs text-[var(--text-muted)]">Total value</p>
                        </div>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{listing.totalValueEth.toFixed(4)} ETH</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-[var(--border)]">
                        <div className="flex items-center gap-1.5 mb-1">
                            <ShoppingCart size={11} className="text-[var(--text-muted)]" />
                            <p className="text-xs text-[var(--text-muted)]">{listing.partialFill ? 'Min buy' : 'Fill type'}</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-main)]">
                            {listing.partialFill ? `${listing.minPurchase} tokens` : 'Full only'}
                        </p>
                    </div>
                </div>

                {/* Expiry */}
                <div className={`flex items-center gap-1.5 text-xs mb-4 ${isExpired ? 'text-red-500 dark:text-red-400' : 'text-[var(--text-muted)]'}`}>
                    <Clock size={11} />
                    <span>{timeLeft}</span>
                </div>

                {/* Action */}
                {isOwn ? (
                    <button
                        onClick={() => onCancel(listing)}
                        className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                        Cancel Listing
                    </button>
                ) : (
                    <button
                        onClick={() => onBuy(listing)}
                        disabled={isExpired}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isExpired ? (
                            'Listing expired'
                        ) : (
                            <>
                                <ShoppingCart size={15} />
                                Buy now
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden animate-pulse">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700" />
            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        </div>
    );
}

// ─── Main Marketplace Page ────────────────────────────────────────────────────

export default function MarketplacePage() {
    const { hasRoiAccess, isLoading: roiLoading } = useRoiAccess();
    const router = useRouter();

    useEffect(() => {
        if (!roiLoading && !hasRoiAccess) {
            toast.error('The marketplace is available to internal ROI users only.');
            router.replace('/dashboard');
        }
    }, [hasRoiAccess, roiLoading, router]);

    const { address, isConnected } = useAccount();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedBuy, setSelectedBuy] = useState<MarketplaceListing | null>(null);
    const [filter, setFilter] = useState<'all' | 'mine'>('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            if (filter === 'mine' && isConnected) {
                const data = await marketplaceService.getMyListings();
                setListings(data);
                setTotal(data.length);
            } else {
                const data = await marketplaceService.getListings({ limit: 50 });
                setListings(data.items);
                setTotal(data.total);
            }
        } catch {
            setListings([]);
        } finally {
            setLoading(false);
        }
    }, [filter, isConnected]);

    useEffect(() => { load(); }, [load]);

    const handleCancel = async (listing: MarketplaceListing) => {
        if (!confirm('Cancel this listing? Tokens will be returned to your wallet.')) return;
        try {
            await marketplaceService.cancelListing(listing._id);
            load();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to cancel');
        }
    };

    return (
        <div className="bg-[var(--background)] min-h-screen flex flex-col pt-[68px] transition-colors duration-300">
            <Navbar />

            <main className="flex-grow">
                {/* Page Header */}
                <section className="border-b border-[var(--border)] bg-[var(--background)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                        {/* Back button */}
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-6 group"
                        >
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                            <div>
                                {/* Network badge */}
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 px-3 py-1.5 rounded-full mb-3">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Base Sepolia
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-main)]">
                                    Investment Marketplace
                                </h1>
                                <p className="text-[var(--text-muted)] mt-2 max-w-xl text-sm sm:text-base">
                                    Trade ERC-1155 investment stakes. Buy &amp; sell ROI positions — when you sell,
                                    the buyer inherits your investment and future returns.
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-3 shrink-0">
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-3 text-center min-w-[90px]">
                                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{total}</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Active listings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    {/* Controls row */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                        {/* Filter tabs */}
                        <div className="inline-flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-[var(--border)]">
                            {(['all', 'mine'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                        }`}
                                >
                                    {f === 'all' ? 'All listings' : 'My listings'}
                                </button>
                            ))}
                        </div>

                        {/* Right controls */}
                        <div className="flex gap-2.5 items-center">
                            <button
                                onClick={() => load()}
                                className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--text-main)] transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={15} />
                            </button>

                            {!isConnected ? (
                                <button
                                    onClick={() => openWeb3Modal()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                >
                                    <Wallet size={15} />
                                    Connect wallet
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Wallet connect banner */}
                    {!isConnected && (
                        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                            <Wallet size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Connect your wallet to buy or sell</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                    MetaMask, Coinbase Wallet, and WalletConnect are supported.
                                    Make sure you're on <strong>Base Sepolia</strong> network.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart size={22} className="text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
                                {filter === 'mine' ? 'No active listings' : 'No listings yet'}
                            </h3>
                            <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto mb-5">
                                {filter === 'mine'
                                    ? 'List your investment NFTs from the dashboard to sell your stake.'
                                    : 'Be the first to list an investment stake. Invest in a project and list from your dashboard.'}
                            </p>
                            <Link
                                href="/explore"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Browse projects <ChevronRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listings.map(listing => (
                                <ListingCard
                                    key={listing._id}
                                    listing={listing}
                                    isOwn={isConnected && address?.toLowerCase() === listing.sellerWallet.toLowerCase()}
                                    onBuy={setSelectedBuy}
                                    onCancel={handleCancel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Buy Modal */}
            {selectedBuy && address && (
                <BuyModal
                    listing={selectedBuy}
                    walletAddress={address}
                    onClose={() => setSelectedBuy(null)}
                    onSuccess={load}
                />
            )}
        </div>
    );
}
