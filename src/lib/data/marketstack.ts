// =====================================================================
// THE CLEVER TRADER — MARKETSTACK GLOBAL MARKET DATA ADAPTER
// Real-Time Global Tickers, Equities & Indices Feed
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface MarketstackTicker {
  symbol: string;
  name: string;
  hasIntraday: boolean;
  hasEod: boolean;
  country?: string;
  stockExchange?: {
    name: string;
    acronym: string;
    mic: string;
    country: string;
  };
}

export function getMarketstackApiKey(): string {
  return process.env.MARKETSTACK_API_KEY || '';
}

/**
 * Fetch latest end-of-day / real-time data for symbols from Marketstack
 */
export async function fetchMarketstackEod(symbols: string[]): Promise<any[]> {
  const apiKey = getMarketstackApiKey();
  if (!apiKey) return [];

  const symString = symbols.join(',').toUpperCase();
  const cacheKey = `marketstack:eod:${symString}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  try {
    const url = `https://api.marketstack.com/v1/eod/latest?access_key=${apiKey}&symbols=${encodeURIComponent(symString)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const data = await res.json();
    const results = data.data || [];
    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err) {
    console.warn(`[Marketstack] Error fetching EOD data:`, err);
    return [];
  }
}

/**
 * Fetch available tickers from Marketstack
 */
export async function fetchMarketstackTickers(limit: number = 10): Promise<MarketstackTicker[]> {
  const apiKey = getMarketstackApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://api.marketstack.com/v1/tickers?access_key=${apiKey}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.warn(`[Marketstack] Error fetching tickers:`, err);
    return [];
  }
}
