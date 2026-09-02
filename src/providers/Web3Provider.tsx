"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { WagmiProvider } from "wagmi";
import { baseSepolia, base } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

// WalletConnect projectId — from cloud.walletconnect.com
const configuredProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim();
if (process.env.NODE_ENV === "production" && !configuredProjectId) {
  throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is required in production");
}
const projectId =
  configuredProjectId || "walletconnect-disabled-in-development";

const metadata = {
  name: "Keibo",
  description: "Connect a self-custody wallet to your Keibo account.",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  icons: ["/logo.jpeg"],
};

// Primary chain: Base Sepolia (testnet). Switch to `base` for mainnet.
const chains = [baseSepolia, base] as const;
const isBrowser = typeof window !== "undefined";
let web3ModalInitialized = false;
let web3ModalInstance: { open: () => void } | null = null;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableWalletConnect: isBrowser && Boolean(configuredProjectId),
  enableInjected: isBrowser,
  enableEIP6963: isBrowser,
  enableCoinbase: isBrowser,
  auth: isBrowser ? undefined : { email: false, socials: [] },
});

export function openWeb3Modal() {
  web3ModalInstance?.open();
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if (web3ModalInitialized || typeof window === "undefined") {
      return;
    }

    web3ModalInstance = createWeb3Modal({
      wagmiConfig,
      projectId,
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#7c3aed",
        "--w3m-border-radius-master": "12px",
      },
      defaultChain: baseSepolia,
    });

    web3ModalInitialized = true;
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
