'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { projectService } from '@/lib/project-service';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/constants/contracts';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const InvestModal = ({ isOpen, onClose, project }: InvestModalProps) => {
  const queryClient = useQueryClient();
  const { isConnected, address } = useAccount();
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
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
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

  // Effect to handle backend sync after TX confirmation
  React.useEffect(() => {
    if (isTxConfirmed && hash) {
      const syncWithBackend = async () => {
        setIsApiLoading(true);
        try {
          await projectService.invest({
            projectId: project.id,
            amount: Number(amount)
          });
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setAmount('');
          }, 3000);
        } catch (err: any) {
          setError('Blockchain success, but backend sync failed. Please contact support.');
        } finally {
          setIsApiLoading(false);
        }
      };
      syncWithBackend();
    }
  }, [isTxConfirmed, hash]);

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
          >
            {/* Header ... */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Invest in Project</h2>
                <p className="text-sm text-gray-500 truncate w-64">{project.title}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Investment Successful!</h3>
                  <p className="text-gray-500 max-w-xs">Your contribution has been recorded on Celo and synced with our platform.</p>
                </div>
              ) : (
                <form onSubmit={handleInvest} className="space-y-6">
                  {(error || contractError) && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error || (contractError as any)?.shortMessage || 'Transaction failed'}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Investment Amount (ETH)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 pr-16 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="0.00"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">ETH</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Platform Fee (1%)</span>
                      <span className="text-gray-900 font-bold">{(Number(amount) * 0.01).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">{(Number(amount) * 1.01).toFixed(4)} ETH</span>
                    </div>
                  </div>

                  <button
                    disabled={isLoading || !isConnected}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                    {isWaitingForTx ? 'Confirming on-chain...' : isContractLoading ? 'Confirm in Wallet...' : 'Confirm Investment'}
                  </button>

                  <p className="text-center text-xs text-gray-400 font-medium">
                    This transaction will be executed on the Celo Alfajores Testnet.
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
