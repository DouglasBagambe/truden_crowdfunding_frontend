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

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    UNVERIFIED: { label: 'Not Verified', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    PENDING: { label: 'Under Review', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    VERIFIED: { label: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    APPROVED: { label: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    REJECTED: { label: 'Rejected', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    EXPIRED: { label: 'Expired', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    NEEDS_MORE_INFO: { label: 'More Info Needed', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
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
            console.log('[KYC] Loading profile...');
            const res = await apiClient.get('/kyc/profile');
            console.log('[KYC] Profile loaded:', res.data);
            setProfile(res.data);
        } catch (err) {
            console.log('[KYC] No profile yet (will be created on submit)');
        } finally {
            setLoadingProfile(false);
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
            console.log('[KYC] Updating profile fields...');
            await apiClient.patch('/kyc/profile', {
                firstName: form.firstName,
                lastName: form.lastName,
                country: form.country,
                idType: form.idType,
                dateOfBirth: form.dateOfBirth || undefined,
            });
            console.log('[KYC] Profile fields updated');

            // Step 2: Submit to Didit provider
            console.log('[KYC] Submitting to provider...');
            const res = await apiClient.post('/kyc/submit', {
                userType: 'INVESTOR',
                level: 'BASIC',
            });

            const data = res.data;
            console.log('[KYC] Submit response:', data);
            setProfile(data);
            await refetchUser();

            if (data.verificationUrl) {
                console.log('[KYC] Got verification URL:', data.verificationUrl);
                setVerificationUrl(data.verificationUrl);
                setStep('redirect');
            } else {
                console.log('[KYC] No verification URL — going to pending');
                setStep('pending');
                toast.success('KYC submitted for review!');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
            console.error('[KYC] Submit error:', err?.response?.data || err.message);
            toast.error(msg);
            setStep('form');
        } finally {
            setSubmitting(false);
        }
    };

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
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                        <Clock className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Under Review</h3>
                        <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                            Your documents have been submitted. You'll be notified once verification is complete. This usually takes a few minutes.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            await loadProfile();
                            await refetchUser();
                            setStep('overview');
                        }}
                        className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline mx-auto"
                    >
                        <RefreshCw size={14} /> Refresh Status
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
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${cfg.bg} ${cfg.border}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.border} border`}>
                    {isVerified ? <CheckCircle size={22} className={cfg.color} /> :
                        isPending ? <Clock size={22} className={cfg.color} /> :
                            kycStatus === 'REJECTED' ? <XCircle size={22} className={cfg.color} /> :
                                kycStatus === 'EXPIRED' ? <AlertTriangle size={22} className={cfg.color} /> :
                                    <Shield size={22} className={cfg.color} />}
                </div>
                <div className="flex-1">
                    <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
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
                        onClick={async () => { await loadProfile(); await refetchUser(); }}
                        className="flex-shrink-0 p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors"
                        title="Refresh status"
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
