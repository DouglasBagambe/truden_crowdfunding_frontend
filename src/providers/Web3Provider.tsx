"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { WagmiProvider } from "wagmi";
import { sepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

// WalletConnect projectId — from cloud.walletconnect.com
const configuredProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim();
const isUsableWalletConnectProjectId = Boolean(
  configuredProjectId &&
  !/^(your|replace[-_ ]?with|example|test)[-_ ]/i.test(configuredProjectId),
);
const projectId =
  configuredProjectId && isUsableWalletConnectProjectId
    ? configuredProjectId
    : "walletconnect-disabled-in-development";

const metadata = {
  name: "Keibo",
  description: "Connect a self-custody wallet to your Keibo account.",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  icons: ["/logo.jpeg"],
};

// Full-UAT uses Ethereum Sepolia. Never silently submit UAT actions elsewhere.
const chains = [sepolia] as const;
const isBrowser = typeof window !== "undefined";
let web3ModalInitialized = false;
let web3ModalInstance: { open: () => void } | null = null;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableWalletConnect: isBrowser && isUsableWalletConnectProjectId,
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
    if (
      web3ModalInitialized ||
      typeof window === "undefined" ||
      !isUsableWalletConnectProjectId
    ) {
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
      defaultChain: sepolia,
    });

    web3ModalInitialized = true;
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
