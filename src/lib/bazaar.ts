import bazaarAbi from '../abi/BazaarDiamond.json';

export const BAZAAR = {
  // From DFK docs (mainnet addresses)
  dfkChain: {
    address: '0x902F2b740bC158e16170d57528405d7f2a793Ca2' as const,
  },
  metis: {
    address: '0x4cB622C886c89c0472C0056A7C4c929c98c35D14' as const,
  },
  abi: bazaarAbi as any,
};

export type Side = 0 | 1; // 0 buy, 1 sell

export function sideLabel(side: Side) {
  return side === 0 ? 'BUY' : 'SELL';
}
