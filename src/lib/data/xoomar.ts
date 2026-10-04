interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface XoomarCotItem {
  slug: string;
  name: string;
  group: string;
  reportDate: string;
  openInterest: number;
  levFundLong: number;
  levFundShort: number;
  netLevFund: number;
}

export interface XoomarLiquidations {
  period: string;
  totalUsd: number;
  longUsd: number;
  shortUsd: number;
}

/**
 * Fetch live CFTC COT positioning from Xoomar API
 */
export async function fetchXoomarCot(apiKey?: string): Promise<XoomarCotItem[] | null> {
  const key = apiKey || process.env.XOOMAR_API_KEY;
  if (!key) return null;

  const cacheKey = 'xoomar:cot';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }

  try {
    const res = await fetch('https://xoomar.com/api/markets/cot', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'x-api-key': key,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json?.data)) return null;

    const items: XoomarCotItem[] = json.data.map((x: any) => ({
      slug: x.slug,
      name: x.name,
      group: x.group,
      reportDate: x.reportDate,
      openInterest: x.openInterest || 0,
      levFundLong: x.levFundLong || 0,
      levFundShort: x.levFundShort || 0,
      netLevFund: (x.levFundLong || 0) - (x.levFundShort || 0),
    }));

    cache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  } catch (err) {
    console.error('Xoomar COT error:', err);
    return null;
  }
}

/**
 * Fetch live 24h market liquidation streams from Xoomar API
 */
export async function fetchXoomarLiquidations(apiKey?: string): Promise<XoomarLiquidations | null> {
  const key = apiKey || process.env.XOOMAR_API_KEY;
  if (!key) return null;

  const cacheKey = 'xoomar:liquidations';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  try {
    const res = await fetch('https://xoomar.com/api/markets/liquidations', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'x-api-key': key,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data) return null;

    const result: XoomarLiquidations = {
      period: data.period || '24h',
      totalUsd: data.totalUsd || 0,
      longUsd: data.longUsd || 0,
      shortUsd: data.shortUsd || 0,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error('Xoomar Liquidations error:', err);
    return null;
  }
}

/**
 * Fetch live Institutional Whale positions from Xoomar API
 */
export async function fetchXoomarWhales(apiKey?: string): Promise<any[] | null> {
  const key = apiKey || process.env.XOOMAR_API_KEY;
  if (!key) return null;

  const cacheKey = 'xoomar:whales';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 120000) {
    return cached.data;
  }

  try {
    const res = await fetch('https://xoomar.com/api/markets/whales', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'x-api-key': key,
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const positions = json?.data?.positions;
    if (!Array.isArray(positions)) return null;

    cache.set(cacheKey, { data: positions, timestamp: Date.now() });
    return positions;
  } catch (err) {
    console.error('Xoomar Whales error:', err);
    return null;
  }
}
