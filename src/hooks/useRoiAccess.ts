'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { canAccessROI } from '@/lib/roi-access';

export function useRoiAccess() {
  const { user, isLoading } = useAuth();

  const hasRoiAccess = useMemo(() => canAccessROI(user), [user]);

  return {
    hasRoiAccess,
    isLoading,
    user,
  };
}
