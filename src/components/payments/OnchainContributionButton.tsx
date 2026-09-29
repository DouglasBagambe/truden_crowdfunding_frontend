"use client";

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
}: {
  projectId: string;
  projectOnchainId?: string;
  investorWallet?: string;
  amountMinor: string;
  onError: (message: string) => void;
  onSettled: () => void;
}) {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const contribute = async () => {
    try {
      if (!escrow || !projectOnchainId || !investorWallet || !publicClient)
        throw new Error(
          "Sepolia contribution is unavailable until this campaign and escrow are configured.",
        );
      if (chainId !== 11155111) await switchChainAsync({ chainId: 11155111 });
      const intent = await createPaymentIntent({
        projectId,
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
        address: asset,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrow, BigInt(amountMinor)],
      });
      await publicClient.waitForTransactionReceipt({ hash: approval });
      const hash = await writeContractAsync({
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
    }
  };
  return (
    <button
      type="button"
      onClick={() => void contribute()}
      className="w-full rounded-xl border border-[var(--primary)] py-3 font-bold text-[var(--primary)]"
    >
      Contribute USDC on Sepolia
    </button>
  );
}
