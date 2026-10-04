interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface AlphaVantageFxRate {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  bidPrice: number;
  askPrice: number;
  lastRefreshed: string;
}

export interface AlphaVantageRsiResult {
  symbol: string;
  rsi: number;
  lastRefreshed: string;
}

/**
 * Fetch real-time FX exchange rate from Alpha Vantage with 60s cache
 */
export async function fetchAlphaVantageFxRate(
  fromCurrency: string,
  toCurrency: string,
  apiKey?: string
): Promise<AlphaVantageFxRate | null> {
  const key = apiKey || process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;

  const pairKey = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  const cacheKey = `fx:${pairKey}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(fromCurrency)}&to_currency=${encodeURIComponent(toCurrency)}&apikey=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000), next: { revalidate: 60 } });
    if (!res.ok) return null;

    const data = await res.json();
    const rateObj = data['Realtime Currency Exchange Rate'];
    if (!rateObj) return null;

    const result: AlphaVantageFxRate = {
      fromCurrency: rateObj['1. From_Currency Code'],
      toCurrency: rateObj['3. To_Currency Code'],
      exchangeRate: parseFloat(rateObj['5. Exchange Rate']),
      bidPrice: parseFloat(rateObj['8. Bid Price'] || rateObj['5. Exchange Rate']),
      askPrice: parseFloat(rateObj['9. Ask Price'] || rateObj['5. Exchange Rate']),
      lastRefreshed: rateObj['6. Last Refreshed'],
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error(`Alpha Vantage FX error for ${pairKey}:`, err);
    return null;
  }
}

/**
 * Fetch Cloud RSI from Alpha Vantage with 300s cache
 */
export async function fetchAlphaVantageRsi(
  symbol: string,
  interval: string = '15min',
  timePeriod: number = 14,
  apiKey?: string
): Promise<AlphaVantageRsiResult | null> {
  const key = apiKey || process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;

  const cacheKey = `rsi:${symbol}:${interval}:${timePeriod}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=RSI&symbol=${encodeURIComponent(symbol)}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000), next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    const technicalData = data['Technical Analysis: RSI'];
    if (!technicalData) return null;

    const dates = Object.keys(technicalData);
    if (dates.length === 0) return null;

    const latestDate = dates[0];
    const latestRsi = parseFloat(technicalData[latestDate]?.RSI);

    const result: AlphaVantageRsiResult = {
      symbol,
      rsi: latestRsi,
      lastRefreshed: latestDate,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error(`Alpha Vantage RSI error for ${symbol}:`, err);
    return null;
  }
}
