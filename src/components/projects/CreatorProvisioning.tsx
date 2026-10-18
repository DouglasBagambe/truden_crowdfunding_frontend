"use client";
import { useRef, useState } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import { apiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import type { Address, Hex } from "viem";
export function CreatorProvisioning({ projectId }: { projectId: string }) {
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [busy, setBusy] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState("");
  const inFlight = useRef(false);
  const run = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    const key = `keibo:campaign:${projectId}`;
    try {
      let hash = recoveryHash.trim() || localStorage.getItem(key);
      if (hash && !/^0x[0-9a-fA-F]{64}$/.test(hash))
        throw new Error("Enter a valid creator transaction hash");
      if (!hash) {
        const { data } = await apiClient.post<{
          to: Address;
          account: Address;
          data: Hex;
          chainId: number;
          transactionHash?: string;
          nonce: number;
          requiresTransactionHash: boolean;
        }>(`/projects/${projectId}/provisioning/prepare`);
        if (!address || address.toLowerCase() !== data.account.toLowerCase())
          throw new Error("Connect the verified primary creator wallet first");
        if (chainId !== data.chainId)
          throw new Error("Switch the creator wallet to Ethereum Sepolia");
        if (!data.transactionHash && data.requiresTransactionHash)
          throw new Error(
            "This creator nonce is already mined. Recover the transaction hash from your wallet and confirm it below; do not create another campaign.",
          );
        hash =
          data.transactionHash ||
          (await sendTransactionAsync({
            to: data.to,
            data: data.data,
            chainId: data.chainId,
            value: BigInt(0),
            nonce: data.nonce,
          }));
        localStorage.setItem(key, hash);
      }
      await apiClient.post(
        `/projects/${projectId}/provisioning/confirm`,
        { transactionHash: hash },
        { timeout: 90_000 },
      );
      toast.success("Campaign confirmed on chain and open for funding");
      window.location.reload();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      if (
        message?.includes("transaction reverted") &&
        message.includes("consumed creator nonce was released")
      ) {
        localStorage.removeItem(key);
        setRecoveryHash("");
      }
      toast.error(
        message ||
          (error instanceof Error
            ? error.message
            : "Campaign confirmation failed. Retry the saved transaction."),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const retryReverted = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const transactionHash =
        recoveryHash.trim() ||
        localStorage.getItem(`keibo:campaign:${projectId}`);
      if (!transactionHash || !/^0x[0-9a-fA-F]{64}$/.test(transactionHash))
        throw new Error("Enter the reverted creator transaction hash first");
      await apiClient.post(
        `/projects/${projectId}/provisioning/retry-reverted`,
        { transactionHash },
        { timeout: 90_000 },
      );
      localStorage.removeItem(`keibo:campaign:${projectId}`);
      setRecoveryHash("");
      toast.success(
        "Reverted transaction confirmed. You may now prepare a new creator transaction.",
      );
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ||
          (error instanceof Error
            ? error.message
            : "Unable to reset the signing plan"),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border p-5 space-y-3">
      <h3 className="font-bold">Creator escrow setup required</h3>
      <p>
        The verified creator must sign campaign creation. Funding opens only
        after the backend confirms the mined transaction. Retry reuses a saved
        transaction rather than creating another campaign.
      </p>
      <button type="button" disabled={busy} onClick={() => void run()}>
        {busy ? "Confirming campaign…" : "Create or confirm escrow campaign"}
      </button>
      <button
        type="button"
        disabled={busy}
        className="block underline text-sm"
        onClick={() => void retryReverted()}
      >
        Retry a mined reverted creator transaction
      </button>
    </section>
  );
}
