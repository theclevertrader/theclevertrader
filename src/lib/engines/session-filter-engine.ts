export type MarketSession = 
  | 'LONDON_OPEN' 
  | 'NEW_YORK_OPEN' 
  | 'LONDON_CLOSE' 
  | 'ASIAN_SESSION' 
  | 'BROKER_ROLLOVER' 
  | 'WEEKEND_CLOSED'
  | 'OFF_HOURS';

export interface SessionEvaluation {
  session: MarketSession;
  sessionName: string;
  isAllowedToTrade: boolean;
  isKillzone: boolean;
  isRollover: boolean;
  utcHour: number;
  utcMinute: number;
  utcTimeString: string;
  reason: string;
  romanUrduSummary: string;
}

export class SessionFilterEngine {
  /**
   * Checks if the market for a given symbol is currently OPEN or CLOSED.
   * - Crypto (BTC, ETH, etc.): Always OPEN (24/7/365).
   * - Forex, Metals, Indices, Oil: CLOSED on weekends (Friday 22:00 UTC - Sunday 21:00 UTC) and during broker rollover (21:50-22:25 UTC).
   */
  public static isMarketOpen(symbol: string, timestamp = Date.now()): {
    isOpen: boolean;
    state: 'OPEN' | 'WEEKEND_CLOSED' | 'ROLLOVER';
    label: string;
    opensAt?: string;
    reason: string;
  } {
    const sym = (symbol || 'XAUUSD').toUpperCase().trim();
    const date = new Date(timestamp);
    const utcDay = date.getUTCDay(); // 0 = Sun, 6 = Sat
    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();

    const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL');
    if (isCrypto) {
      return {
        isOpen: true,
        state: 'OPEN',
        label: '24/7 LIVE',
        reason: 'Crypto markets operate 24/7/365 globally.',
      };
    }

    // Weekend Closure: Friday 22:00 UTC to Sunday 21:00 UTC
    const isWeekend = utcDay === 6 || (utcDay === 0 && utcHour < 21) || (utcDay === 5 && utcHour >= 22);
    if (isWeekend) {
      return {
        isOpen: false,
        state: 'WEEKEND_CLOSED',
        label: 'WEEKEND CLOSED',
        opensAt: 'Sunday 21:00 UTC',
        reason: 'International Forex & Commodities markets are closed for the weekend (re-opens Sunday 21:00 UTC).',
      };
    }

    // Broker Rollover Window: 21:50 to 22:25 UTC
    const isRollover = (utcHour === 21 && utcMinute >= 50) || (utcHour === 22 && utcMinute <= 25);
    if (isRollover) {
      return {
        isOpen: false,
        state: 'ROLLOVER',
        label: 'DAILY ROLLOVER',
        opensAt: '22:25 UTC',
        reason: 'Daily swap rollover window active (21:50-22:25 UTC). Orders temporarily locked.',
      };
    }

    return {
      isOpen: true,
      state: 'OPEN',
      label: 'MARKET OPEN',
      reason: 'Regular market trading session is active.',
    };
  }

  /**
   * Evaluates current market session, ICT Killzone, and broker rollover window.
   */
  public static evaluateSession(symbol: string, timestamp = Date.now()): SessionEvaluation {
    const sym = symbol.toUpperCase().trim();
    const date = new Date(timestamp);
    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();
    const utcDay = date.getUTCDay(); // 0 = Sun, 6 = Sat
    const utcTimeString = `${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')} UTC`;

    const isCrypto = sym.includes('BTC') || sym.includes('ETH');

    // 0. Weekend Closure for Forex, Commodities & Indices (Saturday & Sunday until 21:00 UTC)
    const isWeekend = utcDay === 6 || (utcDay === 0 && utcHour < 21) || (utcDay === 5 && utcHour >= 22);
    if (isWeekend && !isCrypto) {
      return {
        session: 'WEEKEND_CLOSED',
        sessionName: 'Weekend Market Closure',
        isAllowedToTrade: false,
        isKillzone: false,
        isRollover: false,
        utcHour,
        utcMinute,
        utcTimeString,
        reason: 'Forex & Gold markets closed for the weekend (re-opens Sunday 21:00 UTC). Only BTCUSD is active 24/7.',
        romanUrduSummary: `⛔ [WEEKEND CLOSED]: International Forex aur Gold market weekend par band hai (Sunday 21:00 UTC ko open hogi). MT5 par sirf Crypto (BTCUSD) 24/7 trade ho sakta hai.`,
      };
    }

    // 1. Broker Rollover Window: 21:50 to 22:25 UTC
    // During this 35-minute window, global banks reset daily swaps, and broker spreads spike 3x to 8x.
    const isRollover = (utcHour === 21 && utcMinute >= 50) || (utcHour === 22 && utcMinute <= 25);
    if (isRollover && !isCrypto) {
      return {
        session: 'BROKER_ROLLOVER',
        sessionName: 'Daily Broker Rollover Window',
        isAllowedToTrade: false,
        isKillzone: false,
        isRollover: true,
        utcHour,
        utcMinute,
        utcTimeString,
        reason: 'Daily swap rollover window active (21:50-22:25 UTC). Spread expansion risk! Trade entry locked.',
        romanUrduSummary: `⛔ [ROLLOVER LOCK]: Market rollover chal raha hai (${utcTimeString}). Brokers ka spread spike hota hai, is liye naye orders temporary lock hain.`,
      };
    }

    // 2. ICT Killzones:
    // London Open: 07:00 - 10:00 UTC
    const isLondonOpen = utcHour >= 7 && utcHour < 10;

    // New York Open: 12:00 - 16:00 UTC (US session volume)
    const isNyOpen = utcHour >= 12 && utcHour < 16;

    // London Close: 15:00 - 17:00 UTC (institutional target delivery)
    const isLondonClose = utcHour >= 15 && utcHour < 17;

    // Asian Session: 00:00 - 06:00 UTC (consolidation / liquidity accumulation)
    const isAsian = utcHour >= 0 && utcHour < 6;

    let session: MarketSession = 'OFF_HOURS';
    let sessionName = 'Off-Peak Liquidity Hours';
    let isKillzone = false;

    if (isLondonOpen) {
      session = 'LONDON_OPEN';
      sessionName = 'London Open Killzone (ICT)';
      isKillzone = true;
    } else if (isNyOpen) {
      session = 'NEW_YORK_OPEN';
      sessionName = 'New York Open Killzone (ICT)';
      isKillzone = true;
    } else if (isLondonClose) {
      session = 'LONDON_CLOSE';
      sessionName = 'London Close Killzone';
      isKillzone = true;
    } else if (isAsian) {
      session = 'ASIAN_SESSION';
      sessionName = 'Asian Consolidation Range';
      isKillzone = false;
    }

    // Crypto (BTC, ETH) trades 24/7 without restriction
    if (isCrypto) {
      return {
        session,
        sessionName: `${sessionName} (Crypto 24/7 Mode)`,
        isAllowedToTrade: true,
        isKillzone: true,
        isRollover: false,
        utcHour,
        utcMinute,
        utcTimeString,
        reason: 'Crypto assets trade 24/7 on decentralized liquidity.',
        romanUrduSummary: `🟢 [CRYPTO 24/7]: ${sym} 24-hour market par active hai. Execution permitted.`,
      };
    }

    // For Forex, Metals (Gold), and Indices:
    // Only trade during London Open, New York Open, or London Close!
    // Asian session and dead off-hours are locked to prevent chop and fakeouts.
    if (isKillzone) {
      return {
        session,
        sessionName,
        isAllowedToTrade: true,
        isKillzone: true,
        isRollover: false,
        utcHour,
        utcMinute,
        utcTimeString,
        reason: `${sessionName} is active. Institutional volume and true liquidity flow confirmed.`,
        romanUrduSummary: `🟢 [${sessionName.toUpperCase()} ACTIVE]: Market mein smart money volume active hai (${utcTimeString}). Institutional trades permitted.`,
      };
    }

    // Asian session: Lock Forex/Gold to preserve capital from low-volatility chop
    if (isAsian) {
      return {
        session: 'ASIAN_SESSION',
        sessionName: 'Asian Consolidation Range',
        isAllowedToTrade: false,
        isKillzone: false,
        isRollover: false,
        utcHour,
        utcMinute,
        utcTimeString,
        reason: 'Asian session consolidation active. Fake-breakout hazard. Capital preservation lock active.',
        romanUrduSummary: `🟡 [ASIAN CHOP STANDBY]: Asian session (${utcTimeString}) mein range consolidation aur fake breakouts bante hain. London Open ka intezar karein.`,
      };
    }

    // Off-hours (e.g. 17:00-21:50 UTC or 10:00-12:00 UTC midday lull):
    // Allow trade ONLY if setup has high confluence
    return {
      session: 'OFF_HOURS',
      sessionName: 'Midday / Off-Peak Hours',
      isAllowedToTrade: true, // Allow with high accuracy mode
      isKillzone: false,
      isRollover: false,
      utcHour,
      utcMinute,
      utcTimeString,
      reason: 'Off-peak liquidity window. Higher confluence threshold required.',
      romanUrduSummary: `⚪ [OFF-PEAK HOURS]: Midday lull (${utcTimeString}). Strict high-accuracy confluence required.`,
    };
  }
}
