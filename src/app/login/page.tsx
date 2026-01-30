'use client';

import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthCard>
      <div className="space-y-8">
        <header className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">
                Welcome Back
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-medium">
                Log in to manage your TruFund portfolio.
            </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="input_field"
                    />
                </div>
                
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Password</label>
                        <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="input_field pr-12"
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
                className="button_primary w-full flex items-center justify-center gap-3 py-4"
            >
                {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign Into Account
            </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] font-medium pt-2">
            Don't have an account? <Link href="/register" className="text-[var(--primary)] font-bold hover:underline">Create for free</Link>
        </p>
      </div>
    </AuthCard>
  );
}
