"use client";
import { useRef, useState } from "react";

import {
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { erc20Abi, type Address } from "viem";
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
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const contribute = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      if (
        agreements.some(
          (agreement, i) =>
            agreement.requiresAcceptance !== false &&
            !accepted.includes(keyFor(agreement, i)),
        )
      )
        throw new Error("Accept the required investment agreements first");
      if (!escrow || !projectOnchainId || !investorWallet || !publicClient)
        throw new Error(
          "Sepolia contribution is unavailable until this campaign and escrow are configured.",
        );
      if (chainId !== 11155111) await switchChainAsync({ chainId: 11155111 });
      const account = await userService.getMe();
      if (!hasLinkedWallet(account?.user || account, investorWallet))
        throw new Error(
          "Link the connected wallet to your KEIBO account before contributing",
        );
      const intent = await createPaymentIntent({
        projectId,
        acceptedAgreements: accepted,
        amountMinor,
        currency: "USDC",
        idempotencyKey: crypto.randomUUID(),
      });
      const campaign = await publicClient.readContract({
        address: escrow,
        abi: escrowAbi,
        functionName: "campaigns",
        args: [BigInt(projectOnchainId)],
      });
      const asset = campaign[1];
      const approval = await writeContractAsync({
        account: investorWallet as Address,
        chainId: 11155111,
        address: asset,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrow, BigInt(amountMinor)],
      });
      await publicClient.waitForTransactionReceipt({ hash: approval });
      const hash = await writeContractAsync({
        account: investorWallet as Address,
        chainId: 11155111,
        address: escrow,
        abi: escrowAbi,
        functionName: "contribute",
        args: [BigInt(projectOnchainId), BigInt(amountMinor)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await submitOnchainContribution({
        paymentIntentId: intent.id,
        projectOnchainId,
        investorWallet,
        transactionHash: hash,
      });
      onSettled();
    } catch (caught) {
      onError(
        financialErrorMessage(
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
        disabled={busy}
        onClick={() => void contribute()}
        className="w-full rounded-xl border border-[var(--primary)] py-3 font-bold text-[var(--primary)]"
      >
        Contribute USDC on Sepolia
      </button>
    </section>
  );
}
