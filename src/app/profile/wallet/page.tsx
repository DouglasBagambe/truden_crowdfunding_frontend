'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Send, ArrowDownToLine, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { walletService, type WalletBalance } from '@/lib/wallet-service';
import { flutterwaveService } from '@/lib/flutterwave-service';

export default function WalletPage() {
    const [wallet, setWallet] = useState<any>(null);
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showAddMethodModal, setShowAddMethodModal] = useState(false);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            const [walletData, balanceData, txData] = await Promise.all([
                walletService.getWallet(),
                walletService.getBalance(),
                walletService.getTransactions(),
            ]);
            setWallet(walletData);
            setBalance(balanceData);
            setTransactions(txData);
        } catch (error) {
            console.error('Error loading wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
                    <button
                        onClick={() => setShowAddMethodModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Payment Method
                    </button>
                </div>

                {/* Wallet Balance Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Wallet className="w-8 h-8" />
                            <h2 className="text-2xl font-bold">Your Wallet</h2>
                        </div>

                        {/* Fiat Balance */}
                        <div className="mb-6">
                            <p className="text-white/80 text-sm mb-2">Fiat Balance</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-white/80 text-xs mb-1">UGX</p>
                                    <p className="text-3xl font-bold">
                                        {balance?.fiatBalance.UGX.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-white/80 text-xs mb-1">USD</p>
                                    <p className="text-3xl font-bold">
                                        ${balance?.fiatBalance.USD.toLocaleString() || '0'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Crypto Balance */}
                        <div className="mb-6">
                            <p className="text-white/80 text-sm mb-2">Crypto Balance</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-white/80 text-xs mb-1">ETH</p>
                                    <p className="text-2xl font-bold">
                                        {balance?.cryptoBalance.ETH.toFixed(4) || '0.0000'}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-white/80 text-xs mb-1">USDC</p>
                                    <p className="text-2xl font-bold">
                                        {balance?.cryptoBalance.USDC.toLocaleString() || '0'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Balance */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/80 text-sm mb-1">Total Balance (USD)</p>
                            <p className="text-4xl font-bold">
                                ${balance?.totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="flex flex-col items-center gap-2 p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                            >
                                <ArrowDownToLine className="w-6 h-6" />
                                <span className="text-sm font-semibold">Deposit</span>
                            </button>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="flex flex-col items-center gap-2 p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                            >
                                <Send className="w-6 h-6" />
                                <span className="text-sm font-semibold">Withdraw</span>
                            </button>
                            <button
                                className="flex flex-col items-center gap-2 p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                            >
                                <TrendingUp className="w-6 h-6" />
                                <span className="text-sm font-semibold">Invest</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Methods */}
                {wallet?.withdrawalMethods && wallet.withdrawalMethods.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Withdrawal Methods</h3>
                        <div className="space-y-3">
                            {wallet.withdrawalMethods.map((method: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {method.type === 'mobile_money' ? (
                                            <Smartphone className="w-6 h-6 text-blue-600" />
                                        ) : (
                                            <CreditCard className="w-6 h-6 text-purple-600" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {method.provider.toUpperCase()} - {method.accountNumber}
                                            </p>
                                            <p className="text-sm text-gray-500">{method.accountName}</p>
                                        </div>
                                    </div>
                                    {method.isDefault && (
                                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                                            DEFAULT
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
                    {transactions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No transactions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 10).map((tx: any) => (
                                <div
                                    key={tx._id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {tx.amount > 0 ? (
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {tx.paymentMethod === 'wallet' ? 'Investment' : 'Deposit'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showDepositModal && (
                <DepositModal
                    onClose={() => setShowDepositModal(false)}
                    onSuccess={loadWalletData}
                />
            )}
            {showWithdrawModal && (
                <WithdrawModal
                    wallet={wallet}
                    onClose={() => setShowWithdrawModal(false)}
                    onSuccess={loadWalletData}
                />
            )}
            {showAddMethodModal && (
                <AddMethodModal
                    onClose={() => setShowAddMethodModal(false)}
                    onSuccess={loadWalletData}
                />
            )}
        </div>
    );
}

// Deposit Modal Component
function DepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('UGX');
    const [loading, setLoading] = useState(false);

    const handleDeposit = async () => {
        setLoading(true);
        try {
            const result = await walletService.deposit({
                amount: parseFloat(amount),
                currency,
                redirectUrl: `${window.location.origin}/profile/wallet`,
            });

            if (result.paymentLink) {
                window.location.href = result.paymentLink;
            }
        } catch (error) {
            console.error('Deposit failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Deposit to Wallet</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="UGX">UGX</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            min="5000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum: {currency} 5,000</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeposit}
                            disabled={loading || !amount}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Deposit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Withdraw Modal Component
function WithdrawModal({ wallet, onClose, onSuccess }: any) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('UGX');
    const [methodIndex, setMethodIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        setLoading(true);
        try {
            await walletService.withdraw({
                amount: parseFloat(amount),
                currency,
                withdrawalMethodIndex: methodIndex,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Withdrawal failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Withdraw from Wallet</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                        <select
                            value={methodIndex}
                            onChange={(e) => setMethodIndex(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            {wallet?.withdrawalMethods?.map((method: any, index: number) => (
                                <option key={index} value={index}>
                                    {method.provider.toUpperCase()} - {method.accountNumber}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="UGX">UGX</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            min="10000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum: {currency} 10,000</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleWithdraw}
                            disabled={loading || !amount}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add Method Modal Component
function AddMethodModal({ onClose, onSuccess }: any) {
    const [type, setType] = useState<'mobile_money' | 'bank_account'>('mobile_money');
    const [provider, setProvider] = useState('mtn');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        try {
            await walletService.addWithdrawalMethod({
                type,
                provider,
                accountNumber,
                accountName,
                isDefault: false,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add method:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Add Withdrawal Method</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="mobile_money">Mobile Money</option>
                            <option value="bank_account">Bank Account</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                        <input
                            type="text"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            placeholder="e.g., mtn, airtel, stanbic"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="256700000000"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !accountNumber || !accountName}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Method'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
