'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Shield, CheckCircle, Clock, XCircle, AlertTriangle,
    User, CreditCard, FileText, Camera, Loader2, Lock, Globe,
    ChevronRight, ExternalLink, RefreshCw, AlertCircle, Building2
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
}

type VerificationStep = 'overview' | 'choose_type' | 'personal_info' | 'submitting' | 'redirect' | 'pending';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
    UNVERIFIED: {
        label: 'Not Verified',
        icon: Shield,
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
    },
    PENDING: {
        label: 'Under Review',
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
    },
    VERIFIED: {
        label: 'Verified',
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
    },
    APPROVED: {
        label: 'Verified',
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
    },
    REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
    },
    EXPIRED: {
        label: 'Expired – Re-verify',
        icon: AlertTriangle,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
    },
    NEEDS_MORE_INFO: {
        label: 'More Info Needed',
        icon: AlertCircle,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
    },
};

export function KYCView() {
    const { user, refetchUser } = useAuth();
    const [profile, setProfile] = useState<KycProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [step, setStep] = useState<VerificationStep>('overview');
    const [userType, setUserType] = useState<'INVESTOR' | 'CREATOR'>('INVESTOR');
    const [submitting, setSubmitting] = useState(false);
    const [verificationUrl, setVerificationUrl] = useState('');

    // Personal info form
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        country: 'UG',
        idType: 'NATIONAL_ID',
        dateOfBirth: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    // Pre-fill from user profile
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
        } catch {
            // no profile yet — will be created on submit
        } finally {
            setLoadingProfile(false);
        }
    };

    const syncProfile = async () => {
        if (!profile) return;
        try {
            const res = await apiClient.post(`/kyc/admin/profiles/${profile.id}/sync`);
            setProfile(res.data);
            await refetchUser();
        } catch {
            // ignore — admin only
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await apiClient.patch('/kyc/profile', {
                firstName: form.firstName,
                lastName: form.lastName,
                country: form.country,
                idType: form.idType,
                dateOfBirth: form.dateOfBirth || undefined,
            });
        } catch {
            // Non-critical
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
            // Update the profile fields first
            await handleUpdateProfile();

            // Submit to provider
            const res = await apiClient.post('/kyc/submit', {
                userType,
                level: 'BASIC',
            });

            const data = res.data;
            setProfile(data);
            await refetchUser();

            if (data.verificationUrl) {
                // Didit hosted session — redirect user
                setVerificationUrl(data.verificationUrl);
                setStep('redirect');
            } else {
                // Laboremus or other non-redirect flow
                setStep('pending');
                toast.success('KYC submitted for review!');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Submission failed. Please try again.';
            toast.error(msg);
            setStep('personal_info');
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
    const statusCfg = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.UNVERIFIED;
    const StatusIcon = statusCfg.icon;

    const isVerified = kycStatus === 'VERIFIED' || profileStatus === 'APPROVED';
    const isPending = kycStatus === 'PENDING' || ['UNDER_REVIEW', 'PENDING', 'SUBMITTED_TO_PROVIDER'].includes(profileStatus);
    const canResubmit = ['REJECTED', 'EXPIRED', 'NEEDS_MORE_INFO', 'UNVERIFIED'].includes(kycStatus) ||
        ['REJECTED', 'EXPIRED', 'NEEDS_MORE_INFO', 'UNVERIFIED', 'DRAFT'].includes(profileStatus);

    // ─── REDIRECT TO DIDIT ───
    if (step === 'redirect') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center space-y-6 py-10">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-blue-500/20">
                        <ExternalLink className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black">Ready to Verify</h3>
                        <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto text-sm leading-relaxed">
                            You'll be redirected to our secure identity verification partner (Didit).
                            Complete the process there and come back — your status will update automatically.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 items-center">
                        <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button_primary flex items-center gap-2 px-8 py-4 text-base"
                            onClick={() => {
                                setTimeout(() => setStep('pending'), 2000);
                            }}
                        >
                            <ExternalLink size={18} />
                            Open Verification Page
                        </a>
                        <button
                            onClick={() => {
                                setStep('pending');
                            }}
                            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            I've completed verification →
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ─── SUBMITTING ───
    if (step === 'submitting') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 flex flex-col items-center gap-6"
            >
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-muted)] font-medium">Initiating verification session...</p>
            </motion.div>
        );
    }

    // ─── PENDING ───
    if (step === 'pending') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center space-y-6 py-10">
                    <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-amber-500/20">
                        <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black">Under Review</h3>
                        <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto text-sm">
                            Your identity documents have been submitted. Our compliance team will review them
                            and update your status within 24 hours. You'll be able to invest once verified.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            await loadProfile();
                            await refetchUser();
                            setStep('overview');
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:underline mx-auto"
                    >
                        <RefreshCw size={14} /> Check Status
                    </button>
                </div>
            </motion.div>
        );
    }

    // ─── PERSONAL INFO STEP ───
    if (step === 'personal_info') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 max-w-lg"
            >
                <div>
                    <button
                        onClick={() => setStep('choose_type')}
                        className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h3 className="text-xl font-black tracking-tight">Personal Information</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {userType === 'INVESTOR'
                            ? 'Individual verification via Didit — first 500/month are free.'
                            : 'Full KYC + Business KYB via Laboremus Uganda (300–500 UGX per verification).'}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">First Name</label>
                            <input
                                value={form.firstName}
                                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                placeholder="John"
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Last Name</label>
                            <input
                                value={form.lastName}
                                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                placeholder="Doe"
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Date of Birth</label>
                        <input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                            className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Country</label>
                            <select
                                value={form.country}
                                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all"
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">ID Type</label>
                            <select
                                value={form.idType}
                                onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
                                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all"
                            >
                                <option value="NATIONAL_ID">National ID</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                    <strong className="text-[var(--text-main)]">What happens next:</strong> We'll open a secure, hosted
                    verification page where you'll take a photo of your ID and a short selfie video.
                    Your data is encrypted and handled in compliance with GDPR and local regulations.
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !form.firstName.trim() || !form.lastName.trim()}
                    className="w-full button_primary py-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    Start Verification
                </button>
            </motion.div>
        );
    }

    // ─── CHOOSE USER TYPE ───
    if (step === 'choose_type') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 max-w-lg"
            >
                <div>
                    <button
                        onClick={() => setStep('overview')}
                        className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h3 className="text-xl font-black tracking-tight">Who are you verifying as?</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        This determines which verification provider and checks apply.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {[
                        {
                            type: 'INVESTOR' as const,
                            icon: Lock,
                            title: 'Investor',
                            desc: 'Verify your identity to invest in ROI projects. Individual KYC via Didit. First 500 verifications/month are free.',
                            badge: 'Didit · Individual KYC',
                            color: 'text-blue-500',
                            bg: 'bg-blue-500/10',
                        },
                        {
                            type: 'CREATOR' as const,
                            icon: Building2,
                            title: 'Creator / Business',
                            desc: 'Full KYC + business verification (KYB) for campaign creators. Required to launch investment projects.',
                            badge: 'Laboremus · KYC + KYB',
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                        },
                    ].map(opt => {
                        const Icon = opt.icon;
                        const isSelected = userType === opt.type;
                        return (
                            <button
                                key={opt.type}
                                onClick={() => setUserType(opt.type)}
                                className={`p-5 rounded-2xl border-2 text-left transition-all space-y-2 ${isSelected
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2.5 rounded-xl ${opt.bg}`}>
                                        <Icon size={18} className={opt.color} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-[var(--text-main)]">{opt.title}</p>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${opt.bg} ${opt.color}`}>
                                                {opt.badge}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] font-medium mt-1 leading-relaxed">{opt.desc}</p>
                                    </div>
                                    {isSelected && <CheckCircle size={18} className="text-[var(--primary)] mt-0.5 flex-shrink-0" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setStep('personal_info')}
                    className="w-full button_primary py-4 flex items-center justify-center gap-2"
                >
                    Continue <ChevronRight size={16} />
                </button>
            </motion.div>
        );
    }

    // ─── OVERVIEW ───
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Status banner */}
            <div className={`p-6 rounded-2xl border flex items-center gap-5 ${statusCfg.bg} ${statusCfg.border}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${statusCfg.bg} ${statusCfg.border}`}>
                    <StatusIcon size={24} className={statusCfg.color} />
                </div>
                <div className="flex-1">
                    <p className={`font-black text-lg ${statusCfg.color}`}>{statusCfg.label}</p>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                        {isVerified && profile?.approvedAt
                            ? `Verified on ${new Date(profile.approvedAt).toLocaleDateString()}. Valid for 12 months.`
                            : isPending
                                ? 'Your submission is being reviewed. You will be notified once complete.'
                                : kycStatus === 'REJECTED'
                                    ? `Reason: ${profile?.rejectionReason || 'Please re-submit with correct documents.'}`
                                    : 'Complete verification to access all platform features.'}
                    </p>
                </div>
                {isPending && (
                    <button
                        onClick={async () => {
                            await loadProfile();
                            await refetchUser();
                        }}
                        className="flex-shrink-0 p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors"
                        title="Refresh status"
                    >
                        <RefreshCw size={16} className="text-[var(--text-muted)]" />
                    </button>
                )}
            </div>

            {isVerified ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
                    <h4 className="font-black">Verification Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            { label: 'Name', value: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user?.firstName || '—' },
                            { label: 'Provider', value: profile?.providerName?.toUpperCase() || 'Didit' },
                            { label: 'ID Type', value: profile?.idType || '—' },
                            { label: 'Country', value: profile?.country || '—' },
                        ].map(row => (
                            <div key={row.label} className="bg-[var(--secondary)] rounded-xl p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{row.label}</p>
                                <p className="font-bold mt-1">{row.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Why verify */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
                        <h4 className="font-black text-base">Why verify?</h4>
                        <div className="space-y-3">
                            {[
                                { icon: Lock, color: 'text-blue-500', bg: 'bg-blue-500/10', text: 'Invest in ROI & Charity projects' },
                                { icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Access Deal Room documents' },
                                { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-500/10', text: 'Launch your own campaigns' },
                                { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Higher transaction limits' },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${item.bg}`}>
                                            <Icon size={15} className={item.color} />
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-muted)]">{item.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* What you need */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                            <h4 className="font-black text-base">Documents needed</h4>
                            <ul className="space-y-2.5">
                                {[
                                    'Government-issued photo ID (National ID or Passport)',
                                    'Short selfie / liveness check',
                                    'Business registration (for creators only)',
                                ].map((req, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {canResubmit && (
                            <button
                                onClick={() => setStep('choose_type')}
                                className="w-full button_primary py-3.5 flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={18} />
                                {kycStatus === 'REJECTED' || kycStatus === 'EXPIRED' ? 'Re-verify Identity' : 'Start Verification'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
