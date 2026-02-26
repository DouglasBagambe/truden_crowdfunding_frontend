'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Loader2,
    Smartphone,
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    Copy,
    Check,
} from 'lucide-react';
import { dpoService } from '@/lib/dpo-service';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────
type PaymentMethod = 'mobile_money' | 'card';
type MNO = 'MTN' | 'AIRTEL';
type Step = 'method' | 'details' | 'waiting' | 'success' | 'failed';

interface DPOPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        id?: string;
        _id?: string;
        name?: string;
        title?: string;
        currency?: string;
        projectType?: string;
    };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) return '256' + digits.slice(1);
    if (digits.startsWith('+')) return digits.slice(1);
    return digits;
}

// ─── Component ───────────────────────────────────────────────
export default function DPOPaymentModal({ isOpen, onClose, project }: DPOPaymentModalProps) {
    const queryClient = useQueryClient();
    const currency = project.currency || 'UGX';
    const projectId = String(project.id || project._id || '');

    // State
    const [step, setStep] = useState<Step>('method');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
    const [mno, setMno] = useState<MNO>('MTN');
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [instructions, setInstructions] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [pollPercent, setPollPercent] = useState(0);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Card fields
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');

    const reset = useCallback(() => {
        setStep('method');
        setAmount('');
        setPhone('');
        setError('');
        setInstructions(null);
        setToken(null);
        setPollPercent(0);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardName('');
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    // ── Step 1: Proceed from method/amount to details ──────────────────────────
    const handleProceed = () => {
        setError('');
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        setStep('details');
    };

    // ── Step 2: Submit payment ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { setError('Invalid amount'); return; }

        try {
            setStep('waiting');

            let result;
            if (paymentMethod === 'mobile_money') {
                const formattedPhone = formatPhone(phone);
                if (formattedPhone.length < 10) {
                    setError('Please enter a valid phone number');
                    setStep('details');
                    return;
                }
                result = await dpoService.initialize({
                    projectId,
                    amount: amt,
                    currency,
                    paymentMethod: 'mobile_money',
                    phoneNumber: formattedPhone,
                    mno,
                });
            } else {
                // Card
                const [em, ey] = cardExpiry.split('/').map((s) => s.trim());
                result = await dpoService.initialize({
                    projectId,
                    amount: amt,
                    currency,
                    paymentMethod: 'card',
                    card: {
                        number: cardNumber.replace(/\s/g, ''),
                        expiryMonth: em ?? '',
                        expiryYear: ey ? (ey.length === 2 ? `20${ey}` : ey) : '',
                        cvv: cardCvv,
                        holderName: cardName,
                    },
                });
            }

            setToken(result.token);
            setInstructions(result.instructions);

            // Poll for confirmation
            const finalStatus = await dpoService.pollUntilComplete(
                result.token,
                (_status) => {
                    setPollPercent((p) => Math.min(p + 8, 90));
                },
                36,
                5000,
            );

            setPollPercent(100);

            if (finalStatus === 'successful') {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                queryClient.invalidateQueries({ queryKey: ['investments'] });
                setStep('success');
            } else if (finalStatus === 'failed') {
                setError('Payment was declined. Please try again or use a different method.');
                setStep('failed');
            } else {
                setError('Payment timed out. Please check your phone for the USSD prompt and contact support if not resolved.');
                setStep('failed');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Payment failed';
            setError(msg);
            setStep('failed');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        });
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={step !== 'waiting' ? handleClose : undefined}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] px-4"
                    >
                        <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                                <div>
                                    <h2 className="text-lg font-black text-[var(--text-main)]">
                                        {step === 'success' ? '🎉 Payment Successful' :
                                            step === 'failed' ? '⚠️ Payment Failed' :
                                                step === 'waiting' ? 'Processing Payment…' :
                                                    'Pay with DPO'}
                                    </h2>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium truncate max-w-[16rem]">
                                        {project.name || project.title}
                                    </p>
                                </div>
                                {step !== 'waiting' && (
                                    <button
                                        onClick={handleClose}
                                        className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">

                                {/* ── Step: method ─────────────────────────────────── */}
                                {step === 'method' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                        {/* Payment Method Tabs */}
                                        <div className="grid grid-cols-2 gap-2 bg-[var(--secondary)] rounded-2xl p-1">
                                            {(['mobile_money', 'card'] as PaymentMethod[]).map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setPaymentMethod(m)}
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === m
                                                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                        }`}
                                                >
                                                    {m === 'mobile_money' ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                                    {m === 'mobile_money' ? 'Mobile Money' : 'Card'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* MNO selection (mobile money only) */}
                                        {paymentMethod === 'mobile_money' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['MTN', 'AIRTEL'] as MNO[]).map((n) => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setMno(n)}
                                                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${mno === n
                                                            ? n === 'MTN'
                                                                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                                                                : 'border-red-400 bg-red-400/10 text-red-400'
                                                            : 'border-[var(--border)] text-[var(--text-muted)]'
                                                            }`}
                                                    >
                                                        {n === 'MTN' ? '🟡 MTN MoMo' : '🔴 Airtel Money'}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                Amount ({currency})
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="dpo-amount"
                                                    type="number"
                                                    min="1"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="input_field text-2xl font-bold py-5 pr-20"
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                    {currency}
                                                </span>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleProceed}
                                            className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20"
                                        >
                                            Continue →
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── Step: details ────────────────────────────────── */}
                                {step === 'details' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                                        {/* Summary */}
                                        <div className="bg-[var(--secondary)] rounded-2xl p-4 flex items-center justify-between">
                                            <span className="text-sm text-[var(--text-muted)] font-medium">Amount</span>
                                            <span className="text-xl font-black">{currency} {parseFloat(amount).toLocaleString()}</span>
                                        </div>

                                        {paymentMethod === 'mobile_money' ? (
                                            /* Mobile Money phone entry */
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                    {mno} Phone Number
                                                </label>
                                                <input
                                                    id="dpo-phone"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="e.g. 0701234567"
                                                    className="input_field"
                                                />
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium pl-1">
                                                    You'll receive a USSD prompt on this number to approve the payment.
                                                </p>
                                            </div>
                                        ) : (
                                            /* Card fields */
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Card Number</label>
                                                    <input
                                                        id="dpo-card-number"
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={19}
                                                        value={cardNumber}
                                                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                                                        placeholder="1234 5678 9012 3456"
                                                        className="input_field font-mono tracking-widest"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Expiry (MM/YY)</label>
                                                        <input
                                                            id="dpo-card-expiry"
                                                            type="text"
                                                            maxLength={5}
                                                            value={cardExpiry}
                                                            onChange={(e) => {
                                                                let v = e.target.value.replace(/\D/g, '');
                                                                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                                                                setCardExpiry(v);
                                                            }}
                                                            placeholder="MM/YY"
                                                            className="input_field font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">CVV</label>
                                                        <input
                                                            id="dpo-card-cvv"
                                                            type="text"
                                                            maxLength={4}
                                                            value={cardCvv}
                                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                                            placeholder="123"
                                                            className="input_field font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cardholder Name</label>
                                                    <input
                                                        id="dpo-card-name"
                                                        type="text"
                                                        value={cardName}
                                                        onChange={(e) => setCardName(e.target.value)}
                                                        placeholder="Full name on card"
                                                        className="input_field"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {error && (
                                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setStep('method'); setError(''); }}
                                                className="flex-1 py-4 border border-[var(--border)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                className="flex-[2] py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20"
                                            >
                                                Pay {currency} {parseFloat(amount).toLocaleString()}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── Step: waiting ────────────────────────────────── */}
                                {step === 'waiting' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-6 py-4"
                                    >
                                        <div className="relative w-20 h-20">
                                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
                                                <circle
                                                    cx="40" cy="40" r="34" fill="none"
                                                    stroke="var(--primary)" strokeWidth="6"
                                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - pollPercent / 100)}`}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Clock className="w-7 h-7 text-[var(--primary)] animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="text-center space-y-2">
                                            <p className="font-black text-[var(--text-main)]">Waiting for Payment</p>
                                            {paymentMethod === 'mobile_money' && instructions && (
                                                <div className="bg-[var(--secondary)] rounded-2xl p-4 text-left space-y-3 max-w-sm">
                                                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">USSD Instructions:</p>
                                                    <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed">{instructions}</p>
                                                    <button
                                                        onClick={() => copyToClipboard(phone)}
                                                        className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline"
                                                    >
                                                        {copiedPhone ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {copiedPhone ? 'Copied!' : 'Copy phone number'}
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-xs text-[var(--text-muted)] font-medium">
                                                Checking every 5 seconds · Do not close this window
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── Step: success ────────────────────────────────── */}
                                {step === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-4 py-6 text-center"
                                    >
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-main)]">Investment Confirmed!</h3>
                                            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">
                                                {currency} {parseFloat(amount).toLocaleString()} received. Your investment NFT is being minted.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="mt-2 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                                        >
                                            Done
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── Step: failed ─────────────────────────────────── */}
                                {step === 'failed' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-4 py-4 text-center"
                                    >
                                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
                                            <AlertCircle className="w-8 h-8 text-rose-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[var(--text-main)]">Payment Failed</h3>
                                            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium max-w-xs">{error}</p>
                                        </div>
                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => { setStep('method'); setError(''); setPollPercent(0); }}
                                                className="flex-1 py-3 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                                            >
                                                Try Again
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="flex-1 py-3 border border-[var(--border)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            {(step === 'method' || step === 'details') && (
                                <div className="px-6 pb-5 text-center">
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">
                                        Secured by DPO Group · PCI DSS Compliant
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
