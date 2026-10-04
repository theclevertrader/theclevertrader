// =====================================================================
// THE CLEVER TRADER — FINANCIAL MODELING PREP (FMP) INSTITUTIONAL ADAPTER
// Real-Time Forex & Market Quotes with Header-based API Authentication
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface FmpQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercentage: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  timestamp: number;
}

/**
 * Gets the active FMP API Key from environment or default configuration
 */
export function getFmpApiKey(): string {
  return (
    process.env.FMP_API_KEY ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY ||
    'EohKxoX2LOQSaUlE9IIyN8ByrufAlkfR'
  );
}

/**
 * Fetch real-time quote from Financial Modeling Prep (FMP)
 * Requires header: { 'apikey': '<KEY>' }
 */
export async function fetchFmpQuote(symbol: string): Promise<FmpQuote | null> {
  const apiKey = getFmpApiKey();
  if (!apiKey) return null;

  const sym = symbol.toUpperCase().replace('/', '');
  const cacheKey = `fmp:quote:${sym}`;
  const cached = cache.get(cacheKey);

  // 15 seconds in-memory cache
  if (cached && Date.now() - cached.timestamp < 15000) {
    return cached.data;
  }

  try {
    const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(sym)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      console.warn(`[FMP] Request failed for ${sym} (HTTP ${res.status})`);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0];
    if (typeof item.price !== 'number') {
      return null;
    }

    const quote: FmpQuote = {
      symbol: item.symbol || sym,
      name: item.name || sym,
      price: item.price,
      change: item.change ?? 0,
      changePercentage: item.changePercentage ?? 0,
      dayHigh: item.dayHigh,
      dayLow: item.dayLow,
      volume: item.volume,
      timestamp: Date.now(),
    };

    cache.set(cacheKey, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (error) {
    console.warn(`[FMP] Error fetching quote for ${sym}:`, error);
    return null;
  }
}

/**
 * Batch fetch multiple quotes from FMP
 */
export async function fetchFmpBatchQuotes(symbols: string[]): Promise<Record<string, FmpQuote>> {
  const results: Record<string, FmpQuote> = {};
  await Promise.all(
    symbols.map(async (s) => {
      const q = await fetchFmpQuote(s);
      if (q) results[s.toUpperCase()] = q;
    })
  );
  return results;
}
