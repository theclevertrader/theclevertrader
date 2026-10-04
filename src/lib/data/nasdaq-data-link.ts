// =====================================================================
// THE CLEVER TRADER — NASDAQ DATA LINK (QUANDL) INSTITUTIONAL ADAPTER
// CFTC Commitments of Traders (COT), Macro Fundamentals & Futures Data
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface NasdaqDatasetResult {
  datasetCode: string;
  databaseCode: string;
  name: string;
  description: string;
  newestAvailableDate: string;
  columnNames: string[];
  data: any[][];
}

export function getNasdaqDataLinkApiKey(): string {
  return (
    process.env.NASDAQ_DATA_LINK_API_KEY ||
    process.env.QUANDL_API_KEY ||
    '_ezbRs-iopdqFYtdrC_s'
  );
}

/**
 * Fetch dataset timeseries from Nasdaq Data Link
 */
export async function fetchNasdaqDataset(
  databaseCode: string,
  datasetCode: string,
  limit: number = 5
): Promise<NasdaqDatasetResult | null> {
  const apiKey = getNasdaqDataLinkApiKey();
  if (!apiKey) return null;

  const key = `${databaseCode}/${datasetCode}`;
  const cacheKey = `nasdaq:${key}:${limit}`;
  const cached = cache.get(cacheKey);

  // 15 minutes cache for macro / COT reports
  if (cached && Date.now() - cached.timestamp < 900000) {
    return cached.data;
  }

  try {
    const url = `https://data.nasdaq.com/api/v3/datasets/${encodeURIComponent(databaseCode)}/${encodeURIComponent(datasetCode)}.json?api_key=${apiKey}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CleverTrader/2.0 (Institutional Algo)',
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      console.warn(`[NasdaqDataLink] Request failed for ${key} (HTTP ${res.status})`);
      return null;
    }

    const json = await res.json();
    const ds = json.dataset;
    if (!ds) return null;

    const result: NasdaqDatasetResult = {
      datasetCode: ds.dataset_code,
      databaseCode: ds.database_code,
      name: ds.name,
      description: ds.description,
      newestAvailableDate: ds.newest_available_date,
      columnNames: ds.column_names || [],
      data: ds.data || [],
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn(`[NasdaqDataLink] Error fetching dataset ${key}:`, err);
    return null;
  }
}
