export interface CentralBankPolicy {
  currency: string;
  bankName: string;
  policyRate: number; // percentage, e.g. 5.25
  depositRate?: number;
  lastAction: 'HIKE' | 'CUT' | 'HOLD';
  nextMeetingDate: string;
  cutProbabilityPercent: number;
  hikeProbabilityPercent: number;
  monetaryStance: 'HAWKISH' | 'NEUTRAL' | 'DOVISH';
  statementSummaryUrdu: string;
}

export interface PairRateDifferential {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseRate: number;
  quoteRate: number;
  differential: number; // baseRate - quoteRate
  rateAdvantageCurrency: string;
  fundamentalBias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  score: number; // 0 to 100
  carryTradeYieldAnnual: number;
  institutionalExplanationUrdu: string;
}

export class InterestRateDiffEngine {
  private static centralBanks: Record<string, CentralBankPolicy> = {
    USD: {
      currency: 'USD',
      bankName: 'Federal Reserve (Fed)',
      policyRate: 5.25,
      depositRate: 5.40,
      lastAction: 'HOLD',
      nextMeetingDate: 'Upcoming FOMC',
      cutProbabilityPercent: 100,
      hikeProbabilityPercent: 0,
      monetaryStance: 'DOVISH',
      statementSummaryUrdu: 'Fed rate cut cycle enter kar raha hai. 25-50 bps cut pricing ho chuki hai.',
    },
    EUR: {
      currency: 'EUR',
      bankName: 'European Central Bank (ECB)',
      policyRate: 3.50,
      depositRate: 3.50,
      lastAction: 'CUT',
      nextMeetingDate: 'Upcoming ECB GovC',
      cutProbabilityPercent: 85,
      hikeProbabilityPercent: 0,
      monetaryStance: 'DOVISH',
      statementSummaryUrdu: 'ECB ne 25 bps rate cut kar ke easing policy continue rakhi hai.',
    },
    GBP: {
      currency: 'GBP',
      bankName: 'Bank of England (BoE)',
      policyRate: 5.00,
      depositRate: 5.00,
      lastAction: 'CUT',
      nextMeetingDate: 'Upcoming MPC Meeting',
      cutProbabilityPercent: 55,
      hikeProbabilityPercent: 0,
      monetaryStance: 'NEUTRAL',
      statementSummaryUrdu: 'BoE 5-4 split vote ke sath cautious hold/cut transition mein hai.',
    },
    JPY: {
      currency: 'JPY',
      bankName: 'Bank of Japan (BoJ)',
      policyRate: 0.25,
      depositRate: 0.25,
      lastAction: 'HIKE',
      nextMeetingDate: 'Upcoming BoJ Meeting',
      cutProbabilityPercent: 0,
      hikeProbabilityPercent: 70,
      monetaryStance: 'HAWKISH',
      statementSummaryUrdu: 'BoJ interest rates hike kar raha hai taake inflation aur Yen depreciation control ho.',
    },
    AUD: {
      currency: 'AUD',
      bankName: 'Reserve Bank of Australia (RBA)',
      policyRate: 4.35,
      depositRate: 4.35,
      lastAction: 'HOLD',
      nextMeetingDate: 'Upcoming RBA Board',
      cutProbabilityPercent: 20,
      hikeProbabilityPercent: 15,
      monetaryStance: 'HAWKISH',
      statementSummaryUrdu: 'RBA trimmed mean CPI 3.9% ki wajah se hawkish hold maintain kar raha hai.',
    },
    CAD: {
      currency: 'CAD',
      bankName: 'Bank of Canada (BoC)',
      policyRate: 4.25,
      depositRate: 4.25,
      lastAction: 'CUT',
      nextMeetingDate: 'Upcoming BoC Governing',
      cutProbabilityPercent: 90,
      hikeProbabilityPercent: 0,
      monetaryStance: 'DOVISH',
      statementSummaryUrdu: 'BoC sequential rate cuts kar raha hai taake domestic housing aur labor ko relief mile.',
    },
    NZD: {
      currency: 'NZD',
      bankName: 'Reserve Bank of New Zealand (RBNZ)',
      policyRate: 5.25,
      depositRate: 5.25,
      lastAction: 'CUT',
      nextMeetingDate: 'Upcoming RBNZ MPC',
      cutProbabilityPercent: 85,
      hikeProbabilityPercent: 0,
      monetaryStance: 'DOVISH',
      statementSummaryUrdu: 'RBNZ ne dovish pivot karte hue official cash rate mein 25 bps reduction shuru ki hai.',
    },
    CHF: {
      currency: 'CHF',
      bankName: 'Swiss National Bank (SNB)',
      policyRate: 1.25,
      depositRate: 1.25,
      lastAction: 'CUT',
      nextMeetingDate: 'Upcoming SNB Assessment',
      cutProbabilityPercent: 75,
      hikeProbabilityPercent: 0,
      monetaryStance: 'DOVISH',
      statementSummaryUrdu: 'SNB inflation target se neechay aane par rates cuts continue kar raha hai.',
    },
  };

  public static getCentralBank(currency: string): CentralBankPolicy | undefined {
    return this.centralBanks[currency.toUpperCase()];
  }

  public static getAllCentralBanks(): CentralBankPolicy[] {
    return Object.values(this.centralBanks);
  }

  public static calculatePairDifferential(pair: string): PairRateDifferential {
    // E.g. "EURUSD" or "EUR/USD"
    const cleanPair = pair.replace('/', '').toUpperCase();
    const base = cleanPair.slice(0, 3);
    const quote = cleanPair.slice(3, 6);

    const bPolicy = this.getCentralBank(base);
    const qPolicy = this.getCentralBank(quote);

    const baseRate = bPolicy?.policyRate ?? 4.0;
    const quoteRate = qPolicy?.policyRate ?? 4.0;
    const diff = Number((baseRate - quoteRate).toFixed(2));

    const advantageCurr = diff > 0 ? base : quote;
    const absDiff = Math.abs(diff);

    let bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH' = 'NEUTRAL';
    let score = 50;

    if (diff >= +1.5) {
      bias = 'STRONG_BULLISH';
      score = Math.min(95, 75 + Math.round(absDiff * 8));
    } else if (diff > 0.25) {
      bias = 'BULLISH';
      score = 65;
    } else if (diff <= -1.5) {
      bias = 'STRONG_BEARISH';
      score = Math.max(10, 25 - Math.round(absDiff * 6));
    } else if (diff < -0.25) {
      bias = 'BEARISH';
      score = 35;
    } else {
      bias = 'NEUTRAL';
      score = 50;
    }

    const explanation = `${base} Interest Rate: ${baseRate.toFixed(2)}% vs ${quote} Rate: ${quoteRate.toFixed(2)}%. Interest rate spread is ${diff > 0 ? '+' : ''}${diff}%. Rate advantage is with ${advantageCurr} (${absDiff.toFixed(2)}%), yielding ${bias} fundamental macro bias.`;

    return {
      pair: cleanPair,
      baseCurrency: base,
      quoteCurrency: quote,
      baseRate,
      quoteRate,
      differential: diff,
      rateAdvantageCurrency: advantageCurr,
      fundamentalBias: bias,
      score,
      carryTradeYieldAnnual: diff,
      institutionalExplanationUrdu: explanation,
    };
  }

  public static getAllMajorPairs(): PairRateDifferential[] {
    const pairs = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDJPY', 'USDCHF'];
    return pairs.map(p => this.calculatePairDifferential(p));
  }
}
