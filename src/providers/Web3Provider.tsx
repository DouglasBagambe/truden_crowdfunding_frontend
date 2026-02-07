'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { defineChain } from 'viem';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '8e562725807968565257eadae53a23a8';

// 2. Create wagmiConfig
const metadata = {
  name: 'TruFund',
  description: 'Decentralized Milestone-Based Crowdfunding',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '');
const envRpc = process.env.NEXT_PUBLIC_RPC_HTTP;
const envChainName = process.env.NEXT_PUBLIC_CHAIN_NAME || 'Celo Testnet';
const envCurrencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'CELO';

const customChain = envChainId && envRpc
  ? defineChain({
      id: envChainId,
      name: envChainName,
      nativeCurrency: { name: envCurrencySymbol, symbol: envCurrencySymbol, decimals: 18 },
      rpcUrls: {
        default: { http: [envRpc] },
        public: { http: [envRpc] },
      },
      blockExplorers: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL
        ? {
            default: { name: 'Explorer', url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL }
          }
        : undefined,
    })
  : null;

const chains = [customChain ?? celoAlfajores] as const;
const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

// 3. Create modal
createWeb3Modal({ 
  wagmiConfig, 
  projectId, 
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#0c3b92',
    '--w3m-border-radius-master': '12px'
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
