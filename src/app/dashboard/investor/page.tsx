'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Package, AlertCircle, 
  ArrowUpRight, Award, Clock, CheckCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useInvestmentNFTs } from '@/hooks/useInvestmentNFTs';
import { projectService } from '@/lib/project-service';
import { useRouter } from 'next/navigation';

export default function InvestorDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { nfts, balance: nftBalance, isLoading: nftsLoading } = useInvestmentNFTs();

  // Fetch user's investments from backend
  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['user-investments', address],
    queryFn: async () => {
      // This would call your backend API
      // For now, return mock data
      return [];
    },
    enabled: !!address && isConnected,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view your investment portfolio.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalInvested = investments?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0;
  const activeInvestments = investments?.filter((inv: any) => inv.status === 'active')?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Portfolio</h1>
            <p className="text-gray-600">Track your investments and NFT rewards</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Wallet className="w-5 h-5" />}
              label="Total Invested"
              value={`$${totalInvested.toLocaleString()}`}
              trend="+12%"
              trendUp={true}
            />
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Active Investments"
              value={activeInvestments.toString()}
              trend="+2"
              trendUp={true}
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="NFT Rewards"
              value={nftBalance.toString()}
              trend={`+${nftBalance}`}
              trendUp={true}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Potential Returns"
              value="$0"
              trend="--"
              trendUp={false}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Investments List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">My Investments</h2>
                </div>
                <div className="p-6">
                  {investmentsLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading investments...</p>
                    </div>
                  ) : investments && investments.length > 0 ? (
                    <div className="space-y-4">
                      {investments.map((investment: any, index: number) => (
                        <InvestmentCard key={index} investment={investment} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Package className="w-12 h-12" />}
                      title="No Investments Yet"
                      description="Start investing in projects to see them here"
                      action={{
                        label: "Explore Projects",
                        onClick: () => router.push('/explore')
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* NFT Rewards */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">NFT Rewards</h2>
                </div>
                <div className="p-6">
                  {nftsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : nftBalance > 0 ? (
                    <div className="space-y-3">
                      {nfts.map((nft: any, index: number) => (
                        <NFTCard key={index} nft={nft} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Award className="w-10 h-10" />}
                      title="No NFTs Yet"
                      description="Invest in projects to earn NFT rewards"
                      compact
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, trend, trendUp }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-gray-500'}`}>
        {trend}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </motion.div>
);

// Investment Card Component
const InvestmentCard = ({ investment }: any) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{investment.projectName || 'Project'}</h3>
        <p className="text-sm text-gray-600">Invested: ${investment.amount?.toLocaleString() || '0'}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        investment.status === 'active' 
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-700'
      }`}>
        {investment.status || 'Active'}
      </span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">Progress: {investment.progress || 0}%</span>
      <ArrowUpRight className="w-4 h-4 text-gray-400" />
    </div>
  </div>
);

// NFT Card Component
const NFTCard = ({ nft }: any) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <Award className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">Investment NFT</p>
        <p className="text-sm text-gray-600">Token #{nft.tokenId}</p>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ icon, title, description, action, compact }: any) => (
  <div className={`text-center ${compact ? 'py-8' : 'py-12'}`}>
    <div className="text-gray-400 mb-4 flex justify-center">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);
