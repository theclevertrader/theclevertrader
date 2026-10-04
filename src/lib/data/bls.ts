interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export interface BlsEconomicRelease {
  seriesId: string;
  seriesName: string;
  period: string;
  year: string;
  value: number;
}

export interface BlsMacroSnapshot {
  cpiIndex: number;
  unemploymentRate: number;
  nonFarmPayrollTotalK: number;
  lastUpdated: string;
}

export async function fetchBlsMacroSnapshot(apiKey?: string): Promise<BlsMacroSnapshot | null> {
  const key = apiKey || process.env.BLS_API_KEY;
  const cacheKey = 'bls:macro_snapshot';
  const cached = cache.get(cacheKey);

  // Cache for 1 hour (3600 seconds)
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }

  try {
    const currentYear = new Date().getFullYear().toString();
    const prevYear = (new Date().getFullYear() - 1).toString();

    const bodyObj: any = {
      seriesid: ['CUUR0000SA0', 'LNS14000000', 'CES0000000001'],
      startyear: prevYear,
      endyear: currentYear,
    };
    if (key) {
      bodyObj.registrationkey = key;
    }

    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 'REQUEST_SUCCEEDED' || !json.Results?.series) {
      return null;
    }

    let cpiIndex = 324.0;
    let unemploymentRate = 4.4;
    let nonFarmPayrollTotalK = 158400;
    let lastPeriod = 'Latest';

    for (const series of json.Results.series) {
      const latest = series.data?.[0];
      if (!latest) continue;

      lastPeriod = `${latest.periodName} ${latest.year}`;
      const numVal = parseFloat(latest.value);

      if (series.seriesID === 'CUUR0000SA0') {
        cpiIndex = numVal;
      } else if (series.seriesID === 'LNS14000000') {
        unemploymentRate = numVal;
      } else if (series.seriesID === 'CES0000000001') {
        nonFarmPayrollTotalK = numVal;
      }
    }

    const snapshot: BlsMacroSnapshot = {
      cpiIndex,
      unemploymentRate,
      nonFarmPayrollTotalK,
      lastUpdated: lastPeriod,
    };

    cache.set(cacheKey, { data: snapshot, timestamp: Date.now() });
    return snapshot;
  } catch (err) {
    console.error('BLS Macro snapshot error:', err);
    return null;
  }
}
