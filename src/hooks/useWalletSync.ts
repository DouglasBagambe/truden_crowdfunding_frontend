import { useAccount } from 'wagmi';
import { useAuth } from './useAuth';
import { userService } from '../lib/user-service';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast'; // Assuming we might add this later
import { useSignMessage, useChainId } from 'wagmi';
import { SiweMessage } from 'siwe';

export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const attemptedRef = useRef<Set<string>>(new Set());
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
  let domainHost = typeof window !== 'undefined' ? window.location.host : 'localhost';
  let appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  try {
    if (appUrlEnv) {
      const u = new URL(appUrlEnv);
      domainHost = u.host;
      appOrigin = u.origin;
    }
  } catch {}

  useEffect(() => {
    const syncWallet = async () => {
      if (!isAuthenticated || !isConnected || !address || !user || isLinking) return;

      const normalizedAddress = address.toLowerCase();
      const currentPrimary = user.primaryWallet?.toLowerCase();
      const linkedWallets = user.linkedWallets?.map((w: string) => w.toLowerCase()) || [];

      const wasAttempted = attemptedRef.current.has(normalizedAddress);
      // If the currently connected wallet is not the primary AND not in linked wallets
      if (!wasAttempted && normalizedAddress !== currentPrimary && !linkedWallets.includes(normalizedAddress)) {
        console.log('Detected unlinked wallet:', address);
        try {
          setIsLinking(true);
          const tId = toast.loading('Linking wallet...');

          const nonce = await userService.getSiweNonce(address);
          const siweMessage = new SiweMessage({
            domain: domainHost,
            address,
            statement: 'Link this wallet to your TruFund account',
            uri: appOrigin,
            version: '1',
            chainId: chainId || 1,
            nonce,
          });

          const message = siweMessage.prepareMessage();
          const signature = await signMessageAsync({ message });

          await userService.linkWallet({ wallet: address, message, signature });
          await refetchUser();
          toast.success(`Wallet ${address.slice(0, 6)}... linked to profile`, { id: tId });
        } catch (err: any) {
          console.error('[WALLET_LINK_ERROR]', {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
          });
          attemptedRef.current.add(normalizedAddress);
          try { setTimeout(() => attemptedRef.current.delete(normalizedAddress), 30000); } catch {}
          const msg = err?.response?.data?.message || 'Failed to link wallet';
          toast.error(msg, { id: tId });
        } finally {
          setIsLinking(false);
        }
      }
    };

    syncWallet();
  }, [address, isConnected, isAuthenticated, user, refetchUser, signMessageAsync, chainId, isLinking]);

  return { isLinking };
}
