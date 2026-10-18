"use client";
import { useAccount, useSignMessage, useChainId } from "wagmi";
import { useAuth } from "./useAuth";
import { userService } from "../lib/user-service";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";

export type WalletLinkState =
  "DISCONNECTED" | "CONNECTED_NOT_LINKED" | "LINKING" | "LINKED" | "ERROR";
export function hasLinkedWallet(
  user: { primaryWallet?: string; linkedWallets?: string[] } | null,
  address?: string,
) {
  return (
    !!address &&
    [user?.primaryWallet, ...(user?.linkedWallets || [])].some(
      (wallet) => wallet?.toLowerCase() === address.toLowerCase(),
    )
  );
}
export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const [isLinking, setIsLinking] = useState(false);
  const [failedIdentity, setFailedIdentity] = useState("");
  const inFlight = useRef(false);
  const identity = `${user?.id || user?._id || ""}:${address?.toLowerCase() || ""}`;
  const latestIdentity = useRef(identity);
  latestIdentity.current = identity;
  const linked = hasLinkedWallet(user, address);
  // Deliberately no linking effect. Only an explicit user action may prompt a signature.
  const linkWallet = async () => {
    if (
      inFlight.current ||
      linked ||
      !isAuthenticated ||
      !isConnected ||
      !address
    )
      return;
    inFlight.current = true;
    setIsLinking(true);
    setFailedIdentity("");
    const startedIdentity = identity;
    try {
      const wallet = getAddress(address);
      const challenge = await userService.getSiweChallenge(wallet);
      if (!challenge.chainIds.includes(chainId))
        throw new Error("Switch to a supported wallet network before linking");
      const message = new SiweMessage({
        domain: challenge.domain,
        address: wallet,
        statement: "Link this wallet to your Keibo account",
        uri: challenge.uri,
        version: "1",
        chainId,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        expirationTime: challenge.expiresAt,
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      if (latestIdentity.current !== startedIdentity)
        throw new Error(
          "Account or wallet changed. Retry linking the current wallet.",
        );
      await userService.linkWallet({ wallet, message, signature });
      const refreshed = await refetchUser();
      const persisted = refreshed.data?.user || refreshed.data;
      if (refreshed.error || !hasLinkedWallet(persisted, wallet))
        throw new Error(
          "Wallet persistence could not be confirmed. Refresh your account before retrying.",
        );
      toast.success(
        "Wallet ownership verified and linked to your KEIBO account",
      );
    } catch (error: unknown) {
      setFailedIdentity(startedIdentity);
      const response = (
        error as { response?: { data?: { message?: string | string[] } } }
      ).response;
      const message = response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(". ")
          : message ||
              (error instanceof Error &&
              error.message.includes("supported wallet")
                ? error.message
                : "Wallet linking cancelled or failed. Use Link Wallet to retry."),
      );
    } finally {
      inFlight.current = false;
      setIsLinking(false);
    }
  };
  const state: WalletLinkState = !isConnected
    ? "DISCONNECTED"
    : linked
      ? "LINKED"
      : isLinking
        ? "LINKING"
        : failedIdentity === identity
          ? "ERROR"
          : "CONNECTED_NOT_LINKED";
  return { state, isLinking, linkWallet };
}
