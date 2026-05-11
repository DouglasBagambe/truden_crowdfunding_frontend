'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { paymentService } from '@/lib/payment-service';

type VerifyState = 'verifying' | 'paid' | 'failed' | 'cancelled' | 'pending';

interface VerifyCardConfig {
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: string;
  border: string;
}

function getSafeExitHref(projectId: string): string {
  return projectId ? `/projects/${projectId}` : '/';
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get('status');
  const token =
    searchParams.get('ID') ||
    searchParams.get('TransactionToken') ||
    searchParams.get('token');
  const projectId = searchParams.get('projectId') || '';

  const [verifyState, setVerifyState] = useState<VerifyState>(() => {
    if (statusParam === 'cancelled' && !token) {
      return 'cancelled';
    }
    if (!token) {
      return statusParam === 'success' ? 'paid' : 'cancelled';
    }
    return 'verifying';
  });
  const [message, setMessage] = useState('');
  const [redirectError, setRedirectError] = useState('');
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);
  const maxPolls = 30;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const verify = async (currentToken: string) => {
    try {
      const response = await paymentService.verifyDPOPayment(currentToken);
      if (response.verify?.status === '000') {
        stopPolling();
        setVerifyState('paid');
        setMessage(response.verify.message || 'Your payment was confirmed successfully.');
        return;
      }
      if (response.status === 'successful') {
        stopPolling();
        setVerifyState('paid');
        setMessage('Your payment was confirmed successfully.');
        return;
      }
      if (response.status === 'cancelled') {
        stopPolling();
        setVerifyState('cancelled');
        setMessage(response.verify.message || 'This payment was cancelled before confirmation.');
        return;
      }
      if (response.status === 'failed') {
        stopPolling();
        setVerifyState('failed');
        setMessage(response.verify.message || 'Payment could not be verified.');
        return;
      }

      setVerifyState('pending');
      setMessage(
        response.verify.message ||
          'Your payment is still processing. Do not pay again; refresh this page in a moment.',
      );
    } catch (error: unknown) {
      setVerifyState('pending');
      setMessage(
        'We could not confirm the payment yet. Do not pay again; use refresh in a moment.',
      );
    } finally {
      setIsManualRefresh(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void verify(token);
    pollRef.current = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current >= maxPolls) {
        stopPolling();
        setVerifyState((current) => (current === 'paid' ? 'paid' : 'pending'));
        setMessage(
          `Payment is still processing. Do not pay again. Keep this reference for support: ${token}`,
        );
        return;
      }
      void verify(token);
    }, 6000);

    return () => stopPolling();
  }, [token]);

  useEffect(() => {
    if (verifyState !== 'paid') return;

    setRedirectError('');
    const destination = projectId ? `/projects/${projectId}` : '/dashboard';
    const timer = window.setTimeout(() => {
      try {
        router.push(destination);
      } catch {
        setRedirectError('Automatic redirect failed. Use the button below to continue.');
      }
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [projectId, router, verifyState]);

  const config: Record<VerifyState, VerifyCardConfig> = {
    verifying: {
      icon: <Loader2 size={64} className="animate-spin text-blue-400" />,
      title: 'Verifying Payment…',
      subtitle: 'Please wait while we confirm your payment with DPO.',
      color: 'from-blue-600/20 to-indigo-600/20',
      border: 'border-blue-500/30',
    },
    pending: {
      icon: <Clock size={64} className="animate-pulse text-amber-400" />,
      title: 'Processing Payment…',
      subtitle:
        message ||
        'Your payment is still processing. Do not pay again while the transaction is settling.',
      color: 'from-amber-600/20 to-yellow-600/20',
      border: 'border-amber-500/30',
    },
    paid: {
      icon: <CheckCircle2 size={64} className="text-emerald-400" />,
      title: 'Payment Successful',
      subtitle:
        message ? `${message} Redirecting...` :
        'Payment successful! Redirecting...',
      color: 'from-emerald-600/20 to-teal-600/20',
      border: 'border-emerald-500/30',
    },
    failed: {
      icon: <XCircle size={64} className="text-red-400" />,
      title: 'Payment Failed',
      subtitle: message || 'Something went wrong while verifying your payment.',
      color: 'from-red-600/20 to-rose-600/20',
      border: 'border-red-500/30',
    },
    cancelled: {
      icon: <XCircle size={64} className="text-orange-400" />,
      title: 'Payment Cancelled',
      subtitle: message || 'This payment was cancelled before completion.',
      color: 'from-orange-600/20 to-amber-600/20',
      border: 'border-orange-500/30',
    },
  };

  const currentConfig = config[verifyState];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative w-full max-w-md rounded-3xl border ${currentConfig.border} bg-gradient-to-br ${currentConfig.color} p-10 text-center shadow-2xl backdrop-blur-xl`}
      >
        <motion.div
          key={verifyState}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          {currentConfig.icon}
        </motion.div>

        <h1 className="mb-3 text-3xl font-black tracking-tight text-white">
          {currentConfig.title}
        </h1>
        <p className="mb-8 font-medium leading-relaxed text-gray-400">
          {currentConfig.subtitle}
        </p>
        {redirectError && (
          <p className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {redirectError}
          </p>
        )}

        {token && verifyState !== 'paid' && (
          <p className="mb-6 break-all font-mono text-xs text-gray-600">Ref: {token}</p>
        )}

        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-gray-500">Secured by</span>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
            DPO Pay
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {verifyState === 'pending' && token && (
            <button
              type="button"
              onClick={() => {
                setIsManualRefresh(true);
                void verify(token);
              }}
              disabled={isManualRefresh}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 px-6 font-bold text-black transition-all hover:bg-gray-100 disabled:opacity-60"
            >
              {isManualRefresh ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Refresh Status
                </>
              )}
            </button>
          )}

          {projectId && verifyState === 'paid' && (
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 px-6 font-bold text-black transition-all hover:bg-gray-100"
            >
              Continue to Project <ArrowRight size={18} />
            </Link>
          )}

          {(verifyState === 'failed' || verifyState === 'cancelled') && projectId && (
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 px-6 font-bold text-black transition-all hover:bg-gray-100"
            >
              Try Again <ArrowRight size={18} />
            </Link>
          )}

          {verifyState !== 'verifying' && (
            <Link
              href={getSafeExitHref(projectId)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3.5 px-6 font-bold text-white transition-all hover:bg-white/20"
            >
              <Home size={18} />
              {projectId ? 'Back to Project' : 'Back Home'}
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
          <Loader2 size={48} className="animate-spin text-white" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
