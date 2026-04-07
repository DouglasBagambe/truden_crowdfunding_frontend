'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setStatus('loading');
        try {
            await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            // Always show success even if email not found (security: no enumeration)
            setStatus('sent');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.response?.data?.message || 'Failed to send reset email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#070710] flex items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md"
            >
                {status === 'sent' ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center space-y-6 backdrop-blur-xl">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white mb-2">Check your inbox!</h1>
                            <p className="text-white/60 font-medium text-sm leading-relaxed">
                                If an account with <strong className="text-white">{email}</strong> exists,
                                we've sent a password reset link. Check your spam folder if you don't see it.
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium"
                        >
                            <ArrowLeft size={14} /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-8 backdrop-blur-xl">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto">
                                <Mail size={28} className="text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-black text-white">Forgot Password?</h1>
                            <p className="text-white/50 text-sm font-medium">
                                Enter your email and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex gap-2 items-start p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-200 text-sm">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    {errorMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading' || !email.trim()}
                                className="w-full py-4 bg-[var(--primary,#3b82f6)] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Sending...</>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        <p className="text-center">
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors font-medium">
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
