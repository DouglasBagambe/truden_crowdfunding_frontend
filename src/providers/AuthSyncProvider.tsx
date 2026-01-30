'use client';

import { useWalletSync } from '@/hooks/useWalletSync';
import { ReactNode } from 'react';

export function AuthSyncProvider({ children }: { children: ReactNode }) {
  useWalletSync();
  return <>{children}</>;
}
