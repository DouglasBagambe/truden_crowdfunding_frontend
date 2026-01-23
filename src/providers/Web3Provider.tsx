'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { celoAlfajores } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '8e562725807968565257eadae53a23a8'; // Temporary public demo project id

// 2. Create wagmiConfig
const metadata = {
  name: 'Truden Crowdfunding',
  description: 'Decentralized Crowdfunding Platform',
  url: 'http://localhost:3001', // host
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [celoAlfajores] as const;
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

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
