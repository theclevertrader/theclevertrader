export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EconomicEvent {
  id: string;
  timestamp: number;
  timeString: string;
  currency: string;
  country: string;
  countryCode: string;
  event: string;
  impact: ImpactLevel;
  actual?: string;
  forecast: string;
  previous: string;
  unit?: string;
  isPassed: boolean;
  minutesUntil: number;
  noTradeLock: boolean;
  romanUrduAnalysis: string;
}

export interface MacroIndicator {
  name: string;
  category: 'RATES' | 'INFLATION' | 'LABOR' | 'GROWTH' | 'COMMODITIES';
  value: string;
  prior: string;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  impactOnGold: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactOnUsd: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export interface CurrencyStrength {
  currency: string;
  score: number; // 0 to 10
  bias: 'STRONG' | 'NEUTRAL' | 'WEAK';
  change24h: number;
}

export interface FundamentalAnalysisOverview {
  dxyIndex: number;
  dxyChange: number;
  us10yYield: number;
  us2yYield: number;
  yieldSpread: number;
  fedRate: string;
  goldMacroBias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  overallMacroRegime: string;
  activeNoTradeWindow: boolean;
  upcomingHighImpactEvent?: EconomicEvent;
  romanUrduMacroSummary: string;
  currencyStrengths: CurrencyStrength[];
  indicators: MacroIndicator[];
  economicEvents: EconomicEvent[];
  noTradeLockActive?: boolean;
}

export class FundamentalEngine {
  private static userApiKeys: {
    finnhub?: string;
    alphaVantage?: string;
    fmp?: string;
  } = {};

  public static setApiKeys(keys: { finnhub?: string; alphaVantage?: string; fmp?: string }) {
    this.userApiKeys = { ...this.userApiKeys, ...keys };
  }

  public static getApiKeys() {
    return {
      finnhub: this.userApiKeys.finnhub || process.env.FINNHUB_API_KEY,
      alphaVantage: this.userApiKeys.alphaVantage || process.env.ALPHA_VANTAGE_API_KEY,
      fmp: this.userApiKeys.fmp || process.env.FMP_API_KEY,
    };
  }

  /**
   * Institutional Macro Indicators
   */
  public static getMacroIndicators(): MacroIndicator[] {
    return [
      {
        name: 'US Fed Funds Rate',
        category: 'RATES',
        value: '5.25% - 5.50%',
        prior: '5.25% - 5.50%',
        trend: 'DOWN',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'BEARISH',
        description: 'Federal Reserve rate cut cycle pricing in 25-50 bps reduction, weakening USD yield advantage.',
      },
      {
        name: 'US Headline CPI Inflation (YoY)',
        category: 'INFLATION',
        value: '2.9%',
        prior: '3.0%',
        trend: 'DOWN',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'BEARISH',
        description: 'Inflation cooling towards the 2% target, cementing Fed dovish stance.',
      },
      {
        name: 'US Core PCE Price Index',
        category: 'INFLATION',
        value: '2.6%',
        prior: '2.6%',
        trend: 'NEUTRAL',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'NEUTRAL',
        description: 'Fed primary inflation gauge remains controlled near multi-year lows.',
      },
      {
        name: 'US Non-Farm Payrolls (NFP)',
        category: 'LABOR',
        value: '142K',
        prior: '114K',
        trend: 'DOWN',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'BEARISH',
        description: 'Labor market cooling down from overheating, supporting monetary easing.',
      },
      {
        name: 'US Unemployment Rate',
        category: 'LABOR',
        value: '4.2%',
        prior: '4.3%',
        trend: 'NEUTRAL',
        impactOnGold: 'NEUTRAL',
        impactOnUsd: 'NEUTRAL',
        description: 'Sahm Rule recession trigger monitored closely by institutional desks.',
      },
      {
        name: 'US 10-Year Treasury Yield',
        category: 'RATES',
        value: '3.72%',
        prior: '3.91%',
        trend: 'DOWN',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'BEARISH',
        description: 'Benchmark bond yield falling, lowering opportunity cost for holding Gold.',
      },
      {
        name: 'US 10Y-2Y Yield Curve Spread',
        category: 'RATES',
        value: '+0.07%',
        prior: '-0.06%',
        trend: 'UP',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'NEUTRAL',
        description: 'Yield curve officially un-inverting; historically marks transition to economic cycle shifts.',
      },
      {
        name: 'Global Central Bank Gold Reserves',
        category: 'COMMODITIES',
        value: '+290 Tons',
        prior: '+280 Tons',
        trend: 'UP',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'BEARISH',
        description: 'Aggressive de-dollarization and reserve diversification by PBOC, RBI and global central banks.',
      },
      {
        name: 'Geopolitical Risk Index (GPR)',
        category: 'COMMODITIES',
        value: '165.4',
        prior: '142.1',
        trend: 'UP',
        impactOnGold: 'BULLISH',
        impactOnUsd: 'NEUTRAL',
        description: 'Elevated Middle East and Eastern European tensions driving safe-haven gold demand.',
      },
    ];
  }

  /**
   * Currency Strength Index (0 to 10 scale)
   */
  public static getCurrencyStrengths(): CurrencyStrength[] {
    return [
      { currency: 'GBP', score: 8.6, bias: 'STRONG', change24h: +0.45 },
      { currency: 'EUR', score: 7.9, bias: 'STRONG', change24h: +0.32 },
      { currency: 'JPY', score: 7.4, bias: 'STRONG', change24h: +0.65 },
      { currency: 'USD', score: 5.2, bias: 'NEUTRAL', change24h: -0.28 },
      { currency: 'AUD', score: 5.0, bias: 'NEUTRAL', change24h: +0.10 },
      { currency: 'CAD', score: 4.2, bias: 'WEAK', change24h: -0.18 },
      { currency: 'CHF', score: 6.1, bias: 'NEUTRAL', change24h: +0.05 },
    ];
  }

  /**
   * Economic Calendar Events with High-Impact Red Folder Filtering & No-Trade Timer
   */
  public static getEconomicEvents(): EconomicEvent[] {
    const now = Date.now();
    const min = 60 * 1000;

    return [
      {
        id: 'econ-1',
        timestamp: now - 120 * min,
        timeString: '08:30 GMT',
        currency: 'USD',
        country: 'United States',
        countryCode: 'US',
        event: 'Core CPI (MoM)',
        impact: 'HIGH',
        actual: '0.2%',
        forecast: '0.2%',
        previous: '0.2%',
        isPassed: true,
        minutesUntil: -120,
        noTradeLock: false,
        romanUrduAnalysis: 'US Core CPI tawaqqo ke mutabiq 0.2% aya hai. Dollar stable raha aur gold ko support mili.',
      },
      {
        id: 'econ-2',
        timestamp: now - 35 * min,
        timeString: '10:00 GMT',
        currency: 'EUR',
        country: 'Eurozone',
        countryCode: 'EU',
        event: 'ECB Monetary Policy Statement & Rate Decision',
        impact: 'HIGH',
        actual: '3.65%',
        forecast: '3.65%',
        previous: '3.75%',
        isPassed: true,
        minutesUntil: -35,
        noTradeLock: false,
        romanUrduAnalysis: 'ECB ne 25 bps rate cut kiya. EURUSD mein liquidity sweep ke baad bullish continuation dekhi gayi.',
      },
      {
        id: 'econ-3',
        timestamp: now + 45 * min,
        timeString: '12:30 GMT',
        currency: 'USD',
        country: 'United States',
        countryCode: 'US',
        event: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
        impact: 'HIGH',
        forecast: '160K',
        previous: '142K',
        isPassed: false,
        minutesUntil: 45,
        noTradeLock: true, // Active safety lock
        romanUrduAnalysis: '⚠️ HIGH IMPACT ALERT: Agle 45 minutes mein US NFP release hone wala hai. Bot spread expansion aur slippage se bachne ke liye safe zone mein hai.',
      },
      {
        id: 'econ-4',
        timestamp: now + 160 * min,
        timeString: '14:00 GMT',
        currency: 'USD',
        country: 'United States',
        countryCode: 'US',
        event: 'ISM Services PMI',
        impact: 'HIGH',
        forecast: '51.5',
        previous: '51.4',
        isPassed: false,
        minutesUntil: 160,
        noTradeLock: false,
        romanUrduAnalysis: 'ISM Services 50 se ooper expansion zone mein hai. Agar forecast se kam aya to Gold mazeed rally karega.',
      },
      {
        id: 'econ-5',
        timestamp: now + 380 * min,
        timeString: '18:00 GMT',
        currency: 'GBP',
        country: 'United Kingdom',
        countryCode: 'GB',
        event: 'BOE Governor Bailey Speaks',
        impact: 'MEDIUM',
        forecast: '-',
        previous: '-',
        isPassed: false,
        minutesUntil: 380,
        noTradeLock: false,
        romanUrduAnalysis: 'Governor Bailey ki speech se GBP pairs (GBPUSD, EURGBP) par high volatility expected hai.',
      },
      {
        id: 'econ-6',
        timestamp: now + 720 * min,
        timeString: '01:30 GMT',
        currency: 'JPY',
        country: 'Japan',
        countryCode: 'JP',
        event: 'Tokyo Core CPI (YoY)',
        impact: 'MEDIUM',
        forecast: '2.4%',
        previous: '2.2%',
        isPassed: false,
        minutesUntil: 720,
        noTradeLock: false,
        romanUrduAnalysis: 'Tokyo CPI inflation Japanese Yen ko strengthen kar sakti hai, USDJPY bearish pressure mein reh sakta hai.',
      },
    ];
  }

  /**
   * Evaluates complete macro overview with Roman Urdu commentary
   */
  public static evaluateOverview(): FundamentalAnalysisOverview {
    const indicators = this.getMacroIndicators();
    const events = this.getEconomicEvents();
    const currencyStrengths = this.getCurrencyStrengths();

    const upcomingHigh = events.find(e => !e.isPassed && e.impact === 'HIGH');
    const activeNoTradeWindow = events.some(e => !e.isPassed && e.impact === 'HIGH' && e.minutesUntil <= 60);

    const dxyIndex = 101.42;
    const dxyChange = -0.28;
    const us10yYield = 3.72;
    const us2yYield = 3.65;
    const yieldSpread = +(us10yYield - us2yYield).toFixed(2);

    let romanUrduMacroSummary = '';
    if (activeNoTradeWindow && upcomingHigh) {
      romanUrduMacroSummary = `⚠️ FUNDAMENTAL NEWS ALERT: Agle ${upcomingHigh.minutesUntil} minutes mein [${upcomingHigh.currency}] ${upcomingHigh.event} release ho raha hai. High impact economic data ke waqt slippage aur spread barh jata hai, is liye safe zone lock active hai.`;
    } else {
      romanUrduMacroSummary = `Macro Regime: US Dollar Index (DXY: ${dxyIndex}) gir raha hai aur US 10-Year Bond Yield (3.72%) drop kar chuki hai. Federal Reserve ki rate cut expectations Gold (XAUUSD) aur EURUSD ke liye bohot zyada BULLISH hain. Central bank gold buying aur geopolitical tensions bhi safe-haven buyers ko support de rahi hain.`;
    }

    return {
      dxyIndex,
      dxyChange,
      us10yYield,
      us2yYield,
      yieldSpread,
      fedRate: '5.25% - 5.50%',
      goldMacroBias: 'STRONG_BULLISH',
      overallMacroRegime: 'FED EASING CYCLE / US DOLLAR WEAKNESS',
      activeNoTradeWindow,
      upcomingHighImpactEvent: upcomingHigh,
      romanUrduMacroSummary,
      currencyStrengths,
      indicators,
      economicEvents: events,
    };
  }
}
