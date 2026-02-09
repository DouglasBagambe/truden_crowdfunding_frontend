'use client';

/**
 * Global component to enable blockchain event monitoring
 * 
 * ⚠️ CURRENTLY DISABLED ⚠️
 * RPC connection testing and event monitoring are completely disabled
 * to prevent console error spam from unreachable blockchain endpoints.
 * 
 * TO RE-ENABLE:
 * 1. Ensure your RPC endpoint is working (check .env.local)
 * 2. Uncomment the import statements
 * 3. Uncomment the useEffect and hook calls below
 */
export function BlockchainEventMonitor() {
  // Imports disabled to prevent any RPC calls
  // import { useEffect, useState } from 'react';
  // import { useAccount, usePublicClient } from 'wagmi';
  // import { useProjectStatusSync } from '@/hooks/useProjectStatusSync';
  // import { useInvestmentEventsWatch } from '@/hooks/useInvestmentEventsWatch';

  /* DISABLED - Uncomment to re-enable
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!isConnected || !publicClient) {
      setIsEnabled(false);
      return;
    }

    const testConnection = async () => {
      try {
        await publicClient.getBlockNumber();
        console.log('[BlockchainEventMonitor] RPC connected successfully');
        setIsEnabled(true);
      } catch (error) {
        console.warn('[BlockchainEventMonitor] RPC connection failed:', error);
        setIsEnabled(false);
      }
    };

    testConnection();
  }, [isConnected, publicClient]);

  if (isEnabled) {
    useProjectStatusSync({ enableToasts: true });
    useInvestmentEventsWatch(address);
  }
  */

  return null;
}
