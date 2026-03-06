'use client';

import { useState, useEffect } from 'react';
import { Activity, Wallet, TrendingUp, TrendingDown, Plus, Send, ArrowDownToLine, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { walletService, type WalletBalance } from '@/lib/wallet-service';
import { motion } from 'framer-motion';

export function WalletView() {
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
            <div className="py-24 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Wallet Balance Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-sky-600 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/10">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-40 translate-x-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Keibo Wallet</h2>
                            </div>

                            <div className="space-y-1">
                                <p className="text-white/70 text-xs font-black uppercase tracking-widest">Total Estimated Balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold opacity-60">UGX</span>
                                    <h3 className="text-5xl font-black">
                                        {((balance?.totalBalanceUSD || 0) * 3800).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-[1.5rem] p-5 border border-white/10">
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Fiat (UGX)</p>
                                <p className="text-xl font-bold">
                                    {balance?.fiatBalance.UGX.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-[1.5rem] p-5 border border-white/10">
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Crypto (USDC)</p>
                                <p className="text-xl font-bold">
                                    {balance?.cryptoBalance.USDC.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            <ArrowDownToLine className="w-5 h-5" />
                            <span>DEPOSIT</span>
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl font-black border border-white/20 hover:bg-white/30 transition-all"
                        >
                            <Send className="w-5 h-5" />
                            <span>WITHDRAW</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Recent Activity
                    </h3>
                </div>

                {transactions.length === 0 ? (
                    <div className="py-16 text-center bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed">
                        <p className="text-[var(--text-muted)] font-medium">No transactions found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx: any) => (
                            <div
                                key={tx._id}
                                className="flex items-center justify-between p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)]/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white'}`}>
                                        {tx.amount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">
                                            {tx.paymentMethod === 'wallet' ? 'Investment' : 'Wallet Deposit'}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] font-medium">
                                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--text-muted)]">
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            {/* ... similar porting if needed or keep it simple ... */}
        </motion.div>
    );
}
