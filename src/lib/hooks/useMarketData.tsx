'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { LiveTick, Mt5Position } from '@/lib/broker/mt5-bridge';
import { Candle } from '@/lib/types/trading';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';

export interface MarketAccountData {
  balance: number;
  equity: number;
  freeMargin: number;
  isConnected: boolean;
  login?: string;
  server?: string;
}

export type ConnectionStatus = 'CONNECTING' | 'LIVE' | 'DEGRADED' | 'STALE' | 'OFFLINE';
export type CandleFeedStatus = 'LOADING' | 'READY' | 'STALE' | 'ERROR';

export interface MarketDataContextType {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
  ticks: Record<string, LiveTick>;
  currentTick?: LiveTick;
  positions: Mt5Position[];
  account: MarketAccountData;
  floatingProfit: number;
  isMt5Connected: boolean;
  lastUpdated: number;
  status: ConnectionStatus;
  feedQuality: ConnectionStatus;
  feedSource: string;
  isMarketOpen: boolean;
  marketState: 'OPEN' | 'WEEKEND_CLOSED' | 'ROLLOVER';
  marketStatusText: string;
  marketOpensAt?: string;
  candles: Candle[];
  candlesStatus: CandleFeedStatus;
  orderBook: {
    bids: Array<{ p: number; s: number }>;
    asks: Array<{ p: number; s: number }>;
    spread?: number;
    source?: string;
  };
  refresh: () => Promise<void>;
  getTick: (symbol: string) => LiveTick | undefined;
}

const DEFAULT_ACCOUNT: MarketAccountData = {
  balance: 10000.0,
  equity: 10000.0,
  freeMargin: 10000.0,
  isConnected: false,
};

function parseTfMinutes(tf: string): number {
  const t = (tf || '15m').toLowerCase();
  if (t === '30s') return 0.5;
  if (t === '1m') return 1;
  if (t === '5m') return 5;
  if (t === '15m') return 15;
  if (t === '30m') return 30;
  if (t === '1h' || t === '60m') return 60;
  if (t === '4h' || t === '240m') return 240;
  if (t === '1d' || t === 'd') return 1440;
  return 15;
}

const MarketDataContext = createContext<MarketDataContextType | null>(null);

interface MarketDataProviderProps {
  children: ReactNode;
  pollIntervalMs?: number;
}

export const MarketDataProvider: React.FC<MarketDataProviderProps> = ({
  children,
  pollIntervalMs = 2500,
}) => {
  const [selectedSymbol, setSelectedSymbolState] = useState<string>('XAUUSD');
  const [selectedTimeframe, setSelectedTimeframeState] = useState<string>('15m');

  // Load persisted timeframe and symbol on mount from localStorage
  useEffect(() => {
    try {
      const savedTf = localStorage.getItem('clever_trader_selected_timeframe');
      if (savedTf) {
        setSelectedTimeframeState(savedTf);
      }
      const savedSym = localStorage.getItem('clever_trader_selected_symbol');
      if (savedSym) {
        setSelectedSymbolState(savedSym);
      }
    } catch {}
  }, []);

  const setSelectedTimeframe = useCallback((tf: string) => {
    setSelectedTimeframeState(tf);
    try {
      localStorage.setItem('clever_trader_selected_timeframe', tf);
    } catch {}
  }, []);

  const setSelectedSymbol = useCallback((sym: string) => {
    setSelectedSymbolState(sym);
    try {
      localStorage.setItem('clever_trader_selected_symbol', sym);
    } catch {}
  }, []);

  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const [positions, setPositions] = useState<Mt5Position[]>([]);
  const [account, setAccount] = useState<MarketAccountData>(DEFAULT_ACCOUNT);
  const [floatingProfit, setFloatingProfit] = useState<number>(0);
  const [isMt5Connected, setIsMt5Connected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [feedQuality, setFeedQuality] = useState<ConnectionStatus>('CONNECTING');
  const [feedSource, setFeedSource] = useState<string>('CONNECTING');

  // Single Source of Truth: Normalized Live Candles & Order Book
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candlesStatus, setCandlesStatus] = useState<CandleFeedStatus>('LOADING');
  const [orderBook, setOrderBook] = useState<{
    bids: Array<{ p: number; s: number }>;
    asks: Array<{ p: number; s: number }>;
    spread?: number;
    source?: string;
  }>({ bids: [], asks: [] });

  const [marketOpenInfo, setMarketOpenInfo] = useState(() => SessionFilterEngine.isMarketOpen(selectedSymbol));

  useEffect(() => {
    setMarketOpenInfo(SessionFilterEngine.isMarketOpen(selectedSymbol));
  }, [selectedSymbol]);

  const inFlightMt5Ref = useRef<Promise<void> | null>(null);
  const inFlightMarketRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastUpdatedThrottleRef = useRef<number>(0);

  // 1. Fetch MT5 account status, positions, and ticks
  const fetchMt5Data = useCallback(async (): Promise<void> => {
    if (inFlightMt5Ref.current) return inFlightMt5Ref.current;

    const task = (async () => {
      try {
        const res = await fetch('/api/mt5', {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!isMountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.ticks) {
            setTicks(prev => {
              const newTicks = data.ticks;
              let changed = Object.keys(prev).length !== Object.keys(newTicks).length;
              if (!changed) {
                for (const k in newTicks) {
                  if (!prev[k] || prev[k].price !== newTicks[k].price || prev[k].bid !== newTicks[k].bid) {
                    changed = true;
                    break;
                  }
                }
              }
              return changed ? newTicks : prev;
            });
          }
          if (data.positions) {
            setPositions(prev => {
              if (prev.length === 0 && data.positions.length === 0) return prev;
              return JSON.stringify(prev) !== JSON.stringify(data.positions) ? data.positions : prev;
            });
          }
          if (data.floatingProfit !== undefined) {
            setFloatingProfit(Number(data.floatingProfit));
          }
          if (data.config) {
            const isConn = Boolean(data.config.isConnected);
            setIsMt5Connected(isConn);
            setAccount({
              balance: data.config.balance ?? 10000.0,
              equity: data.config.equity ?? data.config.balance ?? 10000.0,
              freeMargin: data.config.freeMargin ?? data.config.balance ?? 10000.0,
              isConnected: isConn,
              login: data.config.login,
              server: data.config.server,
            });
            setStatus(isConn ? 'LIVE' : 'DEGRADED');
          } else {
            setStatus('LIVE');
          }
          const now = Date.now();
          if (now - lastUpdatedThrottleRef.current > 4000) {
            lastUpdatedThrottleRef.current = now;
            setLastUpdated(now);
          }
        } else {
          setStatus('DEGRADED');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setStatus('OFFLINE');
      } finally {
        inFlightMt5Ref.current = null;
      }
    })();

    inFlightMt5Ref.current = task;
    return task;
  }, []);

  // 2. Fetch normalized live candles and order book from UnifiedMarketDataService
  const fetchCandlesAndOrderBook = useCallback(async (sym: string, tf: string): Promise<void> => {
    if (inFlightMarketRef.current) return inFlightMarketRef.current;

    const tfMinutes = parseTfMinutes(tf);
    const task = (async () => {
      try {
        const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(sym)}&timeframe=${tfMinutes}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!isMountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.candles) && data.candles.length > 0) {
            setCandles(data.candles);
            setCandlesStatus('READY');
          }
          if (data.orderBook && data.orderBook.bids && data.orderBook.asks) {
            setOrderBook(data.orderBook);
          }
          if (data.feedQuality) {
            setFeedQuality(data.feedQuality);
          }
          if (data.feedSource) {
            setFeedSource(data.feedSource);
          }
          if (data.isMarketOpen !== undefined) {
            setMarketOpenInfo({
              isOpen: Boolean(data.isMarketOpen),
              state: data.marketState || 'OPEN',
              label: data.marketStatusText || 'MARKET OPEN',
              opensAt: data.marketOpensAt || '',
              reason: data.marketStatusText || '',
            });
          }
        } else {
          setCandlesStatus(prev => prev === 'READY' ? 'STALE' : 'ERROR');
        }
      } catch (e) {
        if (!isMountedRef.current) return;
        setCandlesStatus(prev => prev === 'READY' ? 'STALE' : 'ERROR');
      } finally {
        inFlightMarketRef.current = null;
      }
    })();

    inFlightMarketRef.current = task;
    return task;
  }, []);

  // Sync MT5 status periodically
  useEffect(() => {
    isMountedRef.current = true;
    fetchMt5Data();

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      fetchMt5Data();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchMt5Data, pollIntervalMs]);

  // Sync Candles & Order Book whenever active symbol or timeframe changes, and periodically
  useEffect(() => {
    setCandlesStatus('LOADING');
    fetchCandlesAndOrderBook(selectedSymbol, selectedTimeframe);

    const candleInterval = setInterval(() => {
      if (document.hidden) return;
      fetchCandlesAndOrderBook(selectedSymbol, selectedTimeframe);
    }, 5000);

    return () => {
      clearInterval(candleInterval);
    };
  }, [selectedSymbol, selectedTimeframe, fetchCandlesAndOrderBook]);

  const getTick = useCallback(
    (sym: string): LiveTick | undefined => {
      return ticks[sym];
    },
    [ticks]
  );

  const currentTick = useMemo(() => {
    return ticks[selectedSymbol];
  }, [ticks, selectedSymbol]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchMt5Data(),
      fetchCandlesAndOrderBook(selectedSymbol, selectedTimeframe),
    ]);
  }, [fetchMt5Data, fetchCandlesAndOrderBook, selectedSymbol, selectedTimeframe]);

  const value = useMemo(
    () => ({
      selectedSymbol,
      setSelectedSymbol,
      selectedTimeframe,
      setSelectedTimeframe,
      ticks,
      currentTick,
      positions,
      account,
      floatingProfit,
      isMt5Connected,
      lastUpdated,
      status,
      feedQuality,
      feedSource,
      isMarketOpen: marketOpenInfo.isOpen,
      marketState: marketOpenInfo.state,
      marketStatusText: marketOpenInfo.label,
      marketOpensAt: marketOpenInfo.opensAt,
      candles,
      candlesStatus,
      orderBook,
      refresh,
      getTick,
    }),
    [
      selectedSymbol,
      selectedTimeframe,
      ticks,
      currentTick,
      positions,
      account,
      floatingProfit,
      isMt5Connected,
      lastUpdated,
      status,
      feedQuality,
      feedSource,
      marketOpenInfo,
      candles,
      candlesStatus,
      orderBook,
      refresh,
      getTick,
    ]
  );

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
};

export const useMarketData = (): MarketDataContextType => {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a <MarketDataProvider>');
  }
  return context;
};

export const useLiveTick = (symbol: string): LiveTick | undefined => {
  const { ticks } = useMarketData();
  return ticks[symbol];
};

export const useMarketTicks = (): Record<string, LiveTick> => {
  const { ticks } = useMarketData();
  return ticks;
};

export const useLiveCandles = (): { candles: Candle[]; status: CandleFeedStatus } => {
  const { candles, candlesStatus } = useMarketData();
  return { candles, status: candlesStatus };
};

export const useAccountStatus = (): MarketAccountData => {
  const { account } = useMarketData();
  return account;
};

export const useOpenPositions = (): Mt5Position[] => {
  const { positions } = useMarketData();
  return positions;
};
