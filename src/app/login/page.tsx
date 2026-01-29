'use client';

import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Wallet, Loader2, TrendingUp } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { authService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.mfaRequired) {
        setMfaRequired(true);
        setTempUserId(response.user._id);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Assuming endpoint /auth/mfa/verify
      const response = await authService.verifyMfa({ userId: tempUserId, code: mfaCode });
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError('Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="space-y-10">
        <header className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {mfaRequired ? 'Security Verification' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 font-medium">
                {mfaRequired ? 'Enter the code from your authenticator app.' : 'Please enter your details to sign in.'}
            </p>
        </header>

        {mfaRequired ? (
            <form onSubmit={handleMfaVerify} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Authenticator Code</label>
                    <input
                        type="text"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="000 000"
                        maxLength={6}
                        required
                        autoFocus
                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] text-indigo-600 dark:text-indigo-400 placeholder:text-gray-200 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full premium-gradient text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </button>

                <button 
                    type="button" 
                    onClick={() => setMfaRequired(false)}
                    className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    Back to login
                </button>
            </form>
        ) : (
            <>
                <button 
                onClick={() => open()}
                className={`w-full flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] ${
                    isConnected 
                    ? 'bg-emerald-500 shadow-emerald-500/20 text-white' 
                    : 'bg-indigo-600 shadow-indigo-500/20 text-white hover:bg-indigo-700'
                }`}
                >
                {isConnected ? (
                    <><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Linked: {address?.slice(0,6)}...{address?.slice(-4)}</>
                ) : (
                    <><Wallet className="w-4 h-4" /> Connect Wallet</>
                )}
                </button>

                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100 dark:border-slate-800"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
                    <span className="bg-white dark:bg-slate-900 px-4 text-gray-400">or use email</span>
                </div>
                </div>

                {error && (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 italic"
                >
                    {error}
                </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. name@company.com"
                                required
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full premium-gradient text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    Sign In
                </button>
                </form>

                <div className="text-center">
                <p className="text-gray-500 font-medium text-sm">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-indigo-600 font-bold hover:underline ml-1">
                    Create Legacy
                    </Link>
                </p>
                </div>
            </>
        )}
      </div>
    </AuthCard>
  );
}
