'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useReadContracts,
  useBalance,
} from 'wagmi';

import { BAZAAR, Side, sideLabel } from '../lib/bazaar';
import { dfkChain, metis } from '../lib/chains';
import { DFK_INVENTORY_ITEMS } from '../lib/inventoryItems';

function addrForChain(chainId: number) {
  return chainId === metis.id ? BAZAAR.metis.address : BAZAAR.dfkChain.address;
}

function asBigint(v: unknown): bigint {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') return BigInt(v);
  return 0n;
}

export default function HomeClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const { connect, connectors, status: connectStatus, error: connectError } = useConnect();
  const [connectNote, setConnectNote] = useState<string>('');
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const bazaarAddress = addrForChain(chainId);
  const publicClient = usePublicClient();

  const { data: jewelBalance } = useBalance({ address, query: { enabled: !!address } });

  // token input
  const [token, setToken] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('0');
  const [isErc20, setIsErc20] = useState<boolean>(true);
  const [tokenMeta, setTokenMeta] = useState<{ name?: string; symbol?: string; decimals?: number } | null>(null);
  const [tokenSearch, setTokenSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<
    { label: string; token: string; tokenId?: string; isErc20: boolean; decimals?: number }[]
  >([]);
  const [searchBusy, setSearchBusy] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComputed, setShowComputed] = useState(false);

  // order form
  const [side, setSide] = useState<Side>(0);
  const [tokenDecimals, setTokenDecimals] = useState<number>(0);
  const [qtyHuman, setQtyHuman] = useState<string>('1');
  const [unitPriceJewel, setUnitPriceJewel] = useState<string>('1');
  const [addToBook, setAddToBook] = useState<boolean>(true);

  // Selected token balance (ERC20)
  const erc20BalanceAbi = [
    {
      type: 'function',
      name: 'balanceOf',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const;

  const { data: tokenBalRes } = useReadContract({
    address: token && token.startsWith('0x') && token.length === 42 ? (token as any) : undefined,
    abi: erc20BalanceAbi,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && isErc20 && token.startsWith('0x') && token.length === 42 },
  } as any);

  const tokenBalance = useMemo(() => asBigint(tokenBalRes), [tokenBalRes]);

  // Auto-detect ERC20 name/symbol/decimals when token address changes.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setTokenMeta(null);
      if (!isErc20) return;
      if (!publicClient) return;
      if (!token || !token.startsWith('0x') || token.length !== 42) return;

      const erc20Abi = [
        {
          type: 'function',
          name: 'name',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
        {
          type: 'function',
          name: 'symbol',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
        {
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        },
      ] as const;

      try {
        const [name, symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: token as any, abi: erc20Abi, functionName: 'name' }),
          publicClient.readContract({ address: token as any, abi: erc20Abi, functionName: 'symbol' }),
          publicClient.readContract({ address: token as any, abi: erc20Abi, functionName: 'decimals' }),
        ]);

        if (cancelled) return;
        setTokenMeta({ name: name as any, symbol: symbol as any, decimals: Number(decimals) });
        setTokenDecimals(Number(decimals));
      } catch {
        // ignore
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, isErc20, publicClient]);

  const qtyWei = useMemo(() => {
    try {
      return parseUnits(qtyHuman || '0', tokenDecimals);
    } catch {
      return 0n;
    }
  }, [qtyHuman, tokenDecimals]);

  const unitPriceWei = useMemo(() => {
    try {
      return parseUnits(unitPriceJewel || '0', 18);
    } catch {
      return 0n;
    }
  }, [unitPriceJewel]);

  const totalPriceWei = useMemo(() => {
    const denom = 10n ** BigInt(tokenDecimals);
    if (denom === 0n) return 0n;
    return (unitPriceWei * qtyWei) / denom;
  }, [unitPriceWei, qtyWei, tokenDecimals]);

  // PRICE_FACTOR
  const { data: priceFactor } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'PRICE_FACTOR',
  });

  // Best + depth
  const { data: bestBuy } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getBestOrder',
    args: [token, BigInt(tokenId || '0'), 0],
    query: { enabled: token.startsWith('0x') && token.length === 42 },
  } as any);

  const { data: bestSell } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getBestOrder',
    args: [token, BigInt(tokenId || '0'), 1],
    query: { enabled: token.startsWith('0x') && token.length === 42 },
  } as any);

  const { data: buyPrices } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getPrices',
    args: [token, BigInt(tokenId || '0'), 0],
    query: { enabled: token.startsWith('0x') && token.length === 42 },
  } as any);

  const { data: sellPrices } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getPrices',
    args: [token, BigInt(tokenId || '0'), 1],
    query: { enabled: token.startsWith('0x') && token.length === 42 },
  } as any);

  const topBuyPrices = useMemo(() => {
    const arr = Array.isArray(buyPrices) ? (buyPrices as any[]).map(asBigint) : [];
    return arr.slice(0, 8);
  }, [buyPrices]);

  const topSellPrices = useMemo(() => {
    const arr = Array.isArray(sellPrices) ? (sellPrices as any[]).map(asBigint) : [];
    return arr.slice(0, 8);
  }, [sellPrices]);

  const { data: depthBuy } = useReadContracts({
    contracts: topBuyPrices.map((p) => ({
      address: bazaarAddress,
      abi: BAZAAR.abi,
      functionName: 'getOrderIdsAtPrice',
      args: [token, BigInt(tokenId || '0'), 0, p],
    })),
    query: { enabled: topBuyPrices.length > 0 },
  } as any);

  const { data: depthSell } = useReadContracts({
    contracts: topSellPrices.map((p) => ({
      address: bazaarAddress,
      abi: BAZAAR.abi,
      functionName: 'getOrderIdsAtPrice',
      args: [token, BigInt(tokenId || '0'), 1, p],
    })),
    query: { enabled: topSellPrices.length > 0 },
  } as any);

  function sumQtyAtPrice(res: any): bigint {
    try {
      const quantities = res?.result?.[1] ?? res?.[1] ?? [];
      if (!Array.isArray(quantities)) return 0n;
      return quantities.reduce((acc: bigint, x: any) => acc + asBigint(x), 0n);
    } catch {
      return 0n;
    }
  }

  function formatUnitPriceJewel(priceStored: bigint): string {
    const unitWei = priceStored / 1_000_000_000_000n;
    return formatUnits(unitWei, 18);
  }

  // My open orders
  const { data: myOrderIds } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getUserOpenOrderIds',
    args: [address],
    query: { enabled: !!address },
  });

  const idsArr: bigint[] = useMemo(() => {
    if (!myOrderIds) return [];
    try {
      return (myOrderIds as any[]).map(asBigint);
    } catch {
      return [];
    }
  }, [myOrderIds]);

  const { data: myOrders } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'getOrders',
    args: [idsArr],
    query: { enabled: idsArr.length > 0 },
  } as any);

  // Fee (buy side)
  const { data: feePercent } = useReadContract({
    address: bazaarAddress,
    abi: BAZAAR.abi,
    functionName: 'calcFeePercent',
    args: [address, token, side],
    query: { enabled: !!address && token.startsWith('0x') && token.length === 42 },
  } as any);

  const feeWei = useMemo(() => {
    const fp = asBigint(feePercent);
    if (fp <= 0n) return 0n;
    if (side !== 0) return 0n;
    return (totalPriceWei * fp) / 100_000n;
  }, [feePercent, totalPriceWei, side]);

  const txValue = useMemo(() => {
    if (side !== 0) return 0n;
    return totalPriceWei + feeWei;
  }, [side, totalPriceWei, feeWei]);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { data: receipt, isLoading: waiting } = useWaitForTransactionReceipt({ hash: txHash });
  const [txNote, setTxNote] = useState<string>('');

  async function onMakeOrder() {
    setTxNote('');

    const input = {
      token,
      tokenId: BigInt(tokenId || '0'),
      side,
      totalPrice: totalPriceWei,
      quantity: qtyWei,
      addUnfilledOrderToOrderbook: addToBook,
      isERC20: isErc20,
    };

    try {
      if (!publicClient) throw new Error('No RPC client');
      await publicClient.simulateContract({
        address: bazaarAddress as any,
        abi: BAZAAR.abi,
        functionName: 'makeOrders',
        args: [[input]],
        value: txValue,
        account: address as any,
      } as any);
    } catch (e: any) {
      const msg = e?.shortMessage || e?.cause?.shortMessage || e?.message || 'Simulation failed';
      setTxNote(`Simulation revert: ${msg}`);
      return;
    }

    writeContract({
      address: bazaarAddress,
      abi: BAZAAR.abi,
      functionName: 'makeOrders',
      args: [[input]],
      value: txValue,
    } as any);
  }

  function onCancel(id: bigint) {
    writeContract({
      address: bazaarAddress,
      abi: BAZAAR.abi,
      functionName: 'cancelOrders',
      args: [[id]],
    } as any);
  }

  async function onConnect() {
    setConnectNote('');
    try {
      const mm = connectors?.find((x: any) => x?.id === 'metaMask');
      const injected = connectors?.find((x: any) => x?.type === 'injected' || x?.id === 'injected');
      const c = mm ?? injected ?? connectors?.[0];

      if (!c) {
        setConnectNote('No wallet connector found. Install MetaMask or Rabby (injected wallet).');
        return;
      }

      connect({ connector: c });
    } catch (e: any) {
      setConnectNote(e?.message || 'Connect failed');
    }
  }

  async function runTokenSearch() {
    const q = tokenSearch.trim();
    if (!q) return;
    setSearchBusy(true);
    setSearchResults([]);

    try {
      const endpoint = 'https://api.defikingdoms.com/graphql';
      const query = `query BazaarTokenSearch($q: String!) {
        bazaarTokens(search: $q) {
          token
          tokenId
          isERC20
          symbol
          name
          decimals
        }
      }`;

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables: { q } }),
      });
      const j = await r.json();
      const items = (j?.data?.bazaarTokens || []) as any[];

      setSearchResults(
        items.slice(0, 20).map((it) => ({
          label: `${it.symbol || ''}${it.name ? ' — ' + it.name : ''}`.trim() || it.token,
          token: it.token,
          tokenId: String(it.tokenId ?? '0'),
          isErc20: !!it.isERC20,
          decimals: it.decimals != null ? Number(it.decimals) : undefined,
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearchBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="h1">Mytic Swap</div>
          <div className="muted">Buy / sell and manage dfk items orders</div>
          {isConnected && jewelBalance && (
            <div className="muted">
              JEWEL: {formatUnits((jewelBalance as any).value ?? 0n, (jewelBalance as any).decimals ?? 18)}{' '}
              {(jewelBalance as any).symbol}
            </div>
          )}
          {isConnected && isErc20 && token && (
            <div className="muted">
              {tokenMeta?.symbol || 'Token'}: {formatUnits(tokenBalance, tokenDecimals)}
            </div>
          )}
        </div>

        <div className="row" style={{ alignItems: 'center' }}>
          <select className="btn" value={chainId} onChange={(e) => switchChain?.({ chainId: Number(e.target.value) })}>
            <option value={dfkChain.id}>DFK Chain</option>
            <option value={metis.id}>Metis</option>
          </select>
          {!isConnected ? (
            <button className="btn primary" onClick={onConnect}>
              Connect Wallet
            </button>
          ) : (
            <button className="btn" onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      {connectStatus === 'pending' && <p className="muted">Connecting…</p>}
      {connectError && <p className="muted">{connectError.message}</p>}
      {connectNote && <p className="muted">{connectNote}</p>}

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h2">MARKET</div>
          </div>

          <div className="field">
            <label>Inventory items (DFK Chain)</label>
            <select
              value={token || ''}
              onChange={(e) => {
                const addr = e.target.value;
                const it = DFK_INVENTORY_ITEMS.find((x) => x.address.toLowerCase() === addr.toLowerCase());
                setToken(addr);
                setIsErc20(true);
                setTokenId('0');
                if (it) setTokenDecimals(it.decimals);
              }}
            >
              <option value="">— select —</option>
              {DFK_INVENTORY_ITEMS.map((it) => (
                <option key={it.address} value={it.address}>
                  {it.name} ({it.symbol})
                </option>
              ))}
            </select>
          </div>

          {showAdvanced && (
            <>
              <div className="field">
                <label>Find token / item by name (fills address)</label>
                <div className="row">
                  <input
                    style={{ flex: 1 }}
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    placeholder="e.g. CRYSTAL, Gold, Might Stone…"
                  />
                  <button className="btn" disabled={searchBusy} onClick={runTokenSearch}>
                    {searchBusy ? 'Searching…' : 'Search'}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="card" style={{ marginTop: 8, padding: 10 }}>
                    {searchResults.map((r) => (
                      <div
                        key={r.token + ':' + (r.tokenId ?? '0') + ':' + (r.isErc20 ? '20' : '1155')}
                        className="row"
                        style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}
                      >
                        <div>
                          <div>{r.label}</div>
                          <div className="muted code">
                            {r.token}
                            {!r.isErc20 ? ` • tokenId ${r.tokenId}` : ''}
                          </div>
                        </div>
                        <button
                          className="btn"
                          onClick={() => {
                            setToken(r.token);
                            setIsErc20(r.isErc20);
                            setTokenId(r.tokenId ?? '0');
                            if (r.decimals != null) setTokenDecimals(r.decimals);
                          }}
                        >
                          Use
                        </button>
                      </div>
                    ))}
                    <div className="muted">If this list is empty, the API endpoint may differ; we’ll swap to a different query.</div>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Token address</label>
                <input value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="0x..." />
                {tokenMeta?.name && (
                  <div className="muted">
                    Detected ERC20: <b>{tokenMeta.name}</b> ({tokenMeta.symbol}) • decimals {tokenMeta.decimals}
                  </div>
                )}
              </div>
              <div className="row">
                <div className="field" style={{ flex: 1 }}>
                  <label>tokenId (ERC-1155, else 0)</label>
                  <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
                </div>
                <div className="field" style={{ width: 180 }}>
                  <label>Token type</label>
                  <select value={isErc20 ? 'erc20' : 'erc1155'} onChange={(e) => setIsErc20(e.target.value === 'erc20')}>
                    <option value="erc20">ERC-20</option>
                    <option value="erc1155">ERC-1155</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Contract</label>
                <div className="code">{bazaarAddress}</div>
              </div>

              <div className="field">
                <label>PRICE_FACTOR</label>
                <div className="code">{priceFactor ? String(priceFactor) : '…'}</div>
              </div>
            </>
          )}

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div className="muted">&nbsp;</div>
            <button className="btn" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </button>
          </div>

          <div className="field">
            <label>Orderbook depth (top levels)</label>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="card">
                <div className="h2">BUY</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Price (JEWEL)</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBuyPrices.map((p, i) => {
                      const q = depthBuy?.[i] ? sumQtyAtPrice(depthBuy[i]) : 0n;
                      return (
                        <tr key={String(p)}>
                          <td className="code">{formatUnitPriceJewel(p)}</td>
                          <td className="code">{String(q)}</td>
                        </tr>
                      );
                    })}
                    {topBuyPrices.length === 0 && (
                      <tr>
                        <td colSpan={2} className="muted">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div className="h2">SELL</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Price (JEWEL)</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellPrices.map((p, i) => {
                      const q = depthSell?.[i] ? sumQtyAtPrice(depthSell[i]) : 0n;
                      return (
                        <tr key={String(p)}>
                          <td className="code">{formatUnitPriceJewel(p)}</td>
                          <td className="code">{String(q)}</td>
                        </tr>
                      );
                    })}
                    {topSellPrices.length === 0 && (
                      <tr>
                        <td colSpan={2} className="muted">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="muted">Qty is in token base units (inventory items = 0 decimals). Prices are unit price in JEWEL.</div>
          </div>
        </div>

        <div className="card">
          <div className="h2">MAKE ORDER</div>

          <div className="row">
            <div className="field" style={{ width: 180 }}>
              <label>Side</label>
              <select value={side} onChange={(e) => setSide(Number(e.target.value) as Side)}>
                <option value={0}>BUY</option>
                <option value={1}>SELL</option>
              </select>
            </div>

            <div className="field" style={{ flex: 1 }}>
              <label>Quantity in order</label>
              <div className="code">{String(qtyWei)} (base units)</div>
              <div className="muted">Inventory items use 0 decimals.</div>
            </div>
          </div>

          {showAdvanced && (
            <div className="field">
              <label>Token decimals</label>
              <input type="number" value={tokenDecimals} onChange={(e) => setTokenDecimals(Number(e.target.value))} />
            </div>
          )}

          <div className="field">
            <label>Quantity (human)</label>
            <input value={qtyHuman} onChange={(e) => setQtyHuman(e.target.value)} />
          </div>

          <div className="field">
            <label>Unit price (JEWEL)</label>
            <input value={unitPriceJewel} onChange={(e) => setUnitPriceJewel(e.target.value)} />
          </div>

          <div className="row">
            <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={addToBook} onChange={(e) => setAddToBook(e.target.checked)} />
              Add unfilled part to orderbook
            </label>
          </div>

          {showComputed && (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="code">qtyWei: {String(qtyWei)}</div>
              <div className="code">unitPriceWei: {String(unitPriceWei)}</div>
              <div className="code">totalPriceWei: {String(totalPriceWei)}</div>
              <div className="code">feePercent: {feePercent ? String(feePercent) : '…'} (÷100000)</div>
              <div className="code">feeWei: {String(feeWei)}</div>
              <div className="code">tx value: {String(txValue)}</div>
            </div>
          )}

          <button className="btn primary" disabled={!isConnected || isPending} onClick={onMakeOrder}>
            {isPending ? 'Sending…' : `Make ${sideLabel(side)} order`}
          </button>

          {txNote && <p className="muted">{txNote}</p>}
          {writeError && <p className="muted">{writeError.message}</p>}
          {txHash && <p className="muted">tx: {txHash}</p>}
          {waiting && <p className="muted">Waiting for confirmation…</p>}
          {receipt && <p className="muted">Confirmed ✅</p>}

          <p className="muted" style={{ marginTop: 10 }}>
            Note: SELL orders require token approval to the Bazaar contract. We’ll add an Approve panel next.
          </p>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div className="muted">&nbsp;</div>
            <button className="btn" onClick={() => setShowComputed((v) => !v)}>
              {showComputed ? 'Hide computed' : 'Show computed'}
            </button>
          </div>

          {txNote && <p className="muted">{txNote}</p>}
          {writeError && <p className="muted">{writeError.message}</p>}
          {txHash && <p className="muted">tx: {txHash}</p>}
          {waiting && <p className="muted">Waiting for confirmation…</p>}
          {receipt && <p className="muted">Confirmed ✅</p>}
        </div>
      </div>
    </div>
  );
}

