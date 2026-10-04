// =====================================================================
// THE CLEVER TRADER — MASSIVE.COM (POLYGON.IO) INSTITUTIONAL DATA ADAPTER
// Real-Time High-Speed Forex, Metals (XAUUSD), Crypto & Equities Quotes
// =====================================================================

import { Candle } from '../types/trading';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface MassiveQuote {
  symbol: string;
  ticker: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  timestamp: number;
}

export function getMassiveApiKey(): string {
  return (
    process.env.MASSIVE_API_KEY ||
    process.env.POLYGON_API_KEY ||
    'iM5mU9NjxCxGzOBeyuCSz93QjRxuizqq'
  );
}

/**
 * Maps standard symbol to Massive.com (Polygon.io) ticker format
 */
export function toMassiveTicker(symbol: string): string {
  const sym = symbol.toUpperCase().replace('/', '');
  if (sym === 'XAUUSD' || sym === 'GOLD') return 'C:XAUUSD';
  if (sym === 'BTCUSD' || sym === 'BTCUSDT') return 'X:BTCUSD';
  if (sym.length === 6 && !sym.includes(':')) {
    return `C:${sym}`; // Forex currency pair (e.g. C:EURUSD)
  }
  return sym;
}

/**
 * Fetch latest aggregated bar from Massive.com (Polygon.io)
 */
export async function fetchMassivePrevClose(symbol: string): Promise<MassiveQuote | null> {
  const apiKey = getMassiveApiKey();
  if (!apiKey) return null;

  const ticker = toMassiveTicker(symbol);
  const cacheKey = `massive:prev:${ticker}`;
  const cached = cache.get(cacheKey);

  // 30 seconds cache
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }

  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?apiKey=${apiKey}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const r = data.results[0];
    const quote: MassiveQuote = {
      symbol: symbol.toUpperCase(),
      ticker,
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      vwap: r.vw,
      timestamp: r.t || Date.now(),
    };

    cache.set(cacheKey, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (err) {
    console.warn(`[Massive] Error fetching prev close for ${ticker}:`, err);
    return null;
  }
}

/**
 * Fetch historical/intraday candles from Massive.com (Polygon.io)
 */
export async function fetchMassiveCandles(
  symbol: string,
  multiplier: number = 15,
  timespan: 'minute' | 'hour' | 'day' = 'minute',
  limit: number = 50
): Promise<Candle[]> {
  const apiKey = getMassiveApiKey();
  if (!apiKey) return [];

  const ticker = toMassiveTicker(symbol);
  const cacheKey = `massive:candles:${ticker}:${multiplier}:${timespan}:${limit}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }

  try {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const from = fromDate.toISOString().split('T')[0];

    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=desc&limit=${limit}&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== 'OK' || !Array.isArray(data.results)) {
      return [];
    }

    const candles: Candle[] = data.results
      .map((bar: any) => ({
        time: bar.t,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))
      .reverse(); // Chronological order

    cache.set(cacheKey, { data: candles, timestamp: Date.now() });
    return candles;
  } catch (err) {
    console.warn(`[Massive] Error fetching candles for ${ticker}:`, err);
    return [];
  }
}
