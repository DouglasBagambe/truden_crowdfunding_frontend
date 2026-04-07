'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';

// WalletConnect projectId — from cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '8e562725807968565257eadae53a23a8';

const metadata = {
  name: 'Truden',
  description: 'Invest. Own. Trade. — Fiat-powered investment NFTs on Base.',
  url:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Primary chain: Base Sepolia (testnet). Switch to `base` for mainnet.
const chains = [baseSepolia, base] as const;
let web3ModalInitialized = false;
let web3ModalInstance: { open: () => void } | null = null;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,  // MetaMask etc.
  enableEIP6963: true,
  enableCoinbase: true,
});

export function openWeb3Modal() {
  web3ModalInstance?.open();
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    if (web3ModalInitialized || typeof window === 'undefined') {
      return;
    }

    web3ModalInstance = createWeb3Modal({
      wagmiConfig,
      projectId,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#7c3aed',
        '--w3m-border-radius-master': '12px',
      },
      defaultChain: baseSepolia,
    });

    web3ModalInitialized = true;
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
