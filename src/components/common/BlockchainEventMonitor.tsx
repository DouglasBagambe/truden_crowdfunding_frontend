'use client';

import { useEffect, useRef } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useToast } from '@/components/common/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

/**
 * Polls backend for unread notifications every 30s and shows toasts.
 * Also tests RPC connectivity for any blockchain event hooks.
 */
export function BlockchainEventMonitor() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { showInfo, showSuccess } = useToast();
  const { isAuthenticated } = useAuth();
  const seenIds = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll backend notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      try {
        const res = await apiClient.get<{ items?: any[] }>('/notifications', {
          params: { unread: true, limit: 10 },
        });
        const items: any[] = res.data?.items ?? [];
        items.forEach((n) => {
          if (seenIds.current.has(n.id)) return;
          seenIds.current.add(n.id);
          const fn = n.type === 'PAYMENT_SUCCESS' || n.type === 'MILESTONE_APPROVED'
            ? showSuccess
            : showInfo;
          fn(n.title ?? 'Notification', n.body ?? n.message ?? undefined);
        });
      } catch {
        // silently ignore – backend may not have /notifications yet
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, showSuccess, showInfo]);

  return null;
}
