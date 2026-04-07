'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Heart, Loader2, Wallet, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoiAccess } from '@/hooks/useRoiAccess';
import { isCharityProject, isROIProject } from '@/lib/roi-access';
import { paymentService } from '@/lib/payment-service';

interface PaymentProject {
    id?: string;
    _id?: string;
    name?: string;
    title?: string;
    currency?: string;
    projectType?: string;
    type?: string;
    [key: string]: unknown;
}

interface DPOPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: PaymentProject;
}

function getDisplayName(user: unknown): string {
    const currentUser = user as {
        profile?: { firstName?: string; lastName?: string; displayName?: string };
        firstName?: string;
        lastName?: string;
        name?: string;
        fullName?: string;
        email?: string;
    } | null;

    const firstName = currentUser?.profile?.firstName || currentUser?.firstName || '';
    const lastName = currentUser?.profile?.lastName || currentUser?.lastName || '';
    const combined = `${firstName} ${lastName}`.trim();

    return combined
        || currentUser?.profile?.displayName
        || currentUser?.name
        || currentUser?.fullName
        || currentUser?.email
        || '';
}

export default function DPOPaymentModal({ isOpen, onClose, project }: DPOPaymentModalProps) {
    const { user, isAuthenticated } = useAuth();
    const { hasRoiAccess } = useRoiAccess();

    const projectId = String(project.id || project._id || '');
    const projectName = project.name || project.title || 'Untitled Project';
    const currency = project.currency || 'UGX';
    const isCharity = isCharityProject(project);
    const isROI = isROIProject(project);
    const donorQuickAmounts = useMemo(() => [5000, 10000, 50000, 100000], []);
    const investmentQuickAmounts = useMemo(() => [50000, 100000, 500000, 1000000], []);

    const [amount, setAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setDonorName('');
            setWalletAddress('');
            setError('');
            setIsSubmitting(false);
            return;
        }

        if (isCharity) {
            setDonorName(getDisplayName(user));
        }
    }, [isCharity, isOpen, user]);

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }
        onClose();
    };

    const handleSubmit = async () => {
        const normalizedAmount = Number(amount);
        if (!projectId) {
            setError('Project reference is missing.');
            return;
        }
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            setError('Enter a valid amount.');
            return;
        }
        if (isROI && !hasRoiAccess) {
            setError('ROI investments are currently restricted.');
            return;
        }
        if (isROI && !isAuthenticated) {
            window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        if (isROI && !walletAddress.trim()) {
            setError('Wallet address is required so your NFT can be minted.');
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);

            const result = await paymentService.initializeDPOPayment({
                projectId,
                amount: normalizedAmount,
                currency,
                paymentMethod: 'card',
                donorName: isCharity ? (donorName.trim() || 'Anonymous') : undefined,
                walletAddress: isROI ? walletAddress.trim() : undefined,
            });

            window.location.href = result.redirectUrl;
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
                || (err as { message?: string })?.message
                || 'Failed to initialize payment. Please try again.';
            setError(message);
            setIsSubmitting(false);
        }
    };

    if (isROI && !hasRoiAccess) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="fixed inset-0 z-[51] flex items-center justify-center px-4"
                    >
                        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
                                <div>
                                    <h2 className="text-lg font-black text-[var(--text-main)]">
                                        {isCharity ? 'Donate to Project' : 'Invest in Project'}
                                    </h2>
                                    <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
                                        {projectName}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-xl p-2 transition hover:bg-white/5"
                                >
                                    <X className="h-5 w-5 text-[var(--text-muted)]" />
                                </button>
                            </div>

                            <div className="space-y-5 px-6 py-6">
                                <div className={`rounded-2xl border px-4 py-3 ${isCharity ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-blue-500/20 bg-blue-500/10'}`}>
                                    <div className="flex items-start gap-3">
                                        {isCharity ? (
                                            <Heart className="mt-0.5 h-5 w-5 text-emerald-400" />
                                        ) : (
                                            <Wallet className="mt-0.5 h-5 w-5 text-blue-400" />
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-[var(--text-main)]">
                                                {isCharity ? 'You will continue on DPO Pay.' : 'You will continue on DPO Pay.'}
                                            </p>
                                            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                                                {isCharity
                                                    ? 'DPO handles the payment page and method selection after this step.'
                                                    : 'ROI investments require a wallet address so the NFT can be minted to the correct owner after payment confirmation.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isCharity && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                Donor Name
                                            </label>
                                            <span className="text-[10px] font-medium text-[var(--text-muted)]">
                                                Leave blank for anonymous
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={donorName}
                                            onChange={(event) => setDonorName(event.target.value)}
                                            placeholder="Anonymous"
                                            className="input_field"
                                        />
                                    </div>
                                )}

                                {isROI && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            Investor Wallet Address
                                        </label>
                                        <input
                                            type="text"
                                            value={walletAddress}
                                            onChange={(event) => setWalletAddress(event.target.value)}
                                            placeholder="0x..."
                                            className="input_field"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck={false}
                                        />
                                        <p className="text-xs text-[var(--text-muted)]">
                                            This address is used for NFT minting after the payment is confirmed.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Amount ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="500"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                        placeholder={isCharity ? 'e.g. 10000' : 'e.g. 100000'}
                                        className="input_field"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(isCharity ? donorQuickAmounts : investmentQuickAmounts).map((quickAmount) => (
                                        <button
                                            key={quickAmount}
                                            type="button"
                                            onClick={() => setAmount(String(quickAmount))}
                                            className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-all ${
                                                amount === String(quickAmount)
                                                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/50'
                                            }`}
                                        >
                                            {quickAmount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-2xl border border-[var(--border)] py-3 text-[10px] font-black uppercase tracking-widest transition hover:bg-white/5 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest text-white transition disabled:opacity-50 ${
                                            isCharity ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Redirecting...
                                            </>
                                        ) : (
                                            <>
                                                Continue to DPO
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
