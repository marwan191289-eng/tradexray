import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Activity, DollarSign, BarChart2, Target,
  ChevronUp, ChevronDown, Clock, Layers, Zap, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

interface Order {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  mode: 'spot' | 'futures';
  orderType: 'market' | 'limit';
  quantity: number;
  price: number;
  leverage: number;
  status: 'filled' | 'pending' | 'cancelled';
  pnl?: number;
  createdAt: Date;
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  openedAt: Date;
}

interface Balance {
  available: number;
  locked: number;
  total: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAIRS = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT' },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT' },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT' },
  { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT' },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT' },
  { symbol: 'AVAXUSDT', base: 'AVAX', quote: 'USDT' },
  { symbol: 'DOTUSDT', base: 'DOT', quote: 'USDT' },
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT' },
];

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100];
const INITIAL_BALANCE = 10000;
const STORAGE_KEY = 'warroom_trading_v1';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(data: any) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function fmtPrice(n: number, decimals?: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: decimals ?? 2, maximumFractionDigits: decimals ?? 2 });
  if (n >= 1) return n.toFixed(decimals ?? 4);
  return n.toFixed(decimals ?? 6);
}

function fmtVolume(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function calcLiquidationPrice(side: 'long' | 'short', entryPrice: number, leverage: number): number {
  const maintenanceMargin = 0.005;
  if (side === 'long') return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
  return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Trading() {
  useDocumentMeta({
    title: 'Trading Terminal — TradeXRay AI',
    description: 'Spot & Futures paper trading terminal with real-time Binance prices.',
    canonicalPath: '/trading',
  });

  // ── State ────────────────────────────────────────────────────────────────────
  const [tickers, setTickers] = useState<Map<string, TickerData>>(new Map());
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState('trade');
  const [mode, setMode] = useState<'spot' | 'futures'>('spot');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [percentOfBalance, setPercentOfBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const saved = loadState();
  const [balance, setBalance] = useState<Balance>(saved?.balance ?? { available: INITIAL_BALANCE, locked: 0, total: INITIAL_BALANCE });
  const [orders, setOrders] = useState<Order[]>(
    saved?.orders?.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) ?? []
  );
  const [positions, setPositions] = useState<Position[]>(
    saved?.positions?.map((p: any) => ({ ...p, openedAt: new Date(p.openedAt) })) ?? []
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch tickers via REST ───────────────────────────────────────────────────
  const fetchTickers = useCallback(async () => {
    try {
      const symbols = PAIRS.map(p => `"${p.symbol}"`).join(',');
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return;
      const data = await res.json();
      const map = new Map<string, TickerData>();
      for (const t of data) {
        map.set(t.symbol, {
          symbol: t.symbol,
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChange),
          changePercent24h: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          volume24h: parseFloat(t.volume),
          quoteVolume24h: parseFloat(t.quoteVolume),
        });
      }
      setTickers(map);
    } catch {}
  }, []);

  // ── WebSocket for live price streaming ─────────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const streams = PAIRS.map(p => `${p.symbol.toLowerCase()}@miniTicker`).join('/');
    try {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const t = msg.data;
          if (!t) return;
          setTickers(prev => {
            const next = new Map(prev);
            const existing = next.get(t.s);
            if (existing) {
              next.set(t.s, {
                ...existing,
                price: parseFloat(t.c),
                change24h: parseFloat(t.c) - parseFloat(t.o),
                changePercent24h: ((parseFloat(t.c) - parseFloat(t.o)) / parseFloat(t.o)) * 100,
                volume24h: parseFloat(t.v),
                quoteVolume24h: parseFloat(t.q),
              });
            }
            return next;
          });
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimerRef.current = setTimeout(connectWs, 3000);
      };
      wsRef.current = ws;
    } catch {}
  }, []);

  useEffect(() => {
    fetchTickers();
    connectWs();
    const poll = setInterval(fetchTickers, 15000);
    return () => {
      clearInterval(poll);
      wsRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [fetchTickers, connectWs]);

  // ── Update positions with live prices ──────────────────────────────────────
  useEffect(() => {
    if (tickers.size === 0 || positions.length === 0) return;
    setPositions(prev =>
      prev.map(pos => {
        const ticker = tickers.get(pos.symbol);
        if (!ticker) return pos;
        const cp = ticker.price;
        const pnl = pos.side === 'long'
          ? (cp - pos.entryPrice) * pos.quantity * pos.leverage
          : (pos.entryPrice - cp) * pos.quantity * pos.leverage;
        const pnlPercent = (pnl / (pos.entryPrice * pos.quantity)) * 100;
        return { ...pos, currentPrice: cp, pnl, pnlPercent };
      })
    );
  }, [tickers]);

  // ── Persist to localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    saveState({ balance, orders, positions });
  }, [balance, orders, positions]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const ticker = tickers.get(selectedPair);
  const currentPrice = ticker?.price ?? 0;
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

  const quantityNum = parseFloat(quantity) || 0;
  const execPrice = orderType === 'limit' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
  const orderValue = quantityNum * execPrice;
  const marginRequired = mode === 'futures' ? orderValue / leverage : orderValue;
  const fee = orderValue * (mode === 'futures' ? 0.0004 : 0.001);

  // ── Percent-of-balance quick fill ──────────────────────────────────────────
  const handlePercentChange = (pct: number) => {
    setPercentOfBalance(pct);
    if (!currentPrice || currentPrice === 0) return;
    const usable = balance.available * (pct / 100);
    const margin = mode === 'futures' ? usable * leverage : usable;
    const qty = margin / currentPrice;
    setQuantity(qty.toFixed(6));
  };

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!currentPrice || currentPrice === 0) {
      toast.error('Price feed not available. Try again in a moment.');
      return;
    }
    if (!quantityNum || quantityNum <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    if (marginRequired + fee > balance.available) {
      toast.error(`Insufficient balance. Required: $${(marginRequired + fee).toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 400)); // simulate execution latency

    const orderId = `ord_${Date.now()}`;

    if (mode === 'spot') {
      const newOrder: Order = {
        id: orderId,
        symbol: selectedPair,
        type: side as 'buy' | 'sell',
        mode: 'spot',
        orderType,
        quantity: quantityNum,
        price: execPrice,
        leverage: 1,
        status: 'filled',
        createdAt: new Date(),
      };
      setOrders(prev => [newOrder, ...prev]);
      setBalance(prev => ({
        available: side === 'buy'
          ? prev.available - (orderValue + fee)
          : prev.available + (orderValue - fee),
        locked: prev.locked,
        total: side === 'buy' ? prev.total - fee : prev.total - fee,
      }));
      toast.success(
        `${side === 'buy' ? '🟢 Bought' : '🔴 Sold'} ${quantityNum.toFixed(6)} ${selectedPair.replace('USDT', '')} @ $${fmtPrice(execPrice)}`
      );
    } else {
      // Futures: open a new position
      const posSide: 'long' | 'short' = side === 'buy' ? 'long' : 'short';
      const liqPrice = calcLiquidationPrice(posSide, execPrice, leverage);
      const newPos: Position = {
        id: orderId,
        symbol: selectedPair,
        side: posSide,
        quantity: quantityNum,
        entryPrice: execPrice,
        currentPrice: execPrice,
        leverage,
        pnl: 0,
        pnlPercent: 0,
        liquidationPrice: liqPrice,
        openedAt: new Date(),
      };
      setPositions(prev => [newPos, ...prev]);
      setBalance(prev => ({
        available: prev.available - marginRequired - fee,
        locked: prev.locked + marginRequired,
        total: prev.total - fee,
      }));
      const newOrder: Order = {
        id: orderId,
        symbol: selectedPair,
        type: side as 'buy' | 'sell',
        mode: 'futures',
        orderType,
        quantity: quantityNum,
        price: execPrice,
        leverage,
        status: 'filled',
        createdAt: new Date(),
      };
      setOrders(prev => [newOrder, ...prev]);
      toast.success(
        `${posSide === 'long' ? '🟢 Long' : '🔴 Short'} ${leverage}x opened on ${selectedPair.replace('USDT', '')} @ $${fmtPrice(execPrice)}`
      );
    }

    setQuantity('');
    setPercentOfBalance(0);
    setSubmitting(false);
  };

  // ── Close futures position ──────────────────────────────────────────────────
  const handleClosePosition = (pos: Position) => {
    const cp = tickers.get(pos.symbol)?.price ?? pos.currentPrice;
    const pnl = pos.side === 'long'
      ? (cp - pos.entryPrice) * pos.quantity * pos.leverage
      : (pos.entryPrice - cp) * pos.quantity * pos.leverage;
    const margin = (pos.entryPrice * pos.quantity) / pos.leverage;
    const fee = cp * pos.quantity * 0.0004;
    setPositions(prev => prev.filter(p => p.id !== pos.id));
    setBalance(prev => ({
      available: prev.available + margin + pnl - fee,
      locked: Math.max(0, prev.locked - margin),
      total: prev.total + pnl - fee,
    }));
    toast.success(`Position closed. P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  };

  // ── Reset account ───────────────────────────────────────────────────────────
  const handleReset = () => {
    setBalance({ available: INITIAL_BALANCE, locked: 0, total: INITIAL_BALANCE });
    setOrders([]);
    setPositions([]);
    toast.info('Paper trading account reset to $10,000');
  };

  return (
    <Layout>
      <div className="w-full h-full bg-background flex flex-col overflow-hidden">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0 overflow-x-auto">
          {PAIRS.map(pair => {
            const t = tickers.get(pair.symbol);
            const up = (t?.changePercent24h ?? 0) >= 0;
            return (
              <button
                key={pair.symbol}
                onClick={() => setSelectedPair(pair.symbol)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedPair === pair.symbol
                    ? 'bg-primary/15 border border-primary/40 text-primary'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-bold">{pair.base}</span>
                {t ? (
                  <>
                    <span className="text-foreground tabular-nums">${fmtPrice(t.price)}</span>
                    <span className={up ? 'text-emerald-500' : 'text-red-500'}>
                      {up ? '+' : ''}{t.changePercent24h.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${tickers.size > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-[10px] text-muted-foreground">{tickers.size > 0 ? 'LIVE' : 'Connecting...'}</span>
          </div>
        </div>

        {/* ── Main Layout ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left: Order Panel */}
          <div className="w-80 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/30">

            {/* Pair Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold">{selectedPair.replace('USDT', '')}<span className="text-muted-foreground font-normal">/USDT</span></h2>
                {ticker && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ticker.changePercent24h >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {ticker.changePercent24h >= 0 ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%
                  </span>
                )}
              </div>
              {ticker ? (
                <p className="text-3xl font-bold tabular-nums mt-1">${fmtPrice(ticker.price)}</p>
              ) : (
                <div className="h-9 w-36 bg-muted/50 rounded animate-pulse mt-1" />
              )}
              {ticker && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-[11px] text-muted-foreground">
                  <span>24h High <span className="text-emerald-500 font-medium">${fmtPrice(ticker.high24h)}</span></span>
                  <span>24h Low <span className="text-red-500 font-medium">${fmtPrice(ticker.low24h)}</span></span>
                  <span>Volume <span className="text-foreground font-medium">{fmtVolume(ticker.quoteVolume24h)}</span></span>
                </div>
              )}
            </div>

            {/* Mode: Spot / Futures */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex rounded-lg bg-muted/50 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => { setMode('spot'); setLeverage(1); }}
                  className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'spot' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Spot
                </button>
                <button
                  onClick={() => setMode('futures')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'futures' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Futures
                </button>
              </div>
            </div>

            {/* Buy / Sell */}
            <div className="px-4 pb-2">
              <div className="flex rounded-lg overflow-hidden border border-border text-xs font-bold">
                <button
                  onClick={() => setSide('buy')}
                  className={`flex-1 py-2 transition-all ${side === 'buy' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                >
                  {mode === 'futures' ? '▲ Long' : 'Buy'}
                </button>
                <button
                  onClick={() => setSide('sell')}
                  className={`flex-1 py-2 transition-all ${side === 'sell' ? 'bg-red-500 text-white' : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-500'}`}
                >
                  {mode === 'futures' ? '▼ Short' : 'Sell'}
                </button>
              </div>
            </div>

            {/* Order Type */}
            <div className="px-4 pb-3">
              <div className="flex gap-1.5 text-xs">
                {(['market', 'limit'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${orderType === t ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold tabular-nums">${balance.available.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* Leverage (futures only) */}
            {mode === 'futures' && (
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-muted-foreground">Leverage</span>
                  <span className="font-bold text-amber-400">{leverage}×</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {LEVERAGE_OPTIONS.map(lv => (
                    <button
                      key={lv}
                      onClick={() => setLeverage(lv)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${leverage === lv ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                      {lv}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Limit Price */}
            {orderType === 'limit' && (
              <div className="px-4 pb-2">
                <label className="text-xs text-muted-foreground mb-1 block">Limit Price (USDT)</label>
                <Input
                  type="number"
                  placeholder={currentPrice ? fmtPrice(currentPrice) : '0.00'}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="h-9 text-sm tabular-nums"
                />
              </div>
            )}

            {/* Quantity */}
            <div className="px-4 pb-2">
              <label className="text-xs text-muted-foreground mb-1 block">
                Amount ({selectedPair.replace('USDT', '')})
              </label>
              <Input
                type="number"
                placeholder="0.000000"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setPercentOfBalance(0); }}
                className="h-9 text-sm tabular-nums"
              />
            </div>

            {/* % quick fill */}
            <div className="px-4 pb-3">
              <div className="flex gap-1">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => handlePercentChange(pct)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded transition-all ${percentOfBalance === pct ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            {quantityNum > 0 && currentPrice > 0 && (
              <div className="mx-4 mb-3 p-3 bg-muted/30 rounded-lg border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Value</span>
                  <span className="font-medium tabular-nums">${orderValue.toFixed(2)}</span>
                </div>
                {mode === 'futures' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin ({leverage}×)</span>
                    <span className="font-medium tabular-nums text-amber-400">${marginRequired.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (est.)</span>
                  <span className="font-medium tabular-nums">${fee.toFixed(4)}</span>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <div className="px-4 pb-4">
              <Button
                onClick={handlePlaceOrder}
                disabled={submitting || !currentPrice}
                className={`w-full font-bold h-10 ${
                  side === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'futures'
                      ? (side === 'buy' ? `Open Long ${leverage}×` : `Open Short ${leverage}×`)
                      : (side === 'buy' ? 'Place Buy Order' : 'Place Sell Order')
                    }
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                Paper Trading · No real funds used
              </p>
            </div>
          </div>

          {/* Right: Data Panels */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Portfolio bar */}
            <div className="grid grid-cols-4 gap-0 border-b border-border flex-shrink-0">
              {[
                { label: 'Total Balance', value: `$${balance.total.toFixed(2)}`, icon: DollarSign, color: '' },
                { label: 'Available', value: `$${balance.available.toFixed(2)}`, icon: Activity, color: '' },
                { label: 'Open Positions P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: BarChart2, color: totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500' },
                { label: 'Positions', value: positions.length.toString(), icon: Layers, color: '' },
              ].map((item, i) => (
                <div key={i} className={`px-4 py-3 ${i < 3 ? 'border-r border-border' : ''}`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </div>
                  <p className={`text-base font-bold tabular-nums ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 border-b border-border flex-shrink-0">
                <TabsList className="bg-transparent p-0 h-10 gap-0">
                  {[
                    { value: 'trade', label: 'Market Overview' },
                    { value: 'positions', label: `Positions (${positions.length})` },
                    { value: 'orders', label: `Orders (${orders.length})` },
                  ].map(t => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="px-4 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-medium"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground h-7">
                  Reset Account
                </Button>
              </div>

              {/* Market Overview */}
              <TabsContent value="trade" className="flex-1 overflow-y-auto m-0 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {PAIRS.map(pair => {
                    const t = tickers.get(pair.symbol);
                    const up = (t?.changePercent24h ?? 0) >= 0;
                    return (
                      <button
                        key={pair.symbol}
                        onClick={() => setSelectedPair(pair.symbol)}
                        className={`p-4 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                          selectedPair === pair.symbol
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border bg-card hover:border-primary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {pair.base.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{pair.base}<span className="text-muted-foreground font-normal">/USDT</span></p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {up ? '+' : ''}{(t?.changePercent24h ?? 0).toFixed(2)}%
                          </span>
                        </div>
                        {t ? (
                          <>
                            <p className="text-lg font-bold tabular-nums">${fmtPrice(t.price)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Vol: {fmtVolume(t.quoteVolume24h)}</p>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <div className="h-6 w-24 bg-muted/40 rounded animate-pulse" />
                            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Positions */}
              <TabsContent value="positions" className="flex-1 overflow-y-auto m-0 p-4">
                {positions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                    <Target className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No open positions</p>
                    <p className="text-xs">Open a Futures trade to see positions here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map(pos => {
                      const isProfit = pos.pnl >= 0;
                      return (
                        <Card key={pos.id} className={`border ${isProfit ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={pos.side === 'long' ? 'border-emerald-500/50 text-emerald-500' : 'border-red-500/50 text-red-500'}>
                                  {pos.side === 'long' ? <ChevronUp className="w-3 h-3 mr-0.5" /> : <ChevronDown className="w-3 h-3 mr-0.5" />}
                                  {pos.side.toUpperCase()} {pos.leverage}×
                                </Badge>
                                <span className="font-bold">{pos.symbol.replace('USDT', '/USDT')}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs px-3"
                                onClick={() => handleClosePosition(pos)}
                              >
                                Close
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Entry</p>
                                <p className="font-semibold tabular-nums">${fmtPrice(pos.entryPrice)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Current</p>
                                <p className="font-semibold tabular-nums">${fmtPrice(pos.currentPrice)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">P&L</p>
                                <p className={`font-bold tabular-nums ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Size</p>
                                <p className="font-semibold tabular-nums">{pos.quantity.toFixed(6)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Liq. Price
                                </p>
                                <p className="font-semibold tabular-nums text-amber-400">${fmtPrice(pos.liquidationPrice)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Order History */}
              <TabsContent value="orders" className="flex-1 overflow-y-auto m-0 p-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                    <Clock className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map(order => {
                      const isBuy = order.type === 'buy';
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                              {isBuy
                                ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                : <ArrowUpRight className="w-4 h-4 text-red-500" />
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {isBuy ? (order.mode === 'futures' ? 'Long' : 'Buy') : (order.mode === 'futures' ? 'Short' : 'Sell')}
                                {' '}{order.symbol.replace('USDT', '/USDT')}
                                {order.mode === 'futures' && <span className="text-amber-400 ml-1">{order.leverage}×</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.quantity.toFixed(6)} @ ${fmtPrice(order.price)} · {order.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-500">
                              {order.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                              ${(order.quantity * order.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
