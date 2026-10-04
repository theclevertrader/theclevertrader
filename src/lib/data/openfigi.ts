// =====================================================================
// THE CLEVER TRADER — BLOOMBERG OPENFIGI INSTITUTIONAL IDENTIFIER ADAPTER
// Global Financial Instrument Identifier & Cross-Exchange Mapping Engine
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface OpenFigiQuery {
  idType: 'TICKER' | 'ID_ISIN' | 'ID_CUSIP' | 'ID_SEDOL' | 'BASE_TICKER';
  idValue: string;
  exchCode?: string;
  currency?: string;
  marketSecDes?: string;
}

export interface OpenFigiInstrument {
  figi: string;
  name: string;
  ticker: string;
  exchCode: string | null;
  compositeFIGI: string | null;
  securityType: string;
  marketSector: string;
  shareClassFIGI?: string | null;
  securityType2?: string | null;
  securityDescription?: string | null;
}

export function getOpenFigiApiKey(): string {
  return process.env.OPENFIGI_API_KEY || '';
}

/**
 * Maps a list of instrument queries to OpenFIGI instruments
 */
export async function mapOpenFigi(
  queries: OpenFigiQuery[]
): Promise<Array<{ data?: OpenFigiInstrument[]; error?: string }>> {
  const apiKey = getOpenFigiApiKey();
  if (!apiKey || queries.length === 0) return [];

  const cacheKey = `figi:${JSON.stringify(queries)}`;
  const cached = cache.get(cacheKey);

  // 10 minutes cache for static identifiers
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached.data;
  }

  try {
    const res = await fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OPENFIGI-KEY': apiKey,
      },
      body: JSON.stringify(queries),
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      console.warn(`[OpenFIGI] Request failed (HTTP ${res.status})`);
      return [];
    }

    const data = await res.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.warn('[OpenFIGI] Error mapping instruments:', err);
    return [];
  }
}

/**
 * Convenience method to resolve a single ticker
 */
export async function resolveTickerFigi(
  ticker: string,
  exchCode?: string
): Promise<OpenFigiInstrument | null> {
  const query: OpenFigiQuery = {
    idType: 'TICKER',
    idValue: ticker.toUpperCase(),
    ...(exchCode ? { exchCode } : {}),
  };

  const results = await mapOpenFigi([query]);
  if (results && results[0]?.data && results[0].data.length > 0) {
    return results[0].data[0];
  }
  return null;
}
