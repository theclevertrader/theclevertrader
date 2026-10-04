import { Candle } from '../types/trading';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function mapSymbolToTwelveData(symbol: string): string {
  const s = symbol.toUpperCase().trim();
  const map: Record<string, string> = {
    XAUUSD: 'XAU/USD',
    EURUSD: 'EUR/USD',
    GBPUSD: 'GBP/USD',
    USDJPY: 'USD/JPY',
    BTCUSD: 'BTC/USD',
    ETHUSD: 'ETH/USD',
    US30: 'DJI',
    NAS100: 'IXIC',
    SPX500: 'SPX',
  };
  return map[s] || (s.length === 6 ? `${s.slice(0, 3)}/${s.slice(3)}` : s);
}

export function mapTimeframeToInterval(tfMinutes: number): string {
  if (tfMinutes <= 1) return '1min';
  if (tfMinutes <= 5) return '5min';
  if (tfMinutes <= 15) return '15min';
  if (tfMinutes <= 30) return '30min';
  if (tfMinutes <= 60) return '1h';
  if (tfMinutes <= 240) return '4h';
  return '1day';
}

export interface TwelveDataQuote {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  percentChange: number;
  isMarketOpen: boolean;
  timestamp: number;
}

export async function fetchTwelveDataQuote(
  rawSymbol: string,
  apiKey?: string
): Promise<TwelveDataQuote | null> {
  const key = apiKey || process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;

  const symbol = mapSymbolToTwelveData(rawSymbol);
  const cacheKey = `quote:${symbol}`;
  const cached = cache.get(cacheKey);

  // Cache quotes for 45 seconds to respect Twelve Data free limits (8 req/min)
  if (cached && Date.now() - cached.timestamp < 45000) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 45 } });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Negative cache for 30s to avoid pounding rate-limited endpoint
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    const data = await res.json();
    if (data.status === 'error' || data.code || !data.close) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    const quote: TwelveDataQuote = {
      symbol: rawSymbol,
      name: data.name || symbol,
      price: parseFloat(data.close),
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      previousClose: parseFloat(data.previous_close || data.close),
      change: parseFloat(data.change || '0'),
      percentChange: parseFloat(data.percent_change || '0'),
      isMarketOpen: !!data.is_market_open,
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
    };

    cache.set(cacheKey, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (err) {
    clearTimeout(timeoutId);
    // Negative cache on timeout/abort
    cache.set(cacheKey, { data: null, timestamp: Date.now() });
    return null;
  }
}

export async function fetchTwelveDataCandles(
  rawSymbol: string,
  timeframeMinutes: number = 15,
  count: number = 50,
  apiKey?: string
): Promise<Candle[] | null> {
  const key = apiKey || process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;

  const symbol = mapSymbolToTwelveData(rawSymbol);
  const interval = mapTimeframeToInterval(timeframeMinutes);
  const cacheKey = `candles:${symbol}:${interval}:${count}`;
  const cached = cache.get(cacheKey);

  // Cache candles for 90 seconds to prevent rate-limit exhaustion
  if (cached && Date.now() - cached.timestamp < 90000) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${count}&apikey=${key}`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 90 } });
    clearTimeout(timeoutId);

    if (!res.ok) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    const data = await res.json();
    if (data.status === 'error' || !Array.isArray(data.values) || data.values.length === 0) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    const now = Date.now();
    // Twelve Data returns descending (newest first). Reverse to ascending (oldest first).
    const parsedBars: Candle[] = [];
    for (let i = data.values.length - 1; i >= 0; i--) {
      const bar = data.values[i];
      const dtStr = String(bar.datetime || '');
      const utcStr = dtStr.includes('Z') || dtStr.includes('+') ? dtStr : `${dtStr.replace(' ', 'T')}Z`;
      const time = new Date(utcStr).getTime();
      const open = parseFloat(bar.open);
      const high = parseFloat(bar.high);
      const low = parseFloat(bar.low);
      const close = parseFloat(bar.close);
      const volume = bar.volume ? parseFloat(bar.volume) : 100;

      // Reject invalid or future timestamps (Twelve Data weekend forward glitch)
      if (isNaN(time) || time <= 0 || time > now + 60_000) continue;
      if (isNaN(open) || isNaN(close) || open <= 0 || close <= 0) continue;

      parsedBars.push({
        time,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume,
      });
    }

    if (parsedBars.length < 5) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    // Check for flat synthetic bars (all opens identical or price range zero)
    const firstOpen = parsedBars[0].open;
    const isFlat = parsedBars.every(c => Math.abs(c.open - firstOpen) < 0.0001);
    if (isFlat) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    cache.set(cacheKey, { data: parsedBars, timestamp: Date.now() });
    return parsedBars;
  } catch (err) {
    clearTimeout(timeoutId);
    cache.set(cacheKey, { data: null, timestamp: Date.now() });
    return null;
  }
}
