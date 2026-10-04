import { EconomicEvent, ImpactLevel } from '../engines/fundamental-engine';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedEvents: CacheEntry<EconomicEvent[]> | null = null;

export function getCachedEconomicEvents(): EconomicEvent[] | null {
  return cachedEvents?.data || null;
}

export async function fetchLiveEconomicCalendar(): Promise<EconomicEvent[] | null> {
  if (cachedEvents && Date.now() - cachedEvents.timestamp < 180000) {
    return cachedEvents.data;
  }

  try {
    const urls = [
      'https://biquote.io/api/calendar?countries=US&limit=100',
      'https://biquote.io/api/calendar?countries=EU&limit=50',
      'https://biquote.io/api/calendar?countries=GB&limit=50',
    ];

    const responses = await Promise.allSettled(
      urls.map(u => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 800);
        return fetch(u, { signal: controller.signal, next: { revalidate: 180 } })
          .then(r => {
            clearTimeout(tid);
            return r.json();
          })
          .catch(() => {
            clearTimeout(tid);
            return null;
          });
      })
    );

    const rawEvents: any[] = [];
    for (const res of responses) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        rawEvents.push(...res.value);
      }
    }

    if (rawEvents.length === 0) return null;

    const now = Date.now();

    const formatted: EconomicEvent[] = rawEvents
      .filter((item: any) => item && item.name && item.time)
      .map((item: any) => {
        const timestamp = new Date(item.time).getTime();
        const minutesUntil = Math.round((timestamp - now) / 60000);
        const isPassed = minutesUntil < 0;
        const noTradeLock = minutesUntil >= -5 && minutesUntil <= 30 && item.importance === 'high';

        const impactMap: Record<string, ImpactLevel> = {
          high: 'HIGH',
          medium: 'MEDIUM',
          low: 'LOW',
        };
        const impact: ImpactLevel = impactMap[item.importance?.toLowerCase()] || 'MEDIUM';

        const countryMap: Record<string, string> = {
          US: 'United States',
          EU: 'European Union',
          GB: 'United Kingdom',
          JP: 'Japan',
          AU: 'Australia',
          CA: 'Canada',
        };

        const dateObj = new Date(item.time);
        const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        let romanUrdu = `${item.name} (${item.currency}) release expected. `;
        if (item.forecast !== null && item.forecast !== undefined) {
          romanUrdu += `Forecast: ${item.forecast}${item.unit ? ' ' + item.unit : ''}. `;
        }
        if (item.previous !== null && item.previous !== undefined) {
          romanUrdu += `Previous: ${item.previous}${item.unit ? ' ' + item.unit : ''}. `;
        }
        if (noTradeLock) {
          romanUrdu += '⚠️ High Impact Event! Spread expansion risk — No-Trade Lock ACTIVE.';
        } else {
          romanUrdu += 'Normal market liquidity conditions.';
        }

        return {
          id: String(item.id || item.eventId || Math.random()),
          timestamp,
          timeString,
          currency: item.currency || 'USD',
          country: countryMap[item.countryCode] || item.countryCode || 'Global',
          countryCode: item.countryCode || 'US',
          event: item.name,
          impact,
          actual: item.actual !== null && item.actual !== undefined ? String(item.actual) : undefined,
          forecast: item.forecast !== null && item.forecast !== undefined ? String(item.forecast) : 'N/A',
          previous: item.previous !== null && item.previous !== undefined ? String(item.previous) : 'N/A',
          unit: item.unit || '',
          isPassed,
          minutesUntil,
          noTradeLock,
          romanUrduAnalysis: romanUrdu,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    cachedEvents = { data: formatted, timestamp: Date.now() };
    return formatted;
  } catch (err) {
    console.error('Biquote live calendar fetch error:', err);
    return null;
  }
}
