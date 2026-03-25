'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Smartphone, Building2, CheckCircle2,
    Loader2, AlertCircle, Send, DollarSign, Info, Wallet
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

// Withdrawal methods supported in Uganda
const MOMO_PROVIDERS = [
    { value: 'MTN', label: 'MTN Mobile Money', emoji: '📱', color: 'from-yellow-500 to-yellow-600' },
    { value: 'AIRTEL', label: 'Airtel Money', emoji: '📱', color: 'from-red-500 to-red-600' },
];

const BANK_PROVIDERS = [
    { value: 'STANBIC', label: 'Stanbic Bank Uganda' },
    { value: 'DFCU', label: 'DFCU Bank' },
    { value: 'CENTENARY', label: 'Centenary Bank' },
    { value: 'ABSA', label: 'ABSA Bank Uganda' },
    { value: 'EQUITY', label: 'Equity Bank Uganda' },
    { value: 'POST', label: 'PostBank Uganda' },
    { value: 'OTHER', label: 'Other Bank' },
];

type WithdrawMethod = 'mobile_money' | 'bank_transfer';
type Step = 'method' | 'details' | 'confirm' | 'done';

const PLATFORM_FEE_RATE = 0.02; // 2% Keibo platform fee

function WithdrawPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const projectId = searchParams.get('projectId');
    const projectName = searchParams.get('projectName') || 'Your Project';
    const balanceType = (searchParams.get('type') as 'CHARITY' | 'ROI') || 'CHARITY';

    const [step, setStep] = useState<Step>('method');
    const [method, setMethod] = useState<WithdrawMethod>('mobile_money');
    const [amount, setAmount] = useState('');
    const [provider, setProvider] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [withdrawResult, setWithdrawResult] = useState<{ platformFee?: number; youReceive?: number } | null>(null);

    // Wallet balance (Keibo wallet balance = what creator can withdraw)
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?next=/dashboard/withdraw');
        }
    }, [isAuthenticated]);

    // Load creator's Keibo wallet balance (this is the withdrawable amount)
    useEffect(() => {
        if (isAuthenticated) {
            setLoadingBalance(true);
            apiClient.get('/wallet/balance')
                .then(res => {
                    const uiBalance = balanceType === 'ROI'
                        ? (res.data?.roiBalance?.UGX ?? 0)
                        : (res.data?.fiatBalance?.UGX ?? 0);
                    setWalletBalance(uiBalance);
                })
                .catch(() => setWalletBalance(null))
                .finally(() => setLoadingBalance(false));
        }
    }, [isAuthenticated, balanceType]);

    // Pre-fill account name from user profile
    useEffect(() => {
        if (user && !accountName) {
            const name = `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
                || (user as any).email || '';
            setAccountName(name);
        }
    }, [user]);

    const handleSubmitWithdrawal = async () => {
        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum < 10000) {
            setError('Minimum withdrawal is UGX 10,000');
            return;
        }
        if (walletBalance !== null && amountNum > walletBalance) {
            setError(`Amount exceeds your available balance of UGX ${walletBalance.toLocaleString()}`);
            return;
        }
        if (!provider) {
            setError('Please select a provider');
            return;
        }
        if (!accountNumber.trim()) {
            setError(method === 'mobile_money' ? 'Please enter your phone number' : 'Please enter your account number');
            return;
        }
        if (!accountName.trim()) {
            setError('Please enter the account name');
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);

            // Step 1: Add withdrawal method and get its index
            await apiClient.post('/wallet/withdrawal-method', {
                type: method === 'mobile_money' ? 'mobile_money' : 'bank_account',
                provider,
                accountNumber: accountNumber.trim(),
                accountName: accountName.trim(),
                isDefault: true,
            });

            // Step 2: Request withdrawal (backend applies 2% fee automatically)
            const withdrawRes = await apiClient.post('/wallet/withdraw', {
                amount: amountNum,
                currency: 'UGX',
                withdrawalMethodIndex: 0,
                balanceType: balanceType,
                projectId: projectId,
                note: note.trim() || `Withdrawal from ${projectName}`,
            });

            setTransactionId(String(withdrawRes.data?.transactionId || ''));
            setWithdrawResult({
                platformFee: withdrawRes.data?.platformFee,
                youReceive: withdrawRes.data?.youReceive,
            });
            setStep('done');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Withdrawal failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const amountNum = Number(amount);
    const platformFee = Math.ceil(amountNum * PLATFORM_FEE_RATE); // 2% Keibo fee
    const youReceive = amountNum - platformFee;

    const validateAndNext = () => {
        if (!amount || Number(amount) < 10000) { setError('Minimum withdrawal is UGX 10,000'); return; }
        if (walletBalance !== null && Number(amount) > walletBalance) {
            setError(`Amount exceeds available balance of UGX ${walletBalance.toLocaleString()}`);
            return;
        }
        if (!provider) { setError('Please select a provider'); return; }
        if (!accountNumber.trim()) { setError('Please enter account number'); return; }
        if (!accountName.trim()) { setError('Please enter account name'); return; }
        setError('');
        setStep('confirm');
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
            <Navbar />
            <main className="pt-28 pb-24">
                <div className="max-w-2xl mx-auto px-6">

                    {/* Back */}
                    <button
                        onClick={() => step === 'method' ? router.back() : setStep(step === 'confirm' ? 'details' : 'method')}
                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] mb-8 font-medium transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {step === 'method' ? 'Back to Dashboard' : 'Back'}
                    </button>

                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-black tracking-tight mb-2">Withdraw Funds</h1>
                        {projectId && (
                            <p className="text-[var(--text-muted)] font-medium">
                                From: <span className="text-white font-bold">{projectName}</span>
                            </p>
                        )}
                        {/* Keibo wallet balance */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            {loadingBalance ? (
                                <div className="inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2">
                                    <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text-muted)]">Loading balance...</span>
                                </div>
                            ) : walletBalance !== null ? (
                                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                                    <Wallet size={14} className="text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-400">
                                        Keibo Wallet: UGX {walletBalance.toLocaleString()} available
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                                    <AlertCircle size={14} className="text-amber-400" />
                                    <span className="text-sm text-amber-400">Could not load balance</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-10">
                        {(['method', 'details', 'confirm'] as Step[]).map((s, i) => (
                            <div key={s} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step === s ? 'bg-[var(--primary)] text-white' :
                                    ['done', 'confirm', 'details'].indexOf(step) > ['done', 'confirm', 'details', 'method'].indexOf(s)
                                        ? 'bg-emerald-500 text-white' : 'bg-white/10 text-[var(--text-muted)]'
                                    }`}>{i + 1}</div>
                                {i < 2 && <div className="w-8 h-px bg-[var(--border)]" />}
                            </div>
                        ))}
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-2">
                            {step === 'method' ? 'Choose Method' : step === 'details' ? 'Enter Details' : step === 'confirm' ? 'Confirm' : 'Complete'}
                        </span>
                    </div>

                    <AnimatePresence mode="wait">

                        {/* STEP 1 — Choose method */}
                        {step === 'method' && (
                            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <h2 className="text-xl font-black mb-6">How would you like to receive your money?</h2>

                                {/* Mobile Money */}
                                <button
                                    onClick={() => { setMethod('mobile_money'); setProvider(''); setStep('details'); }}
                                    className="w-full p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)]/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-2xl">📱</div>
                                        <div className="flex-1">
                                            <p className="font-black text-lg">Mobile Money</p>
                                            <p className="text-sm text-[var(--text-muted)]">MTN or Airtel · Instant to 1 hour</p>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 rotate-180 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>

                                {/* Bank Transfer */}
                                <button
                                    onClick={() => { setMethod('bank_transfer'); setProvider(''); setStep('details'); }}
                                    className="w-full p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)]/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl">🏦</div>
                                        <div className="flex-1">
                                            <p className="font-black text-lg">Bank Transfer</p>
                                            <p className="text-sm text-[var(--text-muted)]">Uganda banks · 1-3 business days</p>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 rotate-180 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>

                                {/* Fee info */}
                                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3">
                                    <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-[var(--text-muted)] space-y-1">
                                        <p>Withdrawals are processed within 24 hours on business days.</p>
                                        <p>A <strong className="text-white">2% Keibo platform fee</strong> is charged per withdrawal.</p>
                                        <p>Minimum withdrawal: <strong className="text-white">UGX 10,000</strong></p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2 — Enter details */}
                        {step === 'details' && (
                            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-xl font-black mb-2">
                                    {method === 'mobile_money' ? '📱 Mobile Money Details' : '🏦 Bank Transfer Details'}
                                </h2>

                                {/* Provider */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {method === 'mobile_money' ? 'Mobile Network' : 'Bank'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(method === 'mobile_money' ? MOMO_PROVIDERS : BANK_PROVIDERS).map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => setProvider(p.value)}
                                                className={`p-3 rounded-xl border text-sm font-bold text-left transition-all ${provider === p.value
                                                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-white'
                                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-white/30'
                                                    }`}
                                            >
                                                {'emoji' in p ? `${p.emoji} ` : ''}{p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Account Number */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {method === 'mobile_money' ? 'Phone Number (256XXXXXXXXX)' : 'Account Number'}
                                    </label>
                                    <input
                                        value={accountNumber}
                                        onChange={e => setAccountNumber(e.target.value)}
                                        type={method === 'mobile_money' ? 'tel' : 'text'}
                                        placeholder={method === 'mobile_money' ? '256701234567' : 'Enter account number'}
                                        className="input_field"
                                    />
                                </div>

                                {/* Account Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Account Name (Full name on account)
                                    </label>
                                    <input
                                        value={accountName}
                                        onChange={e => setAccountName(e.target.value)}
                                        type="text"
                                        placeholder="Full legal name"
                                        className="input_field"
                                    />
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Amount (UGX)
                                    </label>
                                    <input
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        type="number"
                                        min="10000"
                                        step="1000"
                                        placeholder="Minimum 10,000"
                                        className="input_field"
                                    />
                                    {/* Quick amounts from wallet balance */}
                                    {walletBalance && walletBalance > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {[walletBalance * 0.25, walletBalance * 0.5, walletBalance * 0.75, walletBalance].map((pct, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAmount(String(Math.floor(pct)))}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-black border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/50 transition-all"
                                                >
                                                    {['25%', '50%', '75%', '100%'][i]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Fee breakdown (live) */}
                                {amountNum >= 10000 && (
                                    <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Fee Breakdown</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-muted)]">Withdrawal Amount</span>
                                            <span className="font-bold">UGX {amountNum.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-muted)]">Keibo Platform Fee (2%)</span>
                                            <span className="font-bold text-amber-400">- UGX {platformFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2 mt-2">
                                            <span className="font-black">You Receive</span>
                                            <span className="font-black text-emerald-400">UGX {youReceive.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Note */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Note (optional)
                                    </label>
                                    <input
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        type="text"
                                        placeholder="e.g. Project milestone payout"
                                        className="input_field"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium flex gap-2 items-start">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={validateAndNext}
                                    className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Review Withdrawal →
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 3 — Confirm */}
                        {step === 'confirm' && (
                            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h2 className="text-xl font-black">Confirm Withdrawal</h2>

                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                                    {[
                                        ['Method', method === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'],
                                        ['Provider', provider],
                                        ['Account Number', accountNumber],
                                        ['Account Name', accountName],
                                        ['Withdrawal Amount', `UGX ${Number(amount).toLocaleString()}`],
                                        ['Keibo Platform Fee (2%)', `UGX ${platformFee.toLocaleString()}`],
                                        ['You Receive', `UGX ${youReceive.toLocaleString()}`],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] last:border-0">
                                            <span className="text-sm text-[var(--text-muted)] font-medium">{label}</span>
                                            <span className={`text-sm font-black ${label === 'You Receive' ? 'text-emerald-400' : label?.includes('Fee') ? 'text-amber-400' : ''}`}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-1">
                                    <p className="text-xs text-[var(--text-muted)]">
                                        ⚠️ Please double-check your account details. Withdrawals cannot be reversed once submitted.
                                        Processing time: {method === 'mobile_money' ? '1 hour' : '1-3 business days'}.
                                    </p>
                                    <p className="text-xs text-amber-400/70 mt-1">
                                        The 2% Keibo platform fee helps maintain and improve the Keibo platform.
                                    </p>
                                </div>

                                {balanceType === 'ROI' && (
                                    <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl space-y-1">
                                        <div className="flex items-center gap-2 text-[var(--primary)] mb-1">
                                            <Info size={16} />
                                            <span className="font-bold text-sm">ROI Investment Rules</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            ROI payout requests require administrative approval before the 98% net amount is disbursed. The minimum withdrawal allowed must be equal to or greater than the 100% completion target of your project.
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium flex gap-2 items-start">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('details')}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 border border-[var(--border)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleSubmitWithdrawal}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                                        ) : (
                                            <><Send size={14} /> Confirm Withdrawal</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 — Done */}
                        {step === 'done' && (
                            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-10">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={48} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black mb-2">Withdrawal Submitted! 🎉</h2>
                                    <p className="text-[var(--text-muted)] font-medium">
                                        UGX {(withdrawResult?.youReceive ?? youReceive).toLocaleString()} will be sent to your {method === 'mobile_money' ? 'mobile wallet' : 'bank account'} within {method === 'mobile_money' ? '1 hour' : '1-3 business days'}.
                                    </p>
                                    {transactionId && (
                                        <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">Ref: {transactionId}</p>
                                    )}
                                </div>

                                {/* Summary card */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-left max-w-xs mx-auto space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">Requested</span>
                                        <span className="font-bold">UGX {Number(amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">Keibo Fee (2%)</span>
                                        <span className="font-bold text-amber-400">- UGX {(withdrawResult?.platformFee ?? platformFee).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-[var(--border)] pt-3">
                                        <span className="font-black">You Receive</span>
                                        <span className="font-black text-emerald-400">UGX {(withdrawResult?.youReceive ?? youReceive).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                    <Link href="/dashboard" className="py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all text-center">
                                        Go to Dashboard
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function WithdrawPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <Loader2 size={48} className="text-white animate-spin" />
            </div>
        }>
            <WithdrawPageContent />
        </Suspense>
    );
}
