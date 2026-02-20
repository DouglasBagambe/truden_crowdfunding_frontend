'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { flutterwaveService } from '@/lib/flutterwave-service';

function VerifyPaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [error, setError] = useState('');

    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    useEffect(() => {
        if (txRef || transactionId) {
            verify();
        } else {
            setStatus('failed');
            setError('Invalid transaction reference.');
        }
    }, [txRef, transactionId]);

    const verify = async () => {
        try {
            const result = await flutterwaveService.verifyPayment(txRef || transactionId || '');
            if (result.status === 'successful') {
                setStatus('success');
                setOrderDetails(result.transaction);
            } else {
                setStatus('failed');
                setError('The payment was not successful. Please contact support if this is an error.');
            }
        } catch (err: any) {
            setStatus('failed');
            setError(err.response?.data?.message || 'Failed to verify payment status.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className={`absolute top-0 left-0 w-full h-2 ${status === 'verifying' ? 'bg-blue-500 animate-pulse' :
                    status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />

                <AnimatePresence mode="wait">
                    {status === 'verifying' && (
                        <motion.div
                            key="verifying"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="py-8"
                        >
                            <Loader2 className="w-20 h-20 text-blue-600 animate-spin mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
                            <p className="text-gray-600">Please don't close this window while we secure your transaction...</p>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-4"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Thank You!</h1>
                            <p className="text-gray-600 mb-8">Your investment of <span className="font-bold text-gray-900">{orderDetails?.currency} {orderDetails?.amount?.toLocaleString()}</span> was successful.</p>

                            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Transaction ID</span>
                                    <span className="text-xs font-mono text-gray-600">{orderDetails?.id || txRef}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-green-700 font-medium">
                                    <ShieldCheck className="w-5 h-5" /> Secured by Flutterwave
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 group"
                                >
                                    Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => router.push('/profile/wallet')}
                                    className="w-full py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all font-semibold"
                                >
                                    View My Wallet
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === 'failed' && (
                        <motion.div
                            key="failed"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-4"
                        >
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Oops!</h1>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <p className="text-sm text-gray-400 mb-8 font-medium">If your account was debited, please wait few minutes or contact our 24/7 support team.</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.back()}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Loading verification...</div>}>
            <VerifyPaymentPageContent />
        </Suspense>
    );
}
