'use client';

import React, { useState, useEffect } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

interface ApiErrorBody {
  message?: string | string[];
}

function getLoginErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  return message || 'Login failed';
}

export default function LoginPage() {
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [needsMfa, setNeedsMfa] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage('');
    login(
      { email, password, otp: needsMfa ? otp : undefined },
      {
        onError: (error) => {
          const message = getLoginErrorMessage(error);
          if (message.toLowerCase().includes('mfa code required')) {
            setNeedsMfa(true);
            setLoginMessage('Enter your authenticator code or the code sent to your email.');
            return;
          }
          setLoginMessage(message);
        },
      },
    );
  };

  return (
    <AuthCard>
      <div className="space-y-8">

        {/* Header */}
        <header className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">
            Welcome Back
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Log in to manage your Keibo portfolio.
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
                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">Forgot Password?</Link>
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

            {needsMfa && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">MFA Code</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary)]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Authenticator or email code"
                    required={needsMfa}
                    className="input_field pl-12"
                  />
                </div>
              </div>
            )}
          </div>

          {loginMessage && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {loginMessage}
            </p>
          )}

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
