import { defineChain } from 'viem';

// DFK Chain (Avalanche subnet). Commonly used chainId is 53935.
export const dfkChain = defineChain({
  id: 53935,
  name: 'DFK Chain',
  nativeCurrency: {
    name: 'JEWEL',
    symbol: 'JEWEL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'DFK Subnet Explorer',
      url: 'https://subnets.avax.network/defi-kingdoms/dfk-chain/explorer',
    },
  },
});

// Metis (Andromeda) chain.
export const metis = defineChain({
  id: 1088,
  name: 'Metis',
  nativeCurrency: {
    name: 'Metis',
    symbol: 'METIS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://andromeda.metis.io/?owner=1088'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Metis Explorer',
      url: 'https://andromeda-explorer.metis.io',
    },
  },
});
