'use client';

import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, Eye, Wallet, Loader2 } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { authService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="space-y-8">
        <button 
          onClick={() => open()}
          className={`w-full flex items-center justify-center gap-3 font-bold py-4 rounded-xl transition-all shadow-lg ${
            isConnected 
              ? 'bg-green-500 hover:bg-green-600 shadow-green-100' 
              : 'bg-[#3B82F6] hover:bg-blue-600 shadow-blue-200'
          } text-white`}
        >
          {isConnected ? (
            <><CheckCircle className="w-5 h-5" /> Connected: {address?.slice(0,6)}...{address?.slice(-4)}</>
          ) : (
            <><Wallet className="w-5 h-5" /> Connect Wallet</>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-medium">or continue with email</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 italic">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-[#f1f5f9] border-none rounded-xl py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-[#f1f5f9] border-none rounded-xl py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
              <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 rounded-md cursor-pointer"
            />
            <label htmlFor="remember" className="text-gray-600 font-medium cursor-pointer">Remember me</label>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-gray-500">
            New?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
