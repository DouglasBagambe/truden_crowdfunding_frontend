'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Shield, Upload, CheckCircle, Clock, XCircle,
    AlertTriangle, ChevronRight, User, CreditCard, FileText,
    Camera, Loader2, Info, ArrowRight, Lock,
    Globe
} from 'lucide-react';
import { userService } from '@/lib/user-service';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function KYCView() {
    const { user, refetchUser } = useAuth();
    const [step, setStep] = useState<'status' | 'personal' | 'document' | 'selfie' | 'review' | 'done'>('status');
    const [submitting, setSubmitting] = useState(false);

    const kycStatus = user?.kycStatus || 'UNVERIFIED';

    const statusInfo: any = {
        UNVERIFIED: {
            label: 'Not Started',
            icon: <Shield className="w-8 h-8" />,
            color: 'text-gray-400',
            bg: 'bg-gray-500/10',
            desc: 'Complete identity verification to unlock full platform access and higher limits.',
        },
        APPROVED: {
            label: 'Verified',
            icon: <ShieldCheck className="w-8 h-8" />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            desc: 'Your account is fully verified. You have full access to all features.',
        },
        PENDING: {
            label: 'Under Review',
            icon: <Clock className="w-8 h-8" />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            desc: 'Our compliance team is currently reviewing your submission.',
        }
    };

    const currentStatus = statusInfo[kycStatus] || statusInfo.UNVERIFIED;

    if (kycStatus === 'APPROVED') {
        return (
            <div className="py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-500/20">
                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-[var(--text-main)]">You're All Set!</h3>
                    <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto">Your identity has been verified. You can now invest and launch campaigns with full confidence.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className={`p-8 rounded-[2.5rem] border ${currentStatus.bg} border-current/10 flex items-start gap-6`}>
                <div className={currentStatus.color}>
                    {currentStatus.icon}
                </div>
                <div className="space-y-1">
                    <h3 className={`text-xl font-black ${currentStatus.color}`}>{currentStatus.label}</h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{currentStatus.desc}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 space-y-6">
                    <h4 className="font-bold text-lg">Why verify your identity?</h4>
                    <div className="space-y-4">
                        {[
                            { icon: <Lock className="w-5 h-5 text-blue-500" />, text: 'Invest in ROI and Charity projects' },
                            { icon: <Shield className="w-5 h-5 text-emerald-500" />, text: 'Unlock deal room documents' },
                            { icon: <Globe className="w-5 h-5 text-indigo-500" />, text: 'Launch your own campaigns' },
                            { icon: <CreditCard className="w-5 h-5 text-amber-500" />, text: 'Higher transaction limits' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--secondary)] rounded-xl">
                                    {item.icon}
                                </div>
                                <span className="text-sm font-semibold text-[var(--text-muted)]">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg">Requirements</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Government Issued ID
                            </li>
                            <li className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Proof of Address
                            </li>
                            <li className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Live Selfie Verification
                            </li>
                        </ul>
                    </div>

                    {kycStatus === 'UNVERIFIED' && (
                        <button
                            onClick={() => toast.success("Opening verification wizard...")}
                            className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={20} />
                            START VERIFICATION
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
