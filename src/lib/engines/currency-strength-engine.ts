export interface CurrencyStrengthScore {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD';
  score: number; // 0 to 100
  bias: 'VERY_STRONG' | 'STRONG' | 'NEUTRAL' | 'WEAK' | 'VERY_WEAK';
  change24h: number; // e.g. +4.2
  rank: number; // 1 to 8
  drivers: string;
}

export interface PairStrengthMatching {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseScore: number;
  quoteScore: number;
  spread: number; // baseScore - quoteScore
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0 to 100
  analysisUrdu: string;
}

export class CurrencyStrengthEngine {
  private static strengths: Record<string, CurrencyStrengthScore> = {
    GBP: {
      currency: 'GBP',
      score: 78,
      bias: 'STRONG',
      change24h: +3.8,
      rank: 1,
      drivers: 'UK Services PMI beats + sticky wage growth supporting Sterling.',
    },
    AUD: {
      currency: 'AUD',
      score: 74,
      bias: 'STRONG',
      change24h: +2.4,
      rank: 2,
      drivers: 'RBA hawkish hold & Chinese stimulus expectations aiding Aussie.',
    },
    JPY: {
      currency: 'JPY',
      score: 68,
      bias: 'STRONG',
      change24h: +5.1,
      rank: 3,
      drivers: 'BoJ rate hike momentum & Yen carry trade liquidation tailwinds.',
    },
    CHF: {
      currency: 'CHF',
      score: 55,
      bias: 'NEUTRAL',
      change24h: +0.6,
      rank: 4,
      drivers: 'Safe-haven demand counterbalanced by SNB rate cuts.',
    },
    EUR: {
      currency: 'EUR',
      score: 41,
      bias: 'WEAK',
      change24h: -2.1,
      rank: 5,
      drivers: 'ECB rate cuts & German manufacturing contraction weighing on Euro.',
    },
    USD: {
      currency: 'USD',
      score: 42,
      bias: 'WEAK',
      change24h: -4.5,
      rank: 6,
      drivers: 'Fed rate cut pricing & falling Treasury bond yields softening Greenback.',
    },
    NZD: {
      currency: 'NZD',
      score: 38,
      bias: 'WEAK',
      change24h: -1.2,
      rank: 7,
      drivers: 'RBNZ early rate cut cycle creating headwind for Kiwi.',
    },
    CAD: {
      currency: 'CAD',
      score: 32,
      bias: 'VERY_WEAK',
      change24h: -3.6,
      rank: 8,
      drivers: 'BoC rate cuts & weak Canadian labor numbers dragging Loonie.',
    },
  };

  public static getAllStrengths(): CurrencyStrengthScore[] {
    return Object.values(this.strengths).sort((a, b) => b.score - a.score);
  }

  public static getStrength(curr: string): CurrencyStrengthScore | undefined {
    return this.strengths[curr.toUpperCase()];
  }

  public static matchPair(pair: string): PairStrengthMatching {
    const clean = pair.replace('/', '').toUpperCase();
    const base = clean.slice(0, 3);
    const quote = clean.slice(3, 6);

    const b = this.getStrength(base);
    const q = this.getStrength(quote);

    const baseScore = b?.score ?? 50;
    const quoteScore = q?.score ?? 50;
    const spread = baseScore - quoteScore;

    let rec: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
    let confidence = 50;

    if (spread >= 30) {
      rec = 'STRONG_BUY';
      confidence = Math.min(96, 75 + Math.round(spread * 0.4));
    } else if (spread >= 15) {
      rec = 'BUY';
      confidence = 68;
    } else if (spread <= -30) {
      rec = 'STRONG_SELL';
      confidence = Math.min(96, 75 + Math.round(Math.abs(spread) * 0.4));
    } else if (spread <= -15) {
      rec = 'SELL';
      confidence = 68;
    } else {
      rec = 'NEUTRAL';
      confidence = 50;
    }

    const analysisUrdu = `${base} Strength (${baseScore}) vs ${quote} Strength (${quoteScore}) $\\rightarrow$ Spread: ${spread > 0 ? '+' : ''}${spread}. Pair signal: ${rec} (Confidence: ${confidence}%).`;

    return {
      pair: clean,
      baseCurrency: base,
      quoteCurrency: quote,
      baseScore,
      quoteScore,
      spread,
      recommendation: rec,
      confidence,
      analysisUrdu,
    };
  }

  public static getTopPairSetups(): PairStrengthMatching[] {
    const candidatePairs = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDJPY', 'GBPJPY', 'EURGBP', 'AUDCAD'];
    return candidatePairs
      .map(p => this.matchPair(p))
      .sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread));
  }
}
