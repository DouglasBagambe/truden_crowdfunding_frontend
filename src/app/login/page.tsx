'use client';

import React, { useState, useEffect } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthCard>
      <div className="space-y-8">
        {/* Wallet Connection Section */}
        <div className="space-y-4">
          <button 
            type="button"
            onClick={() => open()}
            className={`w-full flex items-center justify-center gap-3 font-bold py-4 rounded-xl transition-all shadow-lg ${
              isConnected 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
            } text-white`}
          >
            {isConnected ? (
              <>
                <CheckCircle className="w-5 h-5" /> 
                <span className="text-sm">Connected: {address?.slice(0,6)}...{address?.slice(-4)}</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" /> 
                <span className="text-sm">Connect Web3 Wallet</span>
              </>
            )}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-[var(--card)] px-4 text-[var(--text-muted)]">or legacy access</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">
                Welcome Back
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-medium">
                Log in to manage your TruFund portfolio.
            </p>
        </header>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary)]" />
                      <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="input_field pl-12"
                      />
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Password</label>
                        <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">Forgot Password?</Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary)]" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="input_field pl-12 pr-12"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                disabled={isLoggingIn}
                className="button_primary w-full flex items-center justify-center gap-3 py-4 shadow-xl shadow-blue-500/20"
            >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-sm font-black uppercase tracking-widest">Sign Into Account</span>
                )}
            </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] font-medium">
            New to the protocol? <Link href="/register" className="text-[var(--primary)] font-bold hover:underline">Register for free</Link>
        </p>
      </div>
    </AuthCard>
  );
}