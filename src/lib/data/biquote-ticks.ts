export interface BiquoteTick {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  high: number;
  low: number;
  spread: number;
  dayDiffPercent: number;
  direction: string;
  source: string;
  marketState: string;
  stale?: boolean;
  quoteAgeSeconds?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedTicks: CacheEntry<Record<string, BiquoteTick>> | null = null;

/**
 * Fetch live ticks from Biquote MT5 feed (5-second cache)
 */
export async function fetchBiquoteTicks(
  symbols: string[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'US500', 'US30', 'USOIL']
): Promise<Record<string, BiquoteTick> | null> {
  if (cachedTicks && Date.now() - cachedTicks.timestamp < 5000) {
    return cachedTicks.data;
  }

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 800);

  try {
    const query = symbols.map(s => `symbols=${encodeURIComponent(s)}`).join('&');
    const url = `https://biquote.io/api/latest?${query}`;

    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 5 } });
    clearTimeout(tid);
    if (!res.ok) return cachedTicks?.data || null;

    const data = await res.json();
    if (!data || typeof data !== 'object') return cachedTicks?.data || null;

    const parsed: Record<string, BiquoteTick> = {};
    for (const [sym, t] of Object.entries<any>(data)) {
      if (t && (t.mid || t.bid)) {
        parsed[sym] = {
          symbol: t.symbol || sym,
          bid: Number(t.bid || 0),
          ask: Number(t.ask || 0),
          mid: Number(t.mid || t.bid || 0),
          high: Number(t.high || 0),
          low: Number(t.low || 0),
          spread: Number(t.spread || 0),
          dayDiffPercent: Number(t.dayDiffPercent || 0),
          direction: t.direction || 'NEUTRAL',
          source: t.source || 'MetaTrader 5',
          marketState: t.marketState || 'open',
          stale: Boolean(t.stale),
          quoteAgeSeconds: Number(t.quoteAgeSeconds || 0),
        };
      }
    }

    cachedTicks = { data: parsed, timestamp: Date.now() };
    return parsed;
  } catch (err) {
    clearTimeout(tid);
    return cachedTicks?.data || null;
  }
}
