'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dfkChain, metis } from '../lib/chains';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [dfkChain, metis],
  connectors: [injected()],
  transports: {
    [dfkChain.id]: http(dfkChain.rpcUrls.default.http[0]),
    [metis.id]: http(metis.rpcUrls.default.http[0]),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
