"use client";
import { useEffect, useRef, useState } from "react";

import {
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits, isAddress, type Address } from "viem";
import {
  createPaymentIntent,
  submitOnchainContribution,
} from "@/lib/financial-service";
import { userService } from "@/lib/user-service";
import { hasLinkedWallet } from "@/hooks/useWalletSync";
import { financialErrorMessage } from "@/lib/api-client";

const escrow = process.env.NEXT_PUBLIC_KEIBO_ESCROW_ADDRESS as
  Address | undefined;
const escrowAbi = [
  {
    type: "function",
    name: "campaigns",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "asset", type: "address" },
      { name: "cap", type: "uint128" },
      { name: "raised", type: "uint128" },
      { name: "deadline", type: "uint64" },
      { name: "state", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "contribute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "amount", type: "uint128" },
    ],
    outputs: [],
  },
] as const;

export function OnchainContributionButton({
  projectId,
  projectName,
  projectOnchainId,
  investorWallet,
  amountMinor,
  onError,
  onSettled,
  agreements = [],
}: {
  agreements?: {
    title: string;
    description?: string;
    requiresAcceptance?: boolean;
    templateId?: string;
    templateVersion?: number;
  }[];
  projectId: string;
  projectName: string;
  projectOnchainId?: string;
  investorWallet?: string;
  amountMinor: string;
  onError: (message: string) => void;
  onSettled: () => void;
}) {
  const [accepted, setAccepted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const keyFor = (agreement: (typeof agreements)[number], index: number) =>
    agreement.templateId
      ? `${agreement.templateId}:${agreement.templateVersion || 1}`
      : `campaign:${index}:${agreement.title}`;
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: 11155111 });
  const { writeContractAsync } = useWriteContract();
  const [review, setReview] = useState<{
    key: string;
    asset: Address;
    allowance: bigint;
    approved: boolean;
  } | null>(null);
  const [settlement, setSettlement] = useState<{
    intentId: string;
    key: string;
    hash: `0x${string}`;
  } | null>(null);
  const [settled, setSettled] = useState(false);
  const reviewKey = JSON.stringify([
    projectId,
    projectOnchainId,
    investorWallet,
    amountMinor,
    agreements,
    accepted,
  ]);
  const latestKey = useRef(reviewKey);
  latestKey.current = reviewKey;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const assertUnchanged = () => {
    if (!mounted.current || latestKey.current !== reviewKey)
      throw new Error(
        "Investment details changed. Review the current details before continuing.",
      );
  };
  const current = review?.key === reviewKey ? review : null;
  const amount = /^\d+$/.test(amountMinor) ? BigInt(amountMinor) : BigInt(0);
  const amountDisplay = formatUnits(amount, 6);
  const missingAgreements = agreements.some(
    (agreement, i) =>
      agreement.requiresAcceptance !== false &&
      !accepted.includes(keyFor(agreement, i)),
  );
  const contribute = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    onError("");
    try {
      if (missingAgreements)
        throw new Error("Accept the required investment agreements first");
      if (
        !escrow ||
        !isAddress(escrow) ||
        projectOnchainId === undefined ||
        !/^\d+$/.test(projectOnchainId) ||
        !investorWallet ||
        !isAddress(investorWallet) ||
        !publicClient
      )
        throw new Error(
          "Sepolia contribution is unavailable until this campaign, wallet and escrow are configured.",
        );
      if (amount <= BigInt(0))
        throw new Error("Enter a positive USDC investment amount");
      const account = await userService.getMe();
      if (!hasLinkedWallet(account?.user || account, investorWallet))
        throw new Error(
          "Link the connected wallet to your KEIBO account before contributing",
        );
      if (settlement) {
        if (settlement.key !== reviewKey)
          throw new Error(
            "Restore the submitted investment details to verify settlement. Do not contribute again.",
          );
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: settlement.hash,
        });
        if (receipt.status !== "success")
          throw new Error("Contribution reverted");
        await submitOnchainContribution({
          paymentIntentId: settlement.intentId,
          projectOnchainId,
          investorWallet,
          transactionHash: settlement.hash,
        });
        setSettled(true);
        onSettled();
        return;
      }
      const campaign = await publicClient.readContract({
        address: escrow,
        abi: escrowAbi,
        functionName: "campaigns",
        args: [BigInt(projectOnchainId)],
      });
      if (campaign[5] !== 0 || amount > campaign[2] - campaign[3])
        throw new Error(
          "Campaign is not funding or the amount exceeds remaining capacity",
        );
      const asset = campaign[1];
      // Confirm the campaign asset rather than assuming every ERC20 has six decimals.
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: asset,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: asset,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);
      if (symbol !== "USDC" || decimals !== 6)
        throw new Error("Campaign asset must be six-decimal USDC");
      const readAllowance = () =>
        publicClient.readContract({
          address: asset,
          abi: erc20Abi,
          functionName: "allowance",
          args: [investorWallet as Address, escrow],
        });
      const allowance = await readAllowance();
      assertUnchanged();
      if (!current || current.asset.toLowerCase() !== asset.toLowerCase()) {
        setReview({ key: reviewKey, asset, allowance, approved: false });
        return; // Review is read-only. A fresh click is always required for a wallet request.
      }
      if (current.allowance >= amount !== allowance >= amount) {
        setReview({ ...current, allowance });
        return; // Never substitute approval for a reviewed contribution (or vice versa).
      }
      if (chainId !== 11155111) {
        await switchChainAsync({ chainId: 11155111 });
        return; // Return to review after switching networks.
      }
      const intent = await createPaymentIntent({
        projectId,
        acceptedAgreements: accepted,
        amountMinor,
        currency: "USDC",
        idempotencyKey: crypto.randomUUID(),
      });
      assertUnchanged();
      if (allowance < amount) {
        const approval = await writeContractAsync({
          account: investorWallet as Address,
          chainId: 11155111,
          address: asset,
          abi: erc20Abi,
          functionName: "approve",
          args: [escrow, amount],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: approval,
        });
        if (receipt.status !== "success")
          throw new Error("USDC approval reverted");
        const updated = await readAllowance();
        setReview({
          key: reviewKey,
          asset,
          allowance: updated,
          approved: updated >= amount,
        });
        if (updated < amount)
          throw new Error(
            "Approval mined but allowance is still insufficient. Contribution is blocked.",
          );
        return; // Approval never sends contribution. Require another explicit user click.
      }
      const hash = await writeContractAsync({
        account: investorWallet as Address,
        chainId: 11155111,
        address: escrow,
        abi: escrowAbi,
        functionName: "contribute",
        args: [BigInt(projectOnchainId), amount],
      });
      setSettlement({ intentId: intent.id, key: reviewKey, hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success")
        throw new Error("Contribution reverted");
      await submitOnchainContribution({
        paymentIntentId: intent.id,
        projectOnchainId,
        investorWallet,
        transactionHash: hash,
      });
      setSettled(true);
      onSettled();
    } catch (caught) {
      onError(
        caught instanceof Error && !("response" in caught)
          ? caught.message
          : financialErrorMessage(
              caught,
              "Contribution was not settled. The transaction may still require backend verification.",
            ),
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3">
      {!agreements.length && <p>No campaign agreements require acceptance.</p>}
      <div
        className="rounded-xl border p-3 text-sm space-y-2 break-all"
        aria-label="Transaction review"
      >
        <h3 className="font-bold">
          {current && current.allowance < amount ? "Approval" : "Contribution"}{" "}
          review
        </h3>
        <p>Network: Ethereum Sepolia</p>
        <p>Campaign: {projectName}</p>
        <p>Campaign ID: {projectOnchainId ?? "Unavailable"}</p>
        <p>Investment: {amountDisplay} USDC</p>
        <p>Investor fee: 0 USDC</p>
        <p>Total debit: {amountDisplay} USDC</p>
        <p>Network gas is paid separately in Sepolia ETH.</p>
        <p>
          Token: USDC
          {current ? ` (${current.asset})` : " (verify asset with Review)"}
        </p>
        <p>Spender / KEIBO escrow: {escrow || "Unavailable"}</p>
        <p>Wallet: {investorWallet || "Connect a wallet"}</p>
        <p>Native ETH value: 0 (except gas)</p>
        {current && (
          <>
            <p>Current allowance: {formatUnits(current.allowance, 6)} USDC</p>
            {current.allowance < amount ? (
              <p>
                Approval amount: {amountDisplay} USDC. A separate click will be
                required to contribute after approval.
              </p>
            ) : (
              <p>
                {current.approved
                  ? "Approval confirmed"
                  : "Approval skipped: current allowance covers this investment"}
                . Click Contribute to open the contribution wallet request.
              </p>
            )}
          </>
        )}
      </div>
      {agreements.map((agreement, index) => (
        <label key={keyFor(agreement, index)} className="block text-sm">
          <input
            type="checkbox"
            checked={accepted.includes(keyFor(agreement, index))}
            onChange={(event) =>
              setAccepted((previous) =>
                event.target.checked
                  ? [...previous, keyFor(agreement, index)]
                  : previous.filter((key) => key !== keyFor(agreement, index)),
              )
            }
          />{" "}
          {agreement.title}
          {agreement.requiresAcceptance !== false ? " (required)" : ""}
          <span className="block">{agreement.description}</span>
        </label>
      ))}
      <button
        type="button"
        disabled={
          settled ||
          busy ||
          missingAgreements ||
          amount <= BigInt(0) ||
          !investorWallet
        }
        onClick={() => void contribute()}
        className="w-full rounded-xl border border-[var(--primary)] py-3 font-bold text-[var(--primary)]"
      >
        {settled
          ? "Contribution settled"
          : busy
            ? "Checking / awaiting confirmation…"
            : settlement
              ? "Retry settlement verification"
              : !current
                ? "Review investment"
                : current.allowance < amount
                  ? `Approve ${amountDisplay} USDC`
                  : `Contribute ${amountDisplay} USDC`}
      </button>
    </section>
  );
}
