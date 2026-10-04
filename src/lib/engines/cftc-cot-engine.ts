export interface CotPositionBreakdown {
  currency: 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'AUD' | 'CAD' | 'NZD' | 'USD';
  symbolName: string;
  // Commercials (Hedgers)
  commercialLong: number;
  commercialShort: number;
  commercialNet: number;
  // Non-Commercials (Large Speculators / Hedge Funds)
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  // Traders in Financial Futures (TFF) Detailed Categories
  dealerLong: number;
  dealerShort: number;
  assetManagerLong: number;
  assetManagerShort: number;
  leveragedMoneyLong: number;
  leveragedMoneyShort: number;
  otherReportablesLong: number;
  otherReportablesShort: number;
  nonReportableLong: number;
  nonReportableShort: number;
  // Derived Institutional Analytics
  openInterest: number;
  weeklyChange: number;
  positionPercentile: number; // 0 to 100% (historical 3-year percentile)
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  institutionalInterpretation: string;
}

export class CftcCotEngine {
  private static cotData: Record<string, CotPositionBreakdown> = {
    EUR: {
      currency: 'EUR',
      symbolName: 'Euro FX Futures (CME: 6E)',
      commercialLong: 312500,
      commercialShort: 395000,
      commercialNet: -82500,
      nonCommercialLong: 228400,
      nonCommercialShort: 145900,
      nonCommercialNet: +82500,
      dealerLong: 88200,
      dealerShort: 114300,
      assetManagerLong: 142100,
      assetManagerShort: 91400,
      leveragedMoneyLong: 76200,
      leveragedMoneyShort: 54100,
      otherReportablesLong: 12000,
      otherReportablesShort: 9500,
      nonReportableLong: 22000,
      nonReportableShort: 18500,
      openInterest: 654200,
      weeklyChange: +14200,
      positionPercentile: 78,
      bias: 'BULLISH',
      institutionalInterpretation: 'Hedge funds & Asset managers EUR par aggressive net long hain. Commercials hedging badha rahe hain.',
    },
    GBP: {
      currency: 'GBP',
      symbolName: 'British Pound Futures (CME: 6B)',
      commercialLong: 104200,
      commercialShort: 85600,
      commercialNet: +18600,
      nonCommercialLong: 72100,
      nonCommercialShort: 90700,
      nonCommercialNet: -18600,
      dealerLong: 31200,
      dealerShort: 24500,
      assetManagerLong: 44100,
      assetManagerShort: 58200,
      leveragedMoneyLong: 22400,
      leveragedMoneyShort: 31200,
      otherReportablesLong: 5400,
      otherReportablesShort: 6800,
      nonReportableLong: 12300,
      nonReportableShort: 14200,
      openInterest: 215400,
      weeklyChange: -8400,
      positionPercentile: 41,
      bias: 'BEARISH',
      institutionalInterpretation: 'Asset managers ne GBP longs liquid kar ke net short position open ki hai. Stance cautious bearish.',
    },
    JPY: {
      currency: 'JPY',
      symbolName: 'Japanese Yen Futures (CME: 6J)',
      commercialLong: 185400,
      commercialShort: 188200,
      commercialNet: -2800,
      nonCommercialLong: 124500,
      nonCommercialShort: 121700,
      nonCommercialNet: +2800,
      dealerLong: 51200,
      dealerShort: 52400,
      assetManagerLong: 68400,
      assetManagerShort: 64200,
      leveragedMoneyLong: 48900,
      leveragedMoneyShort: 49500,
      otherReportablesLong: 6100,
      otherReportablesShort: 6300,
      nonReportableLong: 14200,
      nonReportableShort: 13900,
      openInterest: 318900,
      weeklyChange: +22400,
      positionPercentile: 52,
      bias: 'NEUTRAL',
      institutionalInterpretation: 'Yen short carry trade completely unwind ho chuka hai. Longs aur shorts balanced 50/50 hain.',
    },
    CHF: {
      currency: 'CHF',
      symbolName: 'Swiss Franc Futures (CME: 6S)',
      commercialLong: 44200,
      commercialShort: 32100,
      commercialNet: +12100,
      nonCommercialLong: 21500,
      nonCommercialShort: 33600,
      nonCommercialNet: -12100,
      dealerLong: 11200,
      dealerShort: 8400,
      assetManagerLong: 14200,
      assetManagerShort: 21400,
      leveragedMoneyLong: 6800,
      leveragedMoneyShort: 11200,
      otherReportablesLong: 2100,
      otherReportablesShort: 3100,
      nonReportableLong: 4100,
      nonReportableShort: 5800,
      openInterest: 89400,
      weeklyChange: -3100,
      positionPercentile: 38,
      bias: 'BEARISH',
      institutionalInterpretation: 'SNB rate cuts ki wajah se franc par leveraged speculative shorts hold kar rahe hain.',
    },
    AUD: {
      currency: 'AUD',
      symbolName: 'Australian Dollar Futures (CME: 6A)',
      commercialLong: 74200,
      commercialShort: 91400,
      commercialNet: -17200,
      nonCommercialLong: 62400,
      nonCommercialShort: 45200,
      nonCommercialNet: +17200,
      dealerLong: 22400,
      dealerShort: 28100,
      assetManagerLong: 38200,
      assetManagerShort: 26400,
      leveragedMoneyLong: 21800,
      leveragedMoneyShort: 16900,
      otherReportablesLong: 4100,
      otherReportablesShort: 3200,
      nonReportableLong: 9800,
      nonReportableShort: 8200,
      openInterest: 184500,
      weeklyChange: +6200,
      positionPercentile: 69,
      bias: 'BULLISH',
      institutionalInterpretation: 'RBA hawkish stance aur commodity export demand se speculative funds AUD net long hain.',
    },
    CAD: {
      currency: 'CAD',
      symbolName: 'Canadian Dollar Futures (CME: 6C)',
      commercialLong: 68200,
      commercialShort: 54100,
      commercialNet: +14100,
      nonCommercialLong: 38400,
      nonCommercialShort: 52500,
      nonCommercialNet: -14100,
      dealerLong: 19400,
      dealerShort: 14200,
      assetManagerLong: 24100,
      assetManagerShort: 32400,
      leveragedMoneyLong: 12400,
      leveragedMoneyShort: 18200,
      otherReportablesLong: 3100,
      otherReportablesShort: 4200,
      nonReportableLong: 7200,
      nonReportableShort: 8900,
      openInterest: 142100,
      weeklyChange: -4800,
      positionPercentile: 34,
      bias: 'BEARISH',
      institutionalInterpretation: 'Bank of Canada rate cut cycle aur crude oil volatility se CAD institutional positioning weak hai.',
    },
    NZD: {
      currency: 'NZD',
      symbolName: 'New Zealand Dollar Futures (CME: 6N)',
      commercialLong: 31200,
      commercialShort: 36400,
      commercialNet: -5200,
      nonCommercialLong: 24100,
      nonCommercialShort: 18900,
      nonCommercialNet: +5200,
      dealerLong: 9400,
      dealerShort: 11200,
      assetManagerLong: 14800,
      assetManagerShort: 10400,
      leveragedMoneyLong: 8200,
      leveragedMoneyShort: 6800,
      otherReportablesLong: 1400,
      otherReportablesShort: 1200,
      nonReportableLong: 3800,
      nonReportableShort: 3400,
      openInterest: 72400,
      weeklyChange: +1800,
      positionPercentile: 58,
      bias: 'NEUTRAL',
      institutionalInterpretation: 'RBNZ dovish cut pivot ke baad positioning neutral consolidation zone mein hai.',
    },
    USD: {
      currency: 'USD',
      symbolName: 'U.S. Dollar Index Futures (ICE: DX)',
      commercialLong: 48900,
      commercialShort: 24500,
      commercialNet: +24400,
      nonCommercialLong: 28400,
      nonCommercialShort: 52800,
      nonCommercialNet: -24400,
      dealerLong: 14200,
      dealerShort: 8100,
      assetManagerLong: 18900,
      assetManagerShort: 32400,
      leveragedMoneyLong: 8900,
      leveragedMoneyShort: 19800,
      otherReportablesLong: 2100,
      otherReportablesShort: 3900,
      nonReportableLong: 4800,
      nonReportableShort: 7200,
      openInterest: 94200,
      weeklyChange: -12600,
      positionPercentile: 26,
      bias: 'BEARISH',
      institutionalInterpretation: 'Speculative money DXY par continuous net short add kar rahi hai. Fed rate cuts ka institutional pricing active hai.',
    },
  };

  public static getAllCurrencies(): CotPositionBreakdown[] {
    return Object.values(this.cotData);
  }

  public static getByCurrency(curr: string): CotPositionBreakdown | undefined {
    return this.cotData[curr.toUpperCase()];
  }

  public static getPairCotBias(base: string, quote: string): {
    baseNet: number;
    quoteNet: number;
    delta: number;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number; // 0 to 100
    summaryUrdu: string;
  } {
    const b = this.getByCurrency(base);
    const q = this.getByCurrency(quote);
    if (!b || !q) {
      return {
        baseNet: 0,
        quoteNet: 0,
        delta: 0,
        bias: 'NEUTRAL',
        score: 50,
        summaryUrdu: 'COT data neutral.',
      };
    }

    const bNet = b.nonCommercialNet;
    const qNet = q.nonCommercialNet;
    const delta = bNet - qNet;

    let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let score = 50;

    if (delta > 30000) {
      bias = 'BULLISH';
      score = Math.min(95, 65 + Math.round((delta / 100000) * 30));
    } else if (delta < -30000) {
      bias = 'BEARISH';
      score = Math.max(10, 35 - Math.round((Math.abs(delta) / 100000) * 25));
    } else {
      score = 50;
    }

    const summaryUrdu = `${base} COT Non-Commercial Net: ${bNet > 0 ? '+' : ''}${bNet.toLocaleString()} vs ${quote} Net: ${qNet > 0 ? '+' : ''}${qNet.toLocaleString()}. Institutional smart money bias is ${bias} (Score: ${score}/100).`;

    return {
      baseNet: bNet,
      quoteNet: qNet,
      delta,
      bias,
      score,
      summaryUrdu,
    };
  }
}
