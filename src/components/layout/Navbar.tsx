'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Wallet, User } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';

const Navbar = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  return (
    <nav className="fixed top-0 w-full z-50 glass-card">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-bold italic text-xl">T</span>
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Truden
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Explore</Link>
            <Link href="#" className="text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Create</Link>
            <Link href="#" className="text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Learn</Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative h-11 w-11 flex items-center justify-center rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <button 
            onClick={() => open()}
            className="flex items-center gap-3 bg-gray-900 dark:bg-indigo-600 px-6 py-2.5 rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <Wallet className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect'}
            </span>
          </button>

          <Link href="/profile" className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-slate-800 rounded-xl transition-all border border-gray-100 dark:border-slate-700">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
