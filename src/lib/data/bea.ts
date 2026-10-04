interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface BeaMacroSnapshot {
  realGdpGrowthAnnualPercent: number;
  timePeriod: string;
  metricName: string;
  source: string;
}

/**
 * Fetch official US Real GDP Growth from Bureau of Economic Analysis (NIPA Table T10101)
 * Caches for 4 hours
 */
export async function fetchBeaGdpSnapshot(apiKey?: string): Promise<BeaMacroSnapshot | null> {
  const key = apiKey || process.env.BEA_API_KEY;
  if (!key) return null;

  const cacheKey = 'bea:real_gdp';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 14400000) {
    return cached.data;
  }

  try {
    const currentYear = new Date().getFullYear();
    const years = `${currentYear - 1},${currentYear}`;
    const url = `https://apps.bea.gov/api/data?UserID=${encodeURIComponent(key)}&method=GetData&datasetname=NIPA&TableName=T10101&Frequency=Q&Year=${years}&ResultFormat=JSON`;

    const res = await fetch(url, { next: { revalidate: 14400 } });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json?.BEAAPI?.Results?.Data;
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const gdpRecords = data.filter((x: any) => x.LineDescription === 'Gross domestic product');
    if (gdpRecords.length === 0) return null;

    const latest = gdpRecords[gdpRecords.length - 1];
    const snapshot: BeaMacroSnapshot = {
      realGdpGrowthAnnualPercent: parseFloat(latest.DataValue),
      timePeriod: latest.TimePeriod,
      metricName: latest.LineDescription,
      source: 'BEA NIPA Table T10101',
    };

    cache.set(cacheKey, { data: snapshot, timestamp: Date.now() });
    return snapshot;
  } catch (err) {
    console.error('BEA GDP fetch error:', err);
    return null;
  }
}
