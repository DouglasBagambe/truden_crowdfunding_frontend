'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { paymentService } from '@/lib/payment-service';
import Link from 'next/link';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const status = searchParams.get('status');       // 'success' | 'cancelled'
    const token = searchParams.get('ID');             // DPO sends ?ID=token on success
    const projectId = searchParams.get('projectId');

    const [verifyState, setVerifyState] = useState<'verifying' | 'paid' | 'failed' | 'cancelled'>(
        status === 'cancelled' ? 'cancelled' : 'verifying'
    );
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (status === 'cancelled' || !token) {
            setVerifyState('cancelled');
            return;
        }

        // Verify the payment with the backend
        paymentService.verifyDPOPayment(token)
            .then((res) => {
                if (res.status === 'successful' || res.verify?.status === '000') {
                    setVerifyState('paid');
                    setMessage('Your payment was confirmed successfully.');
                } else if (res.status === 'pending') {
                    // Still processing — show as success and let webhook finalize
                    setVerifyState('paid');
                    setMessage('Payment received. Finalizing your contribution...');
                } else {
                    setVerifyState('failed');
                    setMessage(res.verify?.message || 'Payment could not be verified.');
                }
            })
            .catch(() => {
                // Verification error — treat as paid since DPO redirected with success
                // The backend webhook will finalize
                setVerifyState('paid');
                setMessage('Payment received. Your account will be updated shortly.');
            });
    }, [token, status]);

    const config = {
        verifying: {
            icon: <Loader2 size={64} className="text-blue-400 animate-spin" />,
            title: 'Verifying Payment...',
            subtitle: 'Please wait while we confirm your payment with DPO.',
            color: 'from-blue-600/20 to-indigo-600/20',
            border: 'border-blue-500/30',
        },
        paid: {
            icon: <CheckCircle2 size={64} className="text-emerald-400" />,
            title: 'Payment Successful! 🎉',
            subtitle: message || 'Your contribution has been recorded. Thank you for supporting this project!',
            color: 'from-emerald-600/20 to-teal-600/20',
            border: 'border-emerald-500/30',
        },
        failed: {
            icon: <XCircle size={64} className="text-red-400" />,
            title: 'Payment Failed',
            subtitle: message || 'Something went wrong with your payment. Please try again.',
            color: 'from-red-600/20 to-rose-600/20',
            border: 'border-red-500/30',
        },
        cancelled: {
            icon: <XCircle size={64} className="text-orange-400" />,
            title: 'Payment Cancelled',
            subtitle: 'You cancelled the payment. No funds were charged.',
            color: 'from-orange-600/20 to-amber-600/20',
            border: 'border-orange-500/30',
        },
    };

    const cfg = config[verifyState];

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative w-full max-w-md bg-gradient-to-br ${cfg.color} backdrop-blur-xl border ${cfg.border} rounded-3xl p-10 text-center shadow-2xl`}
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex justify-center mb-6"
                >
                    {cfg.icon}
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl font-black text-white mb-3 tracking-tight">{cfg.title}</h1>
                <p className="text-gray-400 font-medium mb-8 leading-relaxed">{cfg.subtitle}</p>

                {/* DPO badge */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-xs text-gray-500 font-medium">Secured by</span>
                    <span className="text-xs font-black text-white bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        DPO Pay
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {projectId && verifyState === 'paid' && (
                        <Link
                            href={`/projects/${projectId}`}
                            className="flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all"
                        >
                            View Project <ArrowRight size={18} />
                        </Link>
                    )}
                    {(verifyState === 'failed' || verifyState === 'cancelled') && projectId && (
                        <Link
                            href={`/projects/${projectId}`}
                            className="flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all"
                        >
                            Try Again <ArrowRight size={18} />
                        </Link>
                    )}
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-white/20 transition-all border border-white/10"
                    >
                        <Home size={18} /> Go to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 size={48} className="text-white animate-spin" />
            </div>
        }>
            <PaymentResultContent />
        </Suspense>
    );
}
