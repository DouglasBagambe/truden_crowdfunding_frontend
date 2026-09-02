import { useAccount } from "wagmi";
import { useAuth } from "./useAuth";
import { userService } from "../lib/user-service";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast"; // Assuming we might add this later
import { useSignMessage, useChainId } from "wagmi";
import { SiweMessage } from "siwe";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return fallback;
}

export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const attemptedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const syncWallet = async () => {
      if (!isAuthenticated || !isConnected || !address || !user || isLinking)
        return;

      const normalizedAddress = address.toLowerCase();
      const currentPrimary = user.primaryWallet?.toLowerCase();
      const linkedWallets =
        user.linkedWallets?.map((w: string) => w.toLowerCase()) || [];

      const wasAttempted = attemptedRef.current.has(normalizedAddress);
      // If the currently connected wallet is not the primary AND not in linked wallets
      if (
        !wasAttempted &&
        normalizedAddress !== currentPrimary &&
        !linkedWallets.includes(normalizedAddress)
      ) {
        let tId: string | undefined;
        try {
          setIsLinking(true);
          tId = toast.loading("Linking wallet...");

          const challenge = await userService.getSiweChallenge(address);
          if (!challenge.chainIds.includes(chainId)) {
            throw new Error(
              "Switch to a supported wallet network before linking",
            );
          }
          const siweMessage = new SiweMessage({
            domain: challenge.domain,
            address,
            statement: "Link this wallet to your Keibo account",
            uri: challenge.uri,
            version: "1",
            chainId,
            nonce: challenge.nonce,
            issuedAt: challenge.issuedAt,
            expirationTime: challenge.expiresAt,
          });

          const message = siweMessage.prepareMessage();
          const signature = await signMessageAsync({ message });

          await userService.linkWallet({ wallet: address, message, signature });
          await refetchUser();
          toast.success(`Wallet ${address.slice(0, 6)}... linked to profile`, {
            id: tId,
          });
        } catch (err: unknown) {
          attemptedRef.current.add(normalizedAddress);
          try {
            setTimeout(
              () => attemptedRef.current.delete(normalizedAddress),
              30000,
            );
          } catch {}
          const msg = getApiErrorMessage(err, "Failed to link wallet");
          toast.error(msg, { id: tId });
        } finally {
          setIsLinking(false);
        }
      }
    };

    syncWallet();
  }, [
    address,
    isConnected,
    isAuthenticated,
    user,
    refetchUser,
    signMessageAsync,
    chainId,
    isLinking,
  ]);

  return { isLinking };
}
