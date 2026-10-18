"use client";
import { useWalletSync } from "@/hooks/useWalletSync";
import { createContext, useContext, type ReactNode } from "react";
const WalletLinkContext = createContext<ReturnType<
  typeof useWalletSync
> | null>(null);
export function useWalletLink() {
  const context = useContext(WalletLinkContext);
  if (!context) throw new Error("Wallet link provider is missing");
  return context;
}
export function AuthSyncProvider({ children }: { children: ReactNode }) {
  const wallet = useWalletSync();
  return (
    <WalletLinkContext.Provider value={wallet}>
      {children}
    </WalletLinkContext.Provider>
  );
}
