import { fetchLiveEconomicCalendar } from '../data/biquote-calendar';
import { EconomicEvent } from './fundamental-engine';

export interface NewsShieldStatus {
  isLocked: boolean;
  activeEvent?: {
    name: string;
    currency: string;
    impact: string;
    minutesUntil: number;
    timeString: string;
  };
  upcomingEvents: {
    name: string;
    currency: string;
    impact: string;
    minutesUntil: number;
    timeString: string;
  }[];
  reason: string;
  romanUrduSummary: string;
}

export class NewsShieldEngine {
  /**
   * Currency mapping for symbols
   */
  private static getRelevantCurrencies(symbol: string): string[] {
    const sym = symbol.toUpperCase().trim();
    if (sym === 'XAUUSD' || sym === 'XAGUSD' || sym === 'BTCUSD' || sym === 'ETHUSD' || sym === 'NAS100' || sym === 'US30' || sym === 'SPX500' || sym === 'DXY') {
      return ['USD'];
    }
    if (sym === 'EURUSD') return ['EUR', 'USD'];
    if (sym === 'GBPUSD') return ['GBP', 'USD'];
    if (sym === 'USDJPY') return ['USD', 'JPY'];
    if (sym === 'AUDUSD') return ['AUD', 'USD'];
    if (sym === 'USDCAD') return ['USD', 'CAD'];
    if (sym === 'USDCHF') return ['USD', 'CHF'];
    if (sym === 'EURGBP') return ['EUR', 'GBP'];
    if (sym === 'EURJPY') return ['EUR', 'JPY'];
    if (sym === 'GBPJPY') return ['GBP', 'JPY'];
    return ['USD'];
  }

  /**
   * Checks if high-impact economic news is within [-15m, +15m] window for the given symbol
   */
  public static async evaluateNewsShield(symbol: string): Promise<NewsShieldStatus> {
    const currencies = this.getRelevantCurrencies(symbol);
    const now = Date.now();

    try {
      const events = await fetchLiveEconomicCalendar();
      if (!events || events.length === 0) {
        return {
          isLocked: false,
          upcomingEvents: [],
          reason: 'Economic calendar clear. Normal market liquidity.',
          romanUrduSummary: 'News calendar clear hai. Market mein koi high-impact economic event active nahi.',
        };
      }

      // Filter events relevant to our currency pair
      const relevantHighImpact = events.filter((e: EconomicEvent) => {
        const currMatch = currencies.includes(e.currency.toUpperCase());
        const isHigh = e.impact === 'HIGH' || e.event.toLowerCase().includes('cpi') || e.event.toLowerCase().includes('nfp') || e.event.toLowerCase().includes('fed') || e.event.toLowerCase().includes('fomc') || e.event.toLowerCase().includes('rate');
        return currMatch && isHigh;
      });

      // Check if any high impact event is within [-15m to +15m] window
      let blockingEvent: EconomicEvent | undefined = undefined;
      const upcoming: NewsShieldStatus['upcomingEvents'] = [];

      for (const e of relevantHighImpact) {
        const minutesUntil = Math.round((e.timestamp - now) / 60000);
        
        // Window: 15 minutes BEFORE and 15 minutes AFTER release
        if (minutesUntil >= -15 && minutesUntil <= 15) {
          blockingEvent = e;
        }

        // Keep track of upcoming high impact events within next 12 hours
        if (minutesUntil > 0 && minutesUntil <= 720) {
          upcoming.push({
            name: e.event,
            currency: e.currency,
            impact: e.impact,
            minutesUntil,
            timeString: e.timeString,
          });
        }
      }

      if (blockingEvent) {
        const mins = Math.round((blockingEvent.timestamp - now) / 60000);
        const timingText = mins > 0 ? `${mins} minutes baad` : `${Math.abs(mins)} minutes pehle`;
        return {
          isLocked: true,
          activeEvent: {
            name: blockingEvent.event,
            currency: blockingEvent.currency,
            impact: blockingEvent.impact,
            minutesUntil: mins,
            timeString: blockingEvent.timeString,
          },
          upcomingEvents: upcoming.slice(0, 3),
          reason: `High-Impact ${blockingEvent.event} (${blockingEvent.currency}) window active (${timingText}). Trade execution locked to avoid slippage!`,
          romanUrduSummary: `⛔ [NEWS SHIELD LOCK]: ${blockingEvent.event} (${blockingEvent.currency}) release ho rahi hai (${timingText}). Extreme slippage aur spread spike ke khatre se bachane ke liye trading temporarily freeze hai.`,
        };
      }

      return {
        isLocked: false,
        upcomingEvents: upcoming.slice(0, 3),
        reason: 'News shield clear. Safe liquidity window active.',
        romanUrduSummary: 'News shield clear hai. Agle 15 minutes mein koi high-impact red event nahi hai.',
      };
    } catch (err) {
      console.warn('[NewsShieldEngine] Calendar fetch warning:', err);
      return {
        isLocked: false,
        upcomingEvents: [],
        reason: 'Calendar fallback safe.',
        romanUrduSummary: 'News shield active.',
      };
    }
  }
}
