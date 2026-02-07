'use client';

import React, { useState, useEffect } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Wallet, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'INVESTOR'
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });
      toast.success("Identity initialized! Redirecting...");
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
              <span className="bg-[var(--card)] px-4 text-[var(--text-muted)]">or standard protocol</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">
                Join TruFund
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-medium">
                Start your journey as an innovator or backer today.
            </p>
        </header>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">First Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input 
                            name="firstName" 
                            type="text" 
                            placeholder="John" 
                            value={formData.firstName} 
                            onChange={handleChange} 
                            className="input_field pl-12" 
                            required
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Last Name</label>
                    <input 
                        name="lastName" 
                        type="text" 
                        placeholder="Doe" 
                        value={formData.lastName} 
                        onChange={handleChange} 
                        className="input_field" 
                        required
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input 
                        name="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="input_field pl-12" 
                        required
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Create Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                <p className="text-[9px] text-[var(--text-muted)] font-medium leading-tight px-1 italic">
                    Must be 8+ characters with uppercase, lowercase, number, and special character.
                </p>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Your Primary Role</label>
                <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange}
                        className="input_field pl-12 appearance-none cursor-pointer"
                    >
                        <option value="INVESTOR">Project Backer / Investor</option>
                        <option value="INNOVATOR">Project Creator / Innovator</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                className="button_primary w-full flex items-center justify-center gap-3 py-4 mt-2 shadow-xl shadow-blue-500/20"
            >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-sm font-black uppercase tracking-widest">Create Global Account</span>
                )}
            </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] font-medium">
            Already registered? <Link href="/login" className="text-[var(--primary)] font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </AuthCard>
  );
}
