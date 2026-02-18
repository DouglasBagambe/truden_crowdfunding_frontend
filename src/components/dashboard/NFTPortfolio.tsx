'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useInvestorNFTsWithData } from '@/hooks/useInvestmentNFTs';
import { TrendingUp, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface NFTCardProps {
    tokenId: number;
    projectId: string;
    initialAmount: string;
    currentValue: string;
    profitLoss: string;
    roiPercentage: number;
    isActive: boolean;
    investmentDate: Date;
}

function NFTCard({
    tokenId,
    projectId,
    initialAmount,
    currentValue,
    profitLoss,
    roiPercentage,
    isActive,
    investmentDate,
}: NFTCardProps) {
    const isProfit = parseFloat(profitLoss) >= 0;

    const handleViewOnOpenSea = () => {
        // TODO: Replace with actual OpenSea link when contract is deployed
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x...';
        window.open(
            `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`,
            '_blank'
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm font-medium">Investment NFT</p>
                        <h3 className="text-white text-xl font-bold">#{tokenId}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive
                            ? 'bg-green-400/20 text-green-100'
                            : 'bg-gray-400/20 text-gray-100'
                        }`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Investment Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Initial Investment</p>
                        <p className="text-lg font-bold text-gray-900">
                            {parseFloat(initialAmount).toLocaleString()} UGX
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Current Value</p>
                        <p className="text-lg font-bold text-gray-900">
                            {parseFloat(currentValue).toLocaleString()} UGX
                        </p>
                    </div>
                </div>

                {/* ROI */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isProfit ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                                Return on Investment
                            </span>
                        </div>
                        <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isProfit ? '+' : ''}{roiPercentage.toFixed(2)}%
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {isProfit ? 'Profit' : 'Loss'}: {' '}
                        <span className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isProfit ? '+' : ''}{parseFloat(profitLoss).toLocaleString()} UGX
                        </span>
                    </div>
                </div>

                {/* Investment Date */}
                <div className="text-sm text-gray-500">
                    Invested on {new Date(investmentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleViewOnOpenSea}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View on OpenSea
                    </button>
                    <button
                        className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-medium"
                    >
                        Transfer
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export function NFTPortfolio() {
    const { address } = useAccount();
    const { data: nfts, isLoading, error } = useInvestorNFTsWithData(address);

    if (!address) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">
                    Please connect your wallet to view your investment NFTs
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading your NFT portfolio...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load NFTs</h3>
                <p className="text-gray-600 mb-4">
                    There was an error loading your NFT portfolio
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!nfts || nfts.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Investment NFTs Yet</h3>
                <p className="text-gray-600 mb-6">
                    When you invest in projects, you'll receive NFTs representing your investments
                </p>
                <a
                    href="/explore"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Explore Projects
                </a>
            </div>
        );
    }

    // Calculate totals
    const totalInitial = nfts.reduce((sum, nft) => sum + parseFloat(nft.initialAmount), 0);
    const totalCurrent = nfts.reduce((sum, nft) => sum + parseFloat(nft.currentValue), 0);
    const totalProfit = totalCurrent - totalInitial;
    const avgROI = nfts.reduce((sum, nft) => sum + nft.roiPercentage, 0) / nfts.length;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500 mb-1">Total NFTs</p>
                    <p className="text-3xl font-bold text-gray-900">{nfts.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Invested</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {totalInitial.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">UGX</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500 mb-1">Current Value</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {totalCurrent.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">UGX</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500 mb-1">Average ROI</p>
                    <p className={`text-3xl font-bold ${avgROI >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(1)}%
                    </p>
                    <p className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()} UGX
                    </p>
                </div>
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                    <NFTCard
                        key={nft.tokenId}
                        tokenId={nft.tokenId}
                        projectId={nft.projectId}
                        initialAmount={nft.initialAmount}
                        currentValue={nft.currentValue}
                        profitLoss={nft.profitLoss}
                        roiPercentage={nft.roiPercentage}
                        isActive={nft.isActive}
                        investmentDate={nft.investmentDate}
                    />
                ))}
            </div>
        </div>
    );
}
