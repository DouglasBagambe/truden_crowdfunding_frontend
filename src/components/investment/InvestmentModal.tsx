'use client';

import { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { flutterwaveService } from '@/lib/flutterwave-service';
import { walletService } from '@/lib/wallet-service';

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        _id: string;
        name: string;
        targetAmount: number;
        currency: string;
    };
    userEmail: string;
}

type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer' | 'wallet';
type MobileMoneyProvider = 'mtn' | 'airtel';

export default function InvestmentModal({ isOpen, onClose, project, userEmail }: InvestmentModalProps) {
    const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
    const [mobileMoneyProvider, setMobileMoneyProvider] = useState<MobileMoneyProvider>('mtn');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [transactionId, setTransactionId] = useState('');

    if (!isOpen) return null;

    const handleAmountSubmit = () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 1000) {
            setError('Minimum investment is UGX 1,000');
            return;
        }
        setError('');
        setStep('payment');
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            const amountNum = parseFloat(amount);

            if (paymentMethod === 'wallet') {
                // Wallet payment
                const result = await walletService.invest({
                    amount: amountNum,
                    currency: project.currency || 'UGX',
                    projectId: project._id,
                });

                setTransactionId(result.transactionId);
                setStep('success');
            } else {
                // Flutterwave payment
                const result = await flutterwaveService.initializePayment({
                    amount: amountNum,
                    currency: (project.currency || 'UGX') as 'UGX' | 'USD',
                    email: userEmail,
                    phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
                    paymentMethod,
                    mobileMoneyProvider: paymentMethod === 'mobile_money' ? mobileMoneyProvider : undefined,
                    projectId: project._id,
                    redirectUrl: `${window.location.origin}/investment/verify`,
                });

                setTransactionId(result.transactionId);

                // Redirect to payment page if link is provided
                if (result.paymentLink) {
                    window.location.href = result.paymentLink;
                } else {
                    setStep('processing');
                    // Poll for payment status
                    pollPaymentStatus(result.reference);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pollPaymentStatus = async (txRef: string) => {
        const maxAttempts = 30; // 30 attempts = 5 minutes
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;

            try {
                const result = await flutterwaveService.verifyPayment(txRef);

                if (result.status === 'successful') {
                    clearInterval(interval);
                    setStep('success');
                } else if (result.status === 'failed') {
                    clearInterval(interval);
                    setError('Payment failed. Please try again.');
                    setStep('payment');
                }
            } catch (err) {
                console.error('Error polling payment status:', err);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setError('Payment verification timeout. Please check your transaction history.');
                setStep('payment');
            }
        }, 10000); // Poll every 10 seconds
    };

    const resetModal = () => {
        setStep('amount');
        setAmount('');
        setPaymentMethod('mobile_money');
        setPhoneNumber('');
        setError('');
        setTransactionId('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 'success' ? 'Investment Successful!' : 'Invest in Project'}
                    </h2>
                    <button
                        onClick={resetModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Project Info */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Target: {project.currency} {project.targetAmount.toLocaleString()}
                        </p>
                    </div>

                    {/* Step 1: Amount */}
                    {step === 'amount' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Investment Amount ({project.currency})
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="1000"
                                    step="1000"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum: {project.currency} 1,000</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleAmountSubmit}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-sky-700 transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* Step 2: Payment Method */}
                    {step === 'payment' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Payment Method
                                </label>
                                <div className="space-y-2">
                                    {/* Mobile Money - RECOMMENDED */}
                                    <button
                                        onClick={() => setPaymentMethod('mobile_money')}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'mobile_money'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="w-6 h-6 text-blue-600" />
                                                <div>
                                                    <p className="font-semibold text-gray-900">Mobile Money</p>
                                                    <p className="text-xs text-gray-500">MTN, Airtel</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                                                RECOMMENDED
                                            </span>
                                        </div>
                                    </button>

                                    {/* Card Payment */}
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'card'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Card Payment</p>
                                                <p className="text-xs text-gray-500">Visa, Mastercard</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Bank Transfer */}
                                    <button
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'bank_transfer'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-6 h-6 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Bank Transfer</p>
                                                <p className="text-xs text-gray-500">All Uganda Banks</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Wallet */}
                                    <button
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'wallet'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Wallet className="w-6 h-6 text-orange-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Wallet Balance</p>
                                                <p className="text-xs text-gray-500">Use your wallet funds</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Money Details */}
                            {paymentMethod === 'mobile_money' && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Provider
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setMobileMoneyProvider('mtn')}
                                                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all ${mobileMoneyProvider === 'mtn'
                                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                MTN
                                            </button>
                                            <button
                                                onClick={() => setMobileMoneyProvider('airtel')}
                                                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all ${mobileMoneyProvider === 'airtel'
                                                        ? 'border-red-500 bg-red-50 text-red-700'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                Airtel
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="256700000000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('amount')}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={loading || (paymentMethod === 'mobile_money' && !phoneNumber)}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay ${project.currency} ${parseFloat(amount).toLocaleString()}`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h3>
                            <p className="text-gray-600">Please wait while we verify your payment.</p>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Investment Successful!</h3>
                            <p className="text-gray-600 mb-4">
                                You have successfully invested {project.currency} {parseFloat(amount).toLocaleString()} in {project.name}.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Your investment NFT will be minted shortly and will appear in your portfolio.
                            </p>
                            <button
                                onClick={resetModal}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-sky-700 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
