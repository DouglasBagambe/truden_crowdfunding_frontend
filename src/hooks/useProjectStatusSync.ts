"use client";

import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/constants/contracts";
import { useToast } from "@/components/common/ToastProvider";

interface ProjectStatusSyncOptions {
  projectId?: string;
  onStatusChange?: (status: string) => void;
  enableToasts?: boolean;
}

type ContractEventLog = {
  args?: Record<string, unknown>;
};

type ProjectContractData = [
  string,
  string,
  string,
  bigint | number | string,
  bigint | number | string,
  bigint | number | string,
  number,
];

function toDisplayAmount(value: unknown): string {
  if (typeof value === "bigint") return (Number(value) / 1e18).toString();
  if (typeof value === "number") return (value / 1e18).toString();
  if (typeof value === "string" && value !== "") {
    return (Number(value) / 1e18).toString();
  }
  return "?";
}

function eventProjectId(log: ContractEventLog): string | undefined {
  const value = log.args?.projectId;
  return value === undefined || value === null ? undefined : String(value);
}

/**
 * Hook to sync on-chain project status with backend
 * Listens for contract events and updates local state
 */
export const useProjectStatusSync = (
  options: ProjectStatusSyncOptions = {},
) => {
  const { projectId, onStatusChange, enableToasts = true } = options;
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { showSuccess, showInfo, showWarning } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Watch for FundsDeposited events
  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "FundsDeposited",
    onLogs(logs) {
      logs.forEach((log) => {
        handleFundsDeposited(log);
      });
    },
  });

  // Watch for ProjectStatusChanged events
  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "ProjectStatusChanged",
    onLogs(logs) {
      logs.forEach((log) => {
        handleProjectStatusChanged(log);
      });
    },
  });

  // Watch for MilestoneApproved events
  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "MilestoneApproved",
    onLogs(logs) {
      logs.forEach((log) => {
        handleMilestoneApproved(log);
      });
    },
  });

  // Watch for FundsReleased events
  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "FundsReleased",
    onLogs(logs) {
      logs.forEach((log) => {
        handleFundsReleased(log);
      });
    },
  });

  const handleFundsDeposited = useCallback(
    async (log: ContractEventLog) => {
      try {
        const { args } = log;
        const onChainProjectId = eventProjectId(log);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (onChainProjectId) {
          queryClient.invalidateQueries({
            queryKey: ["project", onChainProjectId],
          });
        }

        if (enableToasts) {
          showInfo(
            "New Investment Detected",
            `A new contribution of ${toDisplayAmount(args?.amount)} CELO was made to this project`,
          );
        }
      } catch {}
    },
    [queryClient, enableToasts, showInfo],
  );

  const handleProjectStatusChanged = useCallback(
    async (log: ContractEventLog) => {
      try {
        const { args } = log;
        const onChainProjectId = eventProjectId(log);
        const status =
          typeof args?.status === "number" ? args.status : Number(args?.status);

        // Map on-chain status enum to readable string
        const statusMap: { [key: number]: string } = {
          0: "Active",
          1: "Completed",
          2: "Cancelled",
          3: "Disputed",
        };

        const statusString = statusMap[status] || "Unknown";

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (onChainProjectId) {
          queryClient.invalidateQueries({
            queryKey: ["project", onChainProjectId],
          });
        }

        // Call callback if provided
        if (onStatusChange) {
          onStatusChange(statusString);
        }

        // Show toast notification
        if (enableToasts) {
          if (statusString === "Completed") {
            showSuccess(
              "🎉 Project Fully Funded!",
              "This project has reached its funding goal and is now complete.",
            );
          } else if (statusString === "Cancelled") {
            showWarning(
              "Project Cancelled",
              "This project has been cancelled. Refunds will be processed.",
            );
          } else if (statusString === "Disputed") {
            showWarning(
              "Dispute Raised",
              "A dispute has been raised for this project. Arbitration in progress.",
            );
          }
        }
      } catch {}
    },
    [queryClient, onStatusChange, enableToasts, showSuccess, showWarning],
  );

  const handleMilestoneApproved = useCallback(
    async (log: ContractEventLog) => {
      try {
        const onChainProjectId = eventProjectId(log);

        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (onChainProjectId) {
          queryClient.invalidateQueries({
            queryKey: ["project", onChainProjectId],
          });
        }

        if (enableToasts) {
          showSuccess(
            "Milestone Approved! ✅",
            "A project milestone has been approved by validators.",
          );
        }
      } catch {}
    },
    [queryClient, enableToasts, showSuccess],
  );

  const handleFundsReleased = useCallback(
    async (log: ContractEventLog) => {
      try {
        const { args } = log;
        const onChainProjectId = eventProjectId(log);
        const amount = Number(toDisplayAmount(args?.amount));

        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (onChainProjectId) {
          queryClient.invalidateQueries({
            queryKey: ["project", onChainProjectId],
          });
        }

        if (enableToasts) {
          showSuccess(
            "Funds Released! 💰",
            `${amount.toFixed(2)} CELO has been released to the project creator.`,
          );
        }
      } catch {}
    },
    [queryClient, enableToasts, showSuccess],
  );

  // Manual sync function - polls the blockchain for current state
  const syncProjectStatus = useCallback(
    async (projectOnChainId: string) => {
      if (!publicClient || !ESCROW_ADDRESS) {
        return;
      }

      setIsSyncing(true);
      try {
        // Read current project state from blockchain
        const projectData = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "getProject",
          args: [BigInt(projectOnChainId)],
        });

        // projectData structure: [creator, title, description, targetAmount, raisedAmount, deadline, status]
        const [
          creator,
          title,
          description,
          targetAmount,
          raisedAmount,
          deadline,
          status,
        ] = projectData as ProjectContractData;

        const statusMap: { [key: number]: string } = {
          0: "FUNDING",
          1: "FUNDED",
          2: "FUNDING_FAILED",
          3: "DISPUTED",
        };

        const statusString = statusMap[status] || "UNKNOWN";

        // Update backend with latest on-chain data
        // You could call a backend sync endpoint here
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({
          queryKey: ["project", projectOnChainId],
        });
        queryClient.invalidateQueries({ queryKey: ["projects"] });

        if (enableToasts) {
          showInfo("Status Synced", "Project status updated from blockchain");
        }

        return {
          creator,
          title,
          description,
          targetAmount: Number(targetAmount) / 1e18,
          raisedAmount: Number(raisedAmount) / 1e18,
          deadline: Number(deadline),
          status: statusString,
        };
      } catch (error) {
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [publicClient, queryClient, enableToasts, showInfo],
  );

  // Poll for updates at regular intervals (optional)
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(() => {
      // Sync every 30 seconds
      syncProjectStatus(projectId).catch(() => undefined);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, syncProjectStatus]);

  return {
    syncProjectStatus,
    isSyncing,
  };
};

/**
 * Hook to watch for investment-related events for a specific user
 */
export const useInvestmentEventsWatch = (userAddress?: string) => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "FundsDeposited",
    onLogs(logs) {
      logs.forEach((log: ContractEventLog) => {
        const { args } = log;
        if (
          userAddress &&
          typeof args?.investor === "string" &&
          args.investor.toLowerCase() === userAddress.toLowerCase()
        ) {
          showSuccess(
            "Investment Confirmed! 🎉",
            `Your contribution of ${toDisplayAmount(args?.amount)} CELO has been confirmed on-chain.`,
          );

          // Refresh user's investments
          queryClient.invalidateQueries({
            queryKey: ["investments", userAddress],
          });
        }
      });
    },
  });

  useWatchContractEvent({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    eventName: "FundsRefunded",
    onLogs(logs) {
      logs.forEach((log: ContractEventLog) => {
        const { args } = log;
        if (
          userAddress &&
          typeof args?.investor === "string" &&
          args.investor.toLowerCase() === userAddress.toLowerCase()
        ) {
          showError(
            "Refund Processed",
            `Your investment of ${toDisplayAmount(args?.amount)} CELO has been refunded.`,
          );

          queryClient.invalidateQueries({
            queryKey: ["investments", userAddress],
          });
        }
      });
    },
  });
};
