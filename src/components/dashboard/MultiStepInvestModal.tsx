'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Loader2, Wallet, AlertCircle, CheckCircle, 
  ArrowRight, ArrowLeft, Shield, TrendingUp, FileText,
  Sparkles, Share2, Download
} from 'lucide-react';
import { projectService } from '@/lib/project-service';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/constants/contracts';
import { useAuth } from '@/hooks/useAuth';

interface MultiStepInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

type InvestStep = 'amount' | 'terms' | 'wallet' | 'signing' | 'success';

const MultiStepInvestModal = ({ isOpen, onClose, project }: MultiStepInvestModalProps) => {
  const queryClient = useQueryClient();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, chains } = useSwitchChain();
  const { isAuthenticated, user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<InvestStep>('amount');
  const [amount, setAmount] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<string>('');

  const { writeContract, data: hash, error: contractError, isPending: isContractLoading } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate fees
  const platformFee = Number(amount) * 0.025; // 2.5%
  const totalAmount = Number(amount) + platformFee;

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep('amount');
        setAmount('');
        setAcceptedTerms(false);
        setError('');
        setTxHash('');
      }, 300);
    }
  }, [isOpen]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxConfirmed && hash) {
      setCurrentStep('success');
      setTxHash(hash);
      syncWithBackend(hash);
    }
  }, [isTxConfirmed, hash]);

  const syncWithBackend = async (txHash: string) => {
    setIsApiLoading(true);
    try {
      await projectService.invest({
        projectId: project.id,
        amount: Number(amount),
        txHash,
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    } catch (err: any) {
      setError('Blockchain success, but backend sync failed. Your investment is safe on-chain.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'amount' && (!amount || Number(amount) <= 0)) {
      setError('Please enter a valid amount');
      return;
    }
    if (currentStep === 'terms' && !acceptedTerms) {
      setError('Please accept the terms to continue');
      return;
    }
    setError('');

    const stepFlow: InvestStep[] = ['amount', 'terms', 'wallet', 'signing'];
    const currentIndex = stepFlow.indexOf(currentStep);
    if (currentIndex < stepFlow.length - 1) {
      setCurrentStep(stepFlow[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepFlow: InvestStep[] = ['amount', 'terms', 'wallet', 'signing'];
    const currentIndex = stepFlow.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepFlow[currentIndex - 1]);
      setError('');
    }
  };

  const handleInvest = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to invest');
      return;
    }
    if (!isConnected) {
      setError('Please connect your wallet first');
      setCurrentStep('wallet');
      return;
    }

    try {
      setCurrentStep('signing');
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
      setCurrentStep('wallet');
    }
  };

  const getStepProgress = () => {
    const steps: InvestStep[] = ['amount', 'terms', 'wallet', 'signing'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const handleClose = () => {
    if (currentStep === 'signing' || isWaitingForTx) {
      // Don't allow closing during transaction
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-[#111] rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-gray-100 dark:border-[#262626]"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Support Innovation</h2>
                <p className="text-sm text-[var(--text-muted)] truncate w-96 font-medium">
                  {project.name || project.title}
                </p>
              </div>
              <button 
                onClick={handleClose} 
                disabled={currentStep === 'signing' || isWaitingForTx}
                className="p-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Progress Bar */}
            {currentStep !== 'success' && (
              <div className="px-8 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Step {['amount', 'terms', 'wallet', 'signing'].indexOf(currentStep) + 1} of 4
                  </span>
                  <span className="text-xs font-bold text-[var(--primary)]">
                    {Math.round(getStepProgress())}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getStepProgress()}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8 min-h-[400px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Amount */}
                {currentStep === 'amount' && (
                  <StepAmount
                    amount={amount}
                    setAmount={setAmount}
                    platformFee={platformFee}
                    totalAmount={totalAmount}
                    error={error}
                    onNext={handleNext}
                  />
                )}

                {/* Step 2: Terms */}
                {currentStep === 'terms' && (
                  <StepTerms
                    acceptedTerms={acceptedTerms}
                    setAcceptedTerms={setAcceptedTerms}
                    error={error}
                    onNext={handleNext}
                    onBack={handleBack}
                    project={project}
                  />
                )}

                {/* Step 3: Wallet */}
                {currentStep === 'wallet' && (
                  <StepWallet
                    isConnected={isConnected}
                    address={address}
                    error={error}
                    onNext={handleInvest}
                    onBack={handleBack}
                  />
                )}

                {/* Step 4: Signing */}
                {currentStep === 'signing' && (
                  <StepSigning
                    isContractLoading={isContractLoading}
                    isWaitingForTx={isWaitingForTx}
                    error={error || contractError?.message}
                    amount={amount}
                  />
                )}

                {/* Step 5: Success */}
                {currentStep === 'success' && (
                  <StepSuccess
                    project={project}
                    amount={amount}
                    txHash={txHash}
                    onClose={onClose}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Step Components
const StepAmount = ({ amount, setAmount, platformFee, totalAmount, error, onNext }: any) => (
  <motion.div
    key="amount"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
        <TrendingUp className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-main)]">Choose Your Contribution</h3>
      <p className="text-[var(--text-muted)] font-medium">
        Every contribution brings this vision closer to reality
      </p>
    </div>

    {error && (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
        Investment Amount
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.001"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input_field text-3xl font-bold py-6 px-8 pr-20"
          placeholder="0.00"
          autoFocus
        />
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-[var(--text-muted)] tracking-widest text-xs">
          CELO
        </span>
      </div>
    </div>

    {/* Quick Amount Presets */}
    <div className="grid grid-cols-4 gap-3">
      {[10, 50, 100, 500].map((preset) => (
        <button
          key={preset}
          onClick={() => setAmount(preset.toString())}
          className="py-3 px-4 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded-xl text-sm font-bold hover:border-[var(--primary)] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
        >
          {preset} CELO
        </button>
      ))}
    </div>

    {/* Fee Breakdown */}
    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 space-y-3 border border-gray-100 dark:border-[#262626]">
      <div className="flex justify-between text-sm font-bold text-[var(--text-muted)]">
        <span>Your Contribution</span>
        <span className="text-[var(--text-main)]">{Number(amount || 0).toFixed(4)} CELO</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-[var(--text-muted)]">
        <span>Platform Fee (2.5%)</span>
        <span className="text-[var(--text-main)]">{platformFee.toFixed(4)} CELO</span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-[#262626]">
        <span className="text-base font-bold">Total Payable</span>
        <span className="text-2xl font-bold text-[var(--primary)]">
          {totalAmount.toFixed(4)} CELO
        </span>
      </div>
    </div>

    <button
      onClick={onNext}
      disabled={!amount || Number(amount) <= 0}
      className="button_primary w-full flex items-center justify-center gap-3 py-5 shadow-xl shadow-blue-500/10"
    >
      <span className="font-bold">Continue</span>
      <ArrowRight className="w-5 h-5" />
    </button>
  </motion.div>
);

const StepTerms = ({ acceptedTerms, setAcceptedTerms, error, onNext, onBack, project }: any) => (
  <motion.div
    key="terms"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto">
        <FileText className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-main)]">Investment Terms</h3>
      <p className="text-[var(--text-muted)] font-medium">
        Please review the terms before proceeding
      </p>
    </div>

    {error && (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 space-y-4 border border-gray-100 dark:border-[#262626] max-h-64 overflow-y-auto">
      <h4 className="font-bold text-[var(--text-main)]">Key Terms:</h4>
      <ul className="space-y-3 text-sm text-[var(--text-muted)]">
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span><strong>Escrow Protection:</strong> Funds are held in a secure smart contract escrow until project milestones are verified.</span>
        </li>
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span><strong>Milestone-Based Release:</strong> Creator receives funds incrementally as they prove completion of each milestone.</span>
        </li>
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span><strong>Investment NFT:</strong> You'll receive an ERC-1155 NFT representing your ownership stake in this project.</span>
        </li>
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span><strong>Risk Disclosure:</strong> {project.projectType === 'ROI' ? 'This is a high-risk ROI investment. Returns are not guaranteed.' : 'This is a charitable contribution with no expectation of financial return.'}</span>
        </li>
        <li className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span><strong>Dispute Resolution:</strong> In case of disputes, a decentralized arbitration process will be initiated.</span>
        </li>
      </ul>
    </div>

    <label className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl cursor-pointer">
      <input
        type="checkbox"
        checked={acceptedTerms}
        onChange={(e) => setAcceptedTerms(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
      />
      <span className="text-sm font-bold text-[var(--text-main)]">
        I have read and agree to the investment terms, understand the risks involved, and confirm this investment aligns with my financial goals.
      </span>
    </label>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="button_secondary flex-1 flex items-center justify-center gap-3 py-5"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Back</span>
      </button>
      <button
        onClick={onNext}
        disabled={!acceptedTerms}
        className="button_primary flex-1 flex items-center justify-center gap-3 py-5 shadow-xl shadow-blue-500/10"
      >
        <span className="font-bold">Accept & Continue</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  </motion.div>
);

const StepWallet = ({ isConnected, address, error, onNext, onBack }: any) => (
  <motion.div
    key="wallet"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-main)]">Connect Wallet</h3>
      <p className="text-[var(--text-muted)] font-medium">
        {isConnected ? 'Wallet connected successfully!' : 'Connect your wallet to proceed with the transaction'}
      </p>
    </div>

    {error && (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    {isConnected ? (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <span className="font-bold text-green-700 dark:text-green-400">Wallet Connected</span>
        </div>
        <div className="text-sm font-mono text-[var(--text-muted)] break-all">
          {address}
        </div>
      </div>
    ) : (
      <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded-2xl p-8 text-center space-y-4">
        <Wallet className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
        <p className="text-sm text-[var(--text-muted)] font-medium">
          Please use the wallet connector in the top navigation to connect your wallet
        </p>
      </div>
    )}

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="button_secondary flex-1 flex items-center justify-center gap-3 py-5"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Back</span>
      </button>
      <button
        onClick={onNext}
        disabled={!isConnected}
        className="button_primary flex-1 flex items-center justify-center gap-3 py-5 shadow-xl shadow-blue-500/10"
      >
        <span className="font-bold">Sign Transaction</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  </motion.div>
);

const StepSigning = ({ isContractLoading, isWaitingForTx, error, amount }: any) => (
  <motion.div
    key="signing"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
        {isWaitingForTx ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Wallet className="w-8 h-8 text-white" />
        )}
      </div>
      <h3 className="text-2xl font-bold text-[var(--text-main)]">
        {isWaitingForTx ? 'Confirming Transaction' : 'Authorize Transaction'}
      </h3>
      <p className="text-[var(--text-muted)] font-medium">
        {isWaitingForTx 
          ? 'Waiting for blockchain confirmation...' 
          : 'Please approve the transaction in your wallet'}
      </p>
    </div>

    {error && (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="line-clamp-3">{error}</span>
      </div>
    )}

    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-8 space-y-4">
      <div className="flex items-center justify-center">
        {isWaitingForTx ? (
          <div className="relative">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full animate-ping absolute"></div>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center relative">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          </div>
        ) : (
          <Wallet className="w-16 h-16 text-[var(--primary)]" />
        )}
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-bold text-[var(--text-main)]">
          Investing {amount} CELO
        </p>
        <p className="text-xs text-[var(--text-muted)] font-medium">
          {isWaitingForTx 
            ? 'This may take a few moments. Do not close this window.' 
            : 'Check your wallet for the transaction approval prompt'}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
      <Shield className="w-4 h-4" />
      <span>Secured by Smart Contract Escrow</span>
    </div>
  </motion.div>
);

const StepSuccess = ({ project, amount, txHash, onClose }: any) => {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    setTimeout(() => setConfetti(false), 3000);
  }, []);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-6 text-center relative"
    >
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 1 }}
              animate={{ y: 500, opacity: 0 }}
              transition={{ duration: 2, delay: Math.random() * 0.5 }}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full"
              style={{ left: '50%' }}
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-[var(--text-main)]">Investment Successful! 🎉</h3>
          <p className="text-[var(--text-muted)] font-medium max-w-md mx-auto">
            Your {amount} CELO contribution is now securely held in escrow and will be released upon milestone verification.
          </p>
        </div>
      </div>

      {/* NFT Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-sm">Investment NFT Minted</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-medium">
          An ERC-1155 NFT representing your ownership stake has been minted to your wallet
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 space-y-3 border border-gray-100 dark:border-[#262626]">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)] font-bold">Project</span>
          <span className="text-[var(--text-main)] font-bold truncate max-w-xs">{project.name || project.title}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)] font-bold">Amount</span>
          <span className="text-[var(--text-main)] font-bold">{amount} CELO</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)] font-bold">Transaction</span>
          <a 
            href={`https://alfajores.celoscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-bold hover:underline truncate max-w-xs"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="button_secondary flex items-center justify-center gap-2 py-4">
          <Share2 className="w-4 h-4" />
          <span className="font-bold text-sm">Share</span>
        </button>
        <button className="button_secondary flex items-center justify-center gap-2 py-4">
          <Download className="w-4 h-4" />
          <span className="font-bold text-sm">Receipt</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="button_primary w-full py-5 shadow-xl shadow-green-500/10"
      >
        <span className="font-bold">View My Investments</span>
      </button>
    </motion.div>
  );
};

export default MultiStepInvestModal;
