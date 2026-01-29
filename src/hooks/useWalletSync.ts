import { useAccount } from 'wagmi';
import { useAuth } from './useAuth';
import { userService } from '../lib/user-service';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast'; // Assuming we might add this later

export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const syncWallet = async () => {
      if (!isAuthenticated || !isConnected || !address || !user) return;

      const normalizedAddress = address.toLowerCase();
      const currentPrimary = user.primaryWallet?.toLowerCase();
      const linkedWallets = user.linkedWallets?.map((w: string) => w.toLowerCase()) || [];

      // If the currently connected wallet is not the primary AND not in linked wallets
      if (normalizedAddress !== currentPrimary && !linkedWallets.includes(normalizedAddress)) {
        console.log('Detected unlinked wallet:', address);
        
        // We could auto-link or show a modal. For Week 1, let's try to link it automatically 
        // if user is authenticated and connects a new wallet.
        try {
          setIsLinking(true);
          await userService.linkWallet(normalizedAddress);
          await refetchUser();
          toast.success(`Wallet ${address.slice(0, 6)}... linked to profile`);
        } catch (err: any) {
          toast.error('Failed to link wallet');
        } finally {
          setIsLinking(false);
        }
      }
    };

    syncWallet();
  }, [address, isConnected, isAuthenticated, user, refetchUser]);

  return { isLinking };
}
