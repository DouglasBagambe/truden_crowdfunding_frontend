'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { investmentService } from '@/lib/investment-service';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/constants/contracts';
import { useAuth } from '@/hooks/useAuth';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const InvestModal = ({ isOpen, onClose, project }: InvestModalProps) => {
  const queryClient = useQueryClient();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, chains } = useSwitchChain();
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { writeContract, data: hash, error: contractError, isPending: isContractLoading } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please sign in to invest');
      const next = typeof window !== 'undefined' ? window.location.pathname : '/';
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      // Ensure correct network
      const targetChainId = chains?.[0]?.id;
      if (targetChainId && chainId !== targetChainId) {
        setError('Switching network...');
        await switchChainAsync({ chainId: targetChainId });
        setError('');
      }
      const amountWei = parseEther(amount);
      const onChainId = BigInt(project.projectOnchainId || 0);

      writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'deposit',
        args: [onChainId, amountWei],
        value: amountWei,
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed to initiate');
    }
  };

  React.useEffect(() => {
    if (isTxConfirmed && hash) {
      const syncWithBackend = async () => {
        setIsApiLoading(true);
        try {
          await investmentService.createInvestment({
            projectId: project.id || project._id,
            amount: Number(amount),
            projectOnchainId: project.projectOnchainId
          });
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['investments'] });
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setAmount('');
          }, 4000);
        } catch (err: any) {
          console.error('Backend sync error:', err);
          setError('Blockchain success, but backend sync failed. Please contact support.');
        } finally {
          setIsApiLoading(false);
        }
      };
      syncWithBackend();
    }
  }, [isTxConfirmed, hash, project, amount, queryClient, onClose]);

  const isLoading = isContractLoading || isWaitingForTx || isApiLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#111] rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-gray-100 dark:border-[#262626]"
          >
            <div className="p-8 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Support Innovation</h2>
                <p className="text-sm text-[var(--text-muted)] truncate w-64 font-medium">{project.name || project.title}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl transition-colors">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-main)]">Investment Successful!</h3>
                  <p className="text-[var(--text-muted)] font-medium max-w-xs">Your contribution is now held in the TruFund escrow and will be released upon milestone verification.</p>
                </div>
              ) : (
                <form onSubmit={handleInvest} className="space-y-6">
                  {(error || contractError) && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="line-clamp-2">{error || (contractError as any)?.shortMessage || 'Transaction failed'}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Contribution Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input_field text-3xl font-bold py-6 px-8 pr-20"
                        placeholder="0.00"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-[var(--text-muted)] tracking-widest text-xs">CELO</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 space-y-3 border border-gray-100 dark:border-[#262626]">
                    <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] lowercase tracking-widest">
                      <span>Platform Reserve (1%)</span>
                      <span className="text-[var(--text-main)]">{(Number(amount) * 0.01).toFixed(4)} CELO</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-[#262626]">
                      <span className="text-sm font-bold opacity-80">Total Payable</span>
                      <span className="text-xl font-bold text-[var(--primary)]">{(Number(amount) * 1.01).toFixed(4)} CELO</span>
                    </div>
                  </div>

                  <button
                    disabled={isLoading || !isConnected}
                    type="submit"
                    className="button_primary w-full flex items-center justify-center gap-4 py-5 shadow-xl shadow-blue-500/10"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                    <span className="font-bold">
                      {isWaitingForTx ? 'Confirming On-Chain...' : isContractLoading ? 'Authorize in Wallet' : isApiLoading ? 'Syncing Backend...' : 'Execute Contribution'}
                    </span>
                  </button>

                  <p className="text-center text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                    On-chain transparency via Celo Testnet
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvestModal;
