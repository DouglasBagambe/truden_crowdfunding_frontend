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
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold italic">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Truden</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Explore</Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Create</Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Learn</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-blue-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div 
            onClick={() => open()}
            className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer group"
          >
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-700">
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
            </span>
          </div>

          <Link href="/login" className="p-2 text-gray-400 hover:text-blue-600">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
