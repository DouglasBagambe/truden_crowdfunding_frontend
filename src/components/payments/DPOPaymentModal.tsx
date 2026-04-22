'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Clock, Info, Loader2, Wallet, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useRoiAccess } from '@/hooks/useRoiAccess';
import { authService } from '@/lib/auth-service';
import { buildVerifyEmailUrl, getCurrentLocationPath } from '@/lib/email-verification';
import { isCharityProject, isROIProject } from '@/lib/roi-access';
import { DPOQuoteResponse, paymentService } from '@/lib/payment-service';
import { openWeb3Modal } from '@/providers/Web3Provider';

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

function getPreferredWalletAddress(user: unknown, connectedAddress?: string): string {
    const currentUser = user as {
        primaryWallet?: string;
        linkedWallets?: string[];
    } | null;

    return connectedAddress
        || currentUser?.primaryWallet
        || currentUser?.linkedWallets?.[0]
        || '';
}

/** Maps a raw backend error string to a short, readable alert heading. */
function resolveErrorLabel(errorText: string): { label: string; icon: React.ReactNode } {
    const lower = errorText.toLowerCase();
    if (lower.includes('not yet been provisioned') || lower.includes('provisioned on-chain')) {
        return {
            label: 'Project not yet ready for investment',
            icon: <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />,
        };
    }
    if (lower.includes('provisioning previously failed')) {
        return {
            label: 'On-chain provisioning failed — admin action required',
            icon: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />,
        };
    }
    if (lower.includes('linked wallet')) {
        return {
            label: 'Creator wallet not linked',
            icon: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />,
        };
    }
    if (lower.includes('kyc')) {
        return {
            label: 'KYC verification required',
            icon: <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />,
        };
    }
    if (lower.includes('email') && lower.includes('verif')) {
        return {
            label: 'Email verification required',
            icon: <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />,
        };
    }
    return {
        label: 'Investment blocked',
        icon: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />,
    };
}

export default function DPOPaymentModal({ isOpen, onClose, project }: DPOPaymentModalProps) {
    const { user, isAuthenticated } = useAuth();
    const { hasRoiAccess } = useRoiAccess();
    const { address, isConnected } = useAccount();

    const projectId = String(project.id || project._id || '');
    const projectName = project.name || project.title || 'Untitled Project';
    const currency = project.currency || 'UGX';
    const isCharity = isCharityProject(project);
    const isROI = isROIProject(project);
    const donorQuickAmounts = useMemo(() => [5000, 10000, 50000, 100000], []);
    const investmentQuickAmounts = useMemo(() => [50000, 100000, 500000, 1000000], []);
    const preferredWalletAddress = useMemo(
        () => getPreferredWalletAddress(user, isConnected ? address : undefined),
        [address, isConnected, user]
    );

    const [amount, setAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quote, setQuote] = useState<DPOQuoteResponse | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setDonorName('');
            setWalletAddress('');
            setError('');
            setIsSubmitting(false);
            setQuote(null);
            setIsLoadingQuote(false);
            return;
        }

        if (isCharity) {
            setDonorName(getDisplayName(user));
        }
    }, [isCharity, isOpen, user]);

    useEffect(() => {
        if (!isOpen || !isROI || !preferredWalletAddress) {
            return;
        }

        setWalletAddress(preferredWalletAddress);
    }, [isOpen, isROI, preferredWalletAddress]);

    useEffect(() => {
        if (!isOpen || !projectId) {
            return;
        }

        const normalizedAmount = Number(amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            setQuote(null);
            setIsLoadingQuote(false);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            try {
                setIsLoadingQuote(true);
                const nextQuote = await paymentService.getDPOPaymentQuote({
                    projectId,
                    amount: normalizedAmount,
                    currency,
                });
                if (!cancelled) {
                    setError('');
                    setQuote(nextQuote);
                }
            } catch (quoteError: unknown) {
                if (!cancelled) {
                    setQuote(null);
                    const message =
                        (quoteError as { response?: { data?: { message?: string } } })?.response?.data?.message
                        || 'Unable to calculate the payable total right now.';
                    setError(message);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingQuote(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [amount, currency, isOpen, projectId]);

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }
        onClose();
    };

    const handleWalletAction = () => {
        if (isConnected && address) {
            setWalletAddress(address);
            return;
        }

        openWeb3Modal();
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
        if (!quote) {
            setError('Please wait for the payment total to finish loading.');
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
            if (message.toLowerCase().includes('not verified') && user?.email) {
                try {
                    await authService.resendCurrentVerificationEmail();
                } catch {
                    // Verification page still allows manual resend if delivery fails here.
                }
                window.location.href = buildVerifyEmailUrl({
                    email: user.email,
                    next: getCurrentLocationPath(),
                });
                return;
            }
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
                                        <div className="flex items-center justify-between gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                Investor Wallet Address
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleWalletAction}
                                                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] transition hover:border-[var(--primary)]/40 hover:text-[var(--text-main)]"
                                            >
                                                <Wallet className="h-3.5 w-3.5" />
                                                {isConnected && address ? 'Use Connected' : 'Connect Wallet'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={walletAddress}
                                                onChange={(event) => setWalletAddress(event.target.value)}
                                                placeholder="0x..."
                                                className="input_field min-w-0 flex-1"
                                                autoCapitalize="off"
                                                autoCorrect="off"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            This address is used for NFT minting after the payment is confirmed.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {isCharity ? 'Donation Amount' : 'Investment Amount'} ({currency})
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

                                {isLoadingQuote && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Calculating payable total...
                                        </div>
                                    </div>
                                )}

                                {quote && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm">
                                        <div className="flex items-center justify-between py-1 text-[var(--text-muted)]">
                                            <span>{isCharity ? 'Donation amount' : 'Investment amount'}</span>
                                            <span className="font-bold text-[var(--text-main)]">{quote.currency} {quote.projectNetAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 text-[var(--text-muted)]">
                                            <span>Transaction fees</span>
                                            <span>{quote.currency} {(quote.dpoFee + quote.keiboFee).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 text-[var(--text-muted)]">
                                            <span>Taxes</span>
                                            <span>{quote.currency} {quote.dpoVat.toLocaleString()}</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[var(--text-main)]">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Total</span>
                                            <span className="text-base font-black">{quote.currency} {quote.grossAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                                {/* Testing-mode bypass banner — shown when backend has ROI_REQUIRE_ONCHAIN_PROVISIONING=false */}
                                {quote?.roi?.bypassActive && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                                    >
                                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                                                Testing mode active
                                            </p>
                                            <p className="font-medium leading-5">
                                                ROI provisioning checks are bypassed on this platform instance.
                                                {!quote.roi.nftMintingEnabled && ' NFT minting is also disabled.'}
                                                {' '}Your investment will be recorded but may not be backed by an on-chain NFT until production provisioning is complete.
                                            </p>
                                        </div>
                                    </div>
                                )}

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

                                {error && (() => {
                                    const { label, icon } = resolveErrorLabel(error);
                                    const isProvisioningError =
                                        error.toLowerCase().includes('provisioned on-chain') ||
                                        error.toLowerCase().includes('not yet been provisioned') ||
                                        error.toLowerCase().includes('provisioning previously failed');

                                    return (
                                        <div
                                            role="alert"
                                            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                                                isProvisioningError
                                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                    : 'border-rose-300 bg-rose-100 text-rose-900'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                {icon}
                                                <div className="space-y-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                                        isProvisioningError ? 'text-amber-700' : 'text-rose-700'
                                                    }`}>
                                                        {label}
                                                    </p>
                                                    <p className={`font-semibold leading-6 ${
                                                        isProvisioningError ? 'text-amber-950' : 'text-rose-950'
                                                    }`}>
                                                        {error}
                                                    </p>
                                                    {isProvisioningError && (
                                                        <p className="text-xs text-amber-700 mt-1">
                                                            This project is approved but its blockchain record has not been set up yet.
                                                            Contact the platform admin to complete the setup.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

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
                                        disabled={isSubmitting || isLoadingQuote}
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
                                                {isCharity ? 'Donate' : 'Invest'}
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
