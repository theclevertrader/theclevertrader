// =====================================================================
// THE CLEVER TRADER — FRED (FEDERAL RESERVE BANK OF ST. LOUIS) ADAPTER
// Real-Time Macro Indicators: 10Y/2Y Yields, Yield Curve, Fed Funds & M2
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface FredObservation {
  date: string;
  value: number;
}

export interface FredSeriesResult {
  seriesId: string;
  title?: string;
  units?: string;
  latestDate: string;
  latestValue: number;
  observations: FredObservation[];
}

export function getFredApiKey(): string {
  return process.env.FRED_API_KEY || '';
}

/**
 * Fetch latest observations for any FRED series ID
 * (e.g. DGS10, DGS2, T10Y2Y, FEDFUNDS, CPIAUCSL)
 */
export async function fetchFredSeries(
  seriesId: string,
  limit: number = 10
): Promise<FredSeriesResult | null> {
  const apiKey = getFredApiKey();
  if (!apiKey) return null;

  const cacheKey = `fred:${seriesId}:${limit}`;
  const cached = cache.get(cacheKey);

  // 10 minutes cache
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached.data;
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      console.warn(`[FRED] Request failed for ${seriesId} (HTTP ${res.status})`);
      return null;
    }

    const data = await res.json();
    const obsList = data.observations || [];
    const validObs: FredObservation[] = [];

    for (const item of obsList) {
      const val = parseFloat(item.value);
      if (!isNaN(val)) {
        validObs.push({
          date: item.date,
          value: val,
        });
      }
    }

    if (validObs.length === 0) return null;

    const result: FredSeriesResult = {
      seriesId,
      latestDate: validObs[0].date,
      latestValue: validObs[0].value,
      observations: validObs,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn(`[FRED] Error fetching series ${seriesId}:`, err);
    return null;
  }
}

/**
 * Fetch macro dashboard snapshot: 10Y Yield, 2Y Yield, Yield Curve Spread, Fed Funds Rate
 */
export async function fetchFredMacroSnapshot(): Promise<{
  us10Y: number | null;
  us2Y: number | null;
  yieldSpread: number | null;
  fedFundsRate: number | null;
  lastUpdated: string;
}> {
  const [s10y, s2y, spread, fedFunds] = await Promise.all([
    fetchFredSeries('DGS10', 1),
    fetchFredSeries('DGS2', 1),
    fetchFredSeries('T10Y2Y', 1),
    fetchFredSeries('FEDFUNDS', 1),
  ]);

  return {
    us10Y: s10y?.latestValue ?? null,
    us2Y: s2y?.latestValue ?? null,
    yieldSpread: spread?.latestValue ?? null,
    fedFundsRate: fedFunds?.latestValue ?? null,
    lastUpdated: s10y?.latestDate || new Date().toISOString().split('T')[0],
  };
}
