'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

/**
 * Global component to enable blockchain event monitoring
 * Temporarily disabled to prevent RPC connection errors
 * Will be re-enabled once RPC configuration is fixed
 */
export function BlockchainEventMonitor() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isEnabled, setIsEnabled] = useState(false);

  // Only enable monitoring when:
  // 1. User is connected
  // 2. Public client is available
  // 3. We've verified the RPC is reachable
  useEffect(() => {
    if (!isConnected || !publicClient) {
      setIsEnabled(false);
      return;
    }

    // Test RPC connection before enabling monitoring
    const testConnection = async () => {
      try {
        await publicClient.getBlockNumber();
        setIsEnabled(true);
      } catch (error) {
        console.warn('[BlockchainEventMonitor] RPC connection failed. Event monitoring disabled.');
        setIsEnabled(false);
      }
    };

    testConnection();
  }, [isConnected, publicClient]);

  // Monitoring is temporarily disabled to prevent errors
  // Uncomment below when RPC is properly configured
  /*
  if (isEnabled) {
    useProjectStatusSync({
      enableToasts: true,
    });
    useInvestmentEventsWatch(address);
  }
  */

  return null;
}
