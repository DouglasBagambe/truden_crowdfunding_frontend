'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, CheckCircle, Clock, XCircle, AlertTriangle,
    Loader2, ChevronRight, ExternalLink, RefreshCw, AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface KycProfile {
    id: string;
    status: string;
    userKycStatus: string;
    firstName?: string | null;
    lastName?: string | null;
    country?: string | null;
    idType?: string | null;
    submittedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    providerName?: string | null;
    documents: any[];
    verificationUrl?: string;
}

type Step = 'overview' | 'form' | 'submitting' | 'redirect' | 'pending';

const STATUS_MAP: Record<string, { label: string; container: string; iconBox: string; icon: string; labelClass: string }> = {
    UNVERIFIED: {
        label: 'Not Verified',
        container: 'bg-[var(--secondary)] border-[var(--border)]',
        iconBox: 'bg-slate-100 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800/40',
        icon: 'text-slate-700 dark:text-slate-300',
        labelClass: 'text-slate-800 dark:text-slate-200',
    },
    PENDING: {
        label: 'Under Review',
        container: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30',
        iconBox: 'bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40',
        icon: 'text-amber-700 dark:text-amber-300',
        labelClass: 'text-amber-800 dark:text-amber-200',
    },
    VERIFIED: {
        label: 'Verified',
        container: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30',
        iconBox: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40',
        icon: 'text-emerald-700 dark:text-emerald-300',
        labelClass: 'text-emerald-800 dark:text-emerald-200',
    },
    APPROVED: {
        label: 'Verified',
        container: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30',
        iconBox: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40',
        icon: 'text-emerald-700 dark:text-emerald-300',
        labelClass: 'text-emerald-800 dark:text-emerald-200',
    },
    REJECTED: {
        label: 'Rejected',
        container: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30',
        iconBox: 'bg-rose-100 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40',
        icon: 'text-rose-700 dark:text-rose-300',
        labelClass: 'text-rose-800 dark:text-rose-200',
    },
    EXPIRED: {
        label: 'Expired',
        container: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30',
        iconBox: 'bg-orange-100 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/40',
        icon: 'text-orange-700 dark:text-orange-300',
        labelClass: 'text-orange-800 dark:text-orange-200',
    },
    NEEDS_MORE_INFO: {
        label: 'More Info Needed',
        container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30',
        iconBox: 'bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40',
        icon: 'text-blue-700 dark:text-blue-300',
        labelClass: 'text-blue-800 dark:text-blue-200',
    },
};

export function KYCView() {
    const { user, refetchUser } = useAuth();
    const [profile, setProfile] = useState<KycProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [step, setStep] = useState<Step>('overview');
    const [submitting, setSubmitting] = useState(false);
    const [verificationUrl, setVerificationUrl] = useState('');

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        country: 'UG',
        idType: 'NATIONAL_ID',
        dateOfBirth: '',
    });

    useEffect(() => { loadProfile(); }, []);

    useEffect(() => {
        if (user) {
            setForm(f => ({
                ...f,
                firstName: user.firstName || f.firstName,
                lastName: user.lastName || f.lastName,
            }));
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            setLoadingProfile(true);
            const res = await apiClient.get('/kyc/profile');
            setProfile(res.data);
        } catch (err) {
        } finally {
            setLoadingProfile(false);
        }
    };

    /** Explicitly poll Didit for latest status and update local DB */
    const refreshFromProvider = async () => {
        try {
            const res = await apiClient.post('/kyc/refresh');
            setProfile(res.data);
            await refetchUser();
            const newStatus = res.data?.userKycStatus || res.data?.status;
            if (newStatus === 'VERIFIED' || newStatus === 'APPROVED') {
                toast.success('Identity verified successfully!');
                setStep('overview');
            } else if (newStatus === 'REJECTED') {
                toast.error('Verification was rejected. You can re-submit.');
                setStep('overview');
            }
        } catch (err: any) {
            // Fallback to regular profile load
            await loadProfile();
        }
    };

    const handleSubmit = async () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            toast.error('First and last name are required');
            return;
        }

        setSubmitting(true);
        setStep('submitting');

        try {
            // Step 1: Update profile fields
            await apiClient.patch('/kyc/profile', {
                firstName: form.firstName,
                lastName: form.lastName,
                country: form.country,
                idType: form.idType,
                dateOfBirth: form.dateOfBirth || undefined,
            });

            // Step 2: Submit to Didit provider
            const res = await apiClient.post('/kyc/submit', {
                userType: 'INVESTOR',
                level: 'BASIC',
            });

            const data = res.data;
            setProfile(data);
            await refetchUser();

            if (data.verificationUrl) {
                setVerificationUrl(data.verificationUrl);
                setStep('redirect');
            } else {
                setStep('pending');
                toast.success('KYC submitted for review!');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
            toast.error(msg);
            setStep('form');
        } finally {
            setSubmitting(false);
        }
    };

    // Auto-poll while pending
    useEffect(() => {
        if (step !== 'pending') return;
        const interval = setInterval(() => {
            refreshFromProvider();
        }, 10000); // poll every 10s
        return () => clearInterval(interval);
    }, [step]);

    if (loadingProfile) {
        return (
            <div className="py-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    const kycStatus = user?.kycStatus || profile?.userKycStatus || 'UNVERIFIED';
    const profileStatus = profile?.status || 'UNVERIFIED';
    const cfg = STATUS_MAP[kycStatus] || STATUS_MAP.UNVERIFIED;

    const isVerified = kycStatus === 'VERIFIED' || profileStatus === 'APPROVED';
    const isPending = kycStatus === 'PENDING' || ['UNDER_REVIEW', 'PENDING', 'SUBMITTED_TO_PROVIDER'].includes(profileStatus);
    const canStart = ['REJECTED', 'EXPIRED', 'NEEDS_MORE_INFO', 'UNVERIFIED', 'NOT_VERIFIED'].includes(kycStatus) ||
        ['REJECTED', 'EXPIRED', 'NEEDS_MORE_INFO', 'UNVERIFIED', 'DRAFT'].includes(profileStatus);

    // ─── REDIRECT TO DIDIT ───
    if (step === 'redirect') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center space-y-5 py-8">
                    <div className="w-16 h-16 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--border)]">
                        <ExternalLink className="w-7 h-7 text-[var(--primary)]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Complete Verification</h3>
                        <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                            Click below to open the secure verification page. Once complete, come back and your status will update automatically.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 items-center">
                        <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button_primary flex items-center gap-2 px-8 py-3.5"
                            onClick={() => setTimeout(() => setStep('pending'), 2000)}
                        >
                            <ExternalLink size={16} />
                            Open Verification Page
                        </a>
                        <button
                            onClick={() => setStep('pending')}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            I've already completed it →
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ─── SUBMITTING ───
    if (step === 'submitting') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                <p className="text-sm text-[var(--text-muted)]">Initiating verification session...</p>
            </motion.div>
        );
    }

    // ─── PENDING ───
    if (step === 'pending') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center space-y-5 py-8">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/40">
                        <Clock className="w-7 h-7 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Under Review</h3>
                        <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                            Your documents have been submitted. Status is refreshing automatically — this usually takes a few minutes.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Checking verification status...</span>
                    </div>
                    <button
                        onClick={refreshFromProvider}
                        className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline mx-auto"
                    >
                        <RefreshCw size={14} /> Refresh Now
                    </button>
                </div>
            </motion.div>
        );
    }

    // ─── FORM ───
    if (step === 'form') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
                <div>
                    <button
                        onClick={() => setStep('overview')}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] mb-3 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h3 className="text-lg font-bold">Personal Information</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Provide your details, then you'll be redirected to our verification partner.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">First Name</label>
                            <input
                                value={form.firstName}
                                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                placeholder="John"
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Last Name</label>
                            <input
                                value={form.lastName}
                                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                placeholder="Doe"
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Date of Birth</label>
                        <input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                            className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Country</label>
                            <select
                                value={form.country}
                                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all"
                            >
                                <option value="UG">Uganda</option>
                                <option value="KE">Kenya</option>
                                <option value="TZ">Tanzania</option>
                                <option value="RW">Rwanda</option>
                                <option value="NG">Nigeria</option>
                                <option value="ZA">South Africa</option>
                                <option value="GB">United Kingdom</option>
                                <option value="US">United States</option>
                                <option value="DE">Germany</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">ID Type</label>
                            <select
                                value={form.idType}
                                onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all"
                            >
                                <option value="NATIONAL_ID">National ID</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                            </select>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    You'll be redirected to a secure verification page to scan your ID and take a selfie. Your data is encrypted end-to-end.
                </p>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !form.firstName.trim() || !form.lastName.trim()}
                    className="w-full button_primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                    Continue to Verification
                </button>
            </motion.div>
        );
    }

    // ─── OVERVIEW ───
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Status banner */}
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${cfg.container}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${cfg.iconBox}`}>
                    {isVerified ? <CheckCircle size={22} className={cfg.icon} /> :
                        isPending ? <Clock size={22} className={cfg.icon} /> :
                            kycStatus === 'REJECTED' ? <XCircle size={22} className={cfg.icon} /> :
                                kycStatus === 'EXPIRED' ? <AlertTriangle size={22} className={cfg.icon} /> :
                                    <Shield size={22} className={cfg.icon} />}
                </div>
                <div className="flex-1">
                    <p className={`font-bold ${cfg.labelClass}`}>{cfg.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {isVerified && profile?.approvedAt
                            ? `Verified on ${new Date(profile.approvedAt).toLocaleDateString()}. Valid for 12 months.`
                            : isPending
                                ? 'Your submission is being reviewed. You will be notified once complete.'
                                : kycStatus === 'REJECTED'
                                    ? `Reason: ${profile?.rejectionReason || 'Documents could not be verified. Please try again.'}`
                                    : 'Complete verification to invest in projects.'}
                    </p>
                </div>
                {isPending && (
                    <button
                        onClick={refreshFromProvider}
                        className="flex-shrink-0 p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors"
                        title="Refresh status from Didit"
                    >
                        <RefreshCw size={16} className="text-[var(--text-muted)]" />
                    </button>
                )}
            </div>

            {isVerified ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold">Verification Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            { label: 'Name', value: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user?.firstName || '—' },
                            { label: 'Provider', value: (profile?.providerName || 'Didit').toUpperCase() },
                            { label: 'ID Type', value: profile?.idType || '—' },
                            { label: 'Country', value: profile?.country || '—' },
                        ].map(row => (
                            <div key={row.label} className="bg-[var(--secondary)] rounded-xl p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{row.label}</p>
                                <p className="font-semibold mt-1">{row.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Why verify */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
                        <h4 className="font-bold text-sm">Why verify?</h4>
                        <ul className="space-y-2.5">
                            {[
                                'Invest in ROI projects',
                                'Access deal room documents',
                                'Higher transaction limits',
                                'Required for regulatory compliance',
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* What you need */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm">What you'll need</h4>
                            <ul className="space-y-2.5">
                                {[
                                    'Government-issued photo ID (National ID or Passport)',
                                    'A short selfie for liveness check',
                                ].map((req, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {canStart && (
                            <button
                                onClick={() => setStep('form')}
                                className="w-full button_primary py-3 flex items-center justify-center gap-2"
                            >
                                {kycStatus === 'REJECTED' || kycStatus === 'EXPIRED' ? 'Re-verify Identity' : 'Start Verification'}
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
