'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw, Mail, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { authService } from '@/lib/auth-service';
import Link from 'next/link';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();

    const emailParam = searchParams.get('email') || '';
    const codeParam = searchParams.get('code') || '';
    const nextParam = searchParams.get('next') || '/dashboard';

    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [email, setEmail] = useState(emailParam);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(CODE_LENGTH).fill(null));

    // Auto-verify if both code and email come from query params (magic link click)
    useEffect(() => {
        if (codeParam && emailParam) {
            autoVerify(codeParam, emailParam);
        }
    }, [codeParam, emailParam]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(r => r - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const autoVerify = async (c: string, e: string) => {
        setStatus('verifying');
        try {
            await apiClient.post('/auth/verify-email', { code: c, email: e });
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.response?.data?.message || 'Verification failed. The link may have expired.');
        }
    };

    const handleInput = (index: number, value: string) => {
        // Handle paste of full code
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
            const newCode = [...code];
            digits.forEach((d, i) => { if (index + i < CODE_LENGTH) newCode[index + i] = d; });
            setCode(newCode);
            const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }
        const digit = value.replace(/\D/g, '');
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== CODE_LENGTH) { setErrorMsg('Please enter the full 6-digit code'); return; }
        if (!email.trim()) { setErrorMsg('Please enter your email address'); return; }

        setStatus('verifying');
        setErrorMsg('');
        try {
            await apiClient.post('/auth/verify-email', { code: fullCode, email: email.trim().toLowerCase() });
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.response?.data?.message || 'Invalid or expired code. Please try again.');
            setStatus('error');
        }
    };

    const handleResend = async () => {
        if (!email.trim()) { setErrorMsg('Please enter your email address first'); return; }
        setIsSending(true);
        setErrorMsg('');
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
            if (hasToken && normalizedEmail === emailParam.toLowerCase()) {
                await authService.resendCurrentVerificationEmail();
            } else {
                await authService.resendVerificationEmail(normalizedEmail);
            }
            setResendCooldown(RESEND_COOLDOWN);
            setCode(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Failed to resend. Please wait and try again.');
        } finally {
            setIsSending(false);
        }
    };

    // Auto-submit once all 6 digits are filled
    useEffect(() => {
        if (code.join('').length === CODE_LENGTH && status === 'idle') {
            handleVerify();
        }
    }, [code]);

    if (status === 'verifying' && codeParam) {
        return (
            <div className="min-h-screen bg-[#070710] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 size={48} className="animate-spin text-[var(--primary)] mx-auto" />
                    <p className="text-white font-bold">Verifying your email...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070710] flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md"
            >
                <AnimatePresence mode="wait">

                    {/* Success state */}
                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center space-y-6 backdrop-blur-xl"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle2 size={40} className="text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white mb-2">Email Verified</h1>
                                <p className="text-white/60 font-medium">
                                    Your account is now fully active. Welcome to Keibo!
                                </p>
                            </div>
                            <button
                                onClick={() => router.push(nextParam)}
                                className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* Verify form */}
                    {status !== 'success' && (
                        <motion.div
                            key="form"
                            className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-8 backdrop-blur-xl"
                        >
                            {/* Header */}
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto">
                                    {/* <Mail size={28} className="text-blue-400" /> */}
                                </div>
                                <h1 className="text-3xl font-black text-white">Check your email</h1>
                                <p className="text-white/50 text-sm font-medium">
                                    We sent a 6-digit verification code to
                                    {email ? <><br /><strong className="text-white">{email}</strong></> : ' your email'}
                                </p>
                            </div>

                            {/* Email input (if not pre-filled) */}
                            {!emailParam && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="input_field"
                                    />
                                </div>
                            )}

                            {/* OTP input boxes */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Verification Code</label>
                                <div className="flex gap-3 justify-center">
                                    {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={code[i]}
                                            onChange={e => handleInput(i, e.target.value)}
                                            onKeyDown={e => handleKeyDown(i, e)}
                                            className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-white/5 text-white transition-all outline-none
                                                ${code[i] ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/20'}
                                                focus:border-[var(--primary)] focus:bg-[var(--primary)]/10
                                                ${status === 'error' ? 'border-rose-500/50' : ''}
                                            `}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="flex gap-2 items-start p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-200 text-sm">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    {errorMsg}
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                onClick={handleVerify}
                                disabled={status === 'verifying' || code.join('').length !== CODE_LENGTH}
                                className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                            >
                                {status === 'verifying' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                                ) : (
                                    <>Verify Email <ArrowRight size={16} /></>
                                )}
                            </button>

                            {/* Resend */}
                            <div className="text-center space-y-2">
                                <p className="text-sm text-white/40">Didn't receive the code?</p>
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-white/30 font-medium">
                                        Resend in {resendCooldown}s
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        disabled={isSending}
                                        className="text-sm font-bold text-[var(--primary)] hover:underline flex items-center gap-1.5 mx-auto disabled:opacity-50"
                                    >
                                        {isSending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                        Resend code
                                    </button>
                                )}
                            </div>

                            {/* Back to login */}
                            <p className="text-center text-xs text-white/30">
                                Wrong account?{' '}
                                <Link href="/login" className="text-white/50 hover:text-white underline font-medium">
                                    Back to Login
                                </Link>
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070710] flex items-center justify-center">
                <Loader2 size={48} className="text-white animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
