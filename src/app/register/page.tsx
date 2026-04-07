'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Wallet, Loader2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });

  // Password validation rules
  const passwordChecks = useMemo(() => {
    const p = formData.password;
    return [
      { label: 'At least 8 characters', pass: p.length >= 8 },
      { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(p) },
      { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(p) },
      { label: 'One number (0-9)', pass: /\d/.test(p) },
      { label: 'One special character (!@#$...)', pass: /[^\w\s]/.test(p) },
    ];
  }, [formData.password]);

  const passwordValid = passwordChecks.every(c => c.pass);

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

    if (!passwordValid) {
      toast.error('Please fix the password requirements below.');
      setPasswordTouched(true);
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      toast.success("Account created! Please verify your email to continue.");
      // Redirect to verification page with email pre-filled
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      // Backend may return an array of messages
      const errorText = Array.isArray(msg) ? msg.join('. ') : (msg || 'Registration failed');
      toast.error(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const showChecks = passwordTouched && formData.password.length > 0;

  return (
    <AuthCard>
      <div className="space-y-8">

        {/* Header */}
        <header className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">
            Join Keibo
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Start your journey as an innovator or backer today.
          </p>
        </header>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                onFocus={() => setPasswordTouched(true)}
                required
                className={`input_field pl-12 pr-12 ${showChecks && !passwordValid ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password requirements checklist */}
            {showChecks && (
              <div className="space-y-1 pt-1 px-1">
                {passwordChecks.map((check, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors ${check.pass ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {check.pass
                      ? <CheckCircle size={12} className="flex-shrink-0" />
                      : <X size={12} className="flex-shrink-0" />
                    }
                    {check.label}
                  </div>
                ))}
              </div>
            )}

            {!showChecks && (
              <p className="text-[9px] text-[var(--text-muted)] font-medium leading-tight px-1 italic">
                Must be 8+ characters with uppercase, lowercase, number, and special character.
              </p>
            )}
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
