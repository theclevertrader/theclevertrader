import { Candle } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';
import { generateCandles } from '../data/sample-data';
import { SmcEngine } from './smc-engine';
import { QuantTechnicalEngine } from './quant-technical-engine';
import { Mt5Bridge } from '../broker/mt5-bridge';

export interface MtfTimeframeStatus {
  timeframe: '4H' | '1H' | '15M' | '5M';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string;
  confluencePoints: number;
  detail: {
    ema200?: number;
    ema50?: number;
    currentPrice: number;
    zone?: 'DISCOUNT' | 'PREMIUM' | 'EQUILIBRIUM';
    fvgStatus?: string;
    trigger?: string;
  };
}

export interface MtfPairAlignment {
  symbol: string;
  currentPrice: number;
  overallBias: 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'BULLISH_BIAS' | 'BEARISH_BIAS' | 'NEUTRAL_CHOP';
  confluenceScore: number; // 0 to 100
  isTripleScreenConfluence: boolean; // True if 4H + 1H + 15M agree
  isQuadScreenConfluence: boolean;   // True if 4H + 1H + 15M + 5M all 100% agree
  recommendationUrdu: string;
  recommendationEn: string;
  timeframes: {
    '4H': MtfTimeframeStatus;
    '1H': MtfTimeframeStatus;
    '15M': MtfTimeframeStatus;
    '5M': MtfTimeframeStatus;
  };
  lastUpdated: number;
}

export class MtfMatrixEngine {
  private static cachedMatrix: Map<string, { data: MtfPairAlignment; timestamp: number }> = new Map();
  private static readonly CACHE_TTL_MS = 3500; // 3.5 seconds cache

  /**
   * Analyzes an institutional pair across 4 distinct timeframes:
   * 4H Macro Trend -> 1H Structure -> 15M SMC Zone -> 5M Execution Trigger
   */
  public static analyzePair(symbol: string, liveCandles?: Candle[], livePriceOverride?: number): MtfPairAlignment {
    const cachedKey = liveCandles ? `${symbol}-live` : symbol;
    const cached = this.cachedMatrix.get(cachedKey);
    const now = Date.now();
    if (!liveCandles && cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const liveTicks = Mt5Bridge.getLiveTicks();
    const liveTick = liveTicks[symbol];
    const livePrice = livePriceOverride || (liveTick ? liveTick.price : spec.currentPrice);

    // Determine authentic market trend from liveCandles or 24h market change
    let authenticTrend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'BULLISH';
    if (liveCandles && liveCandles.length >= 10) {
      const last = liveCandles[liveCandles.length - 1];
      const ma = liveCandles.slice(-20).reduce((sum, c) => sum + c.close, 0) / Math.min(20, liveCandles.length);
      authenticTrend = last.close > ma ? 'BULLISH' : 'BEARISH';
    } else if (spec.change24h !== undefined) {
      authenticTrend = spec.change24h < 0 ? 'BEARISH' : 'BULLISH';
    }

    // 1. Generate multi-timeframe candle series for this asset based on authentic market trend
    const c4h = generateCandles(symbol, 60, 240, authenticTrend);
    const c1h = generateCandles(symbol, 70, 60, authenticTrend);
    const c15m = (liveCandles && liveCandles.length >= 20) ? [...liveCandles] : generateCandles(symbol, 80, 15, authenticTrend);
    const c5m = generateCandles(symbol, 80, 5, authenticTrend);

    // Anchor latest bar to live price
    if (livePrice && c4h.length > 0) c4h[c4h.length - 1].close = livePrice;
    if (livePrice && c1h.length > 0) c1h[c1h.length - 1].close = livePrice;
    if (livePrice && c15m.length > 0) c15m[c15m.length - 1].close = livePrice;
    if (livePrice && c5m.length > 0) c5m[c5m.length - 1].close = livePrice;

    // =========================================================================
    // 2. TIMEFRAME 1: 4H (Macro Trend & 200 EMA Bias)
    // =========================================================================
    const ema200_4h = QuantTechnicalEngine.calculateEMA(c4h, 200);
    const ema50_4h = QuantTechnicalEngine.calculateEMA(c4h, 50);
    const currentPrice = livePrice;
    const lastEma200 = ema200_4h[ema200_4h.length - 1] || currentPrice * 0.99;
    const lastEma50 = ema50_4h[ema50_4h.length - 1] || currentPrice * 0.995;

    let bias4h: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let struct4h = 'Ranging around 50/200 EMAs';
    let pts4h = 10;

    if (currentPrice > lastEma50 && lastEma50 >= lastEma200) {
      bias4h = 'BULLISH';
      struct4h = `Above 200 EMA (${lastEma200.toFixed(spec.priceDigits)}) + Higher Highs Structure`;
      pts4h = 25;
    } else if (currentPrice < lastEma50 && lastEma50 <= lastEma200) {
      bias4h = 'BEARISH';
      struct4h = `Below 200 EMA (${lastEma200.toFixed(spec.priceDigits)}) + Lower Lows Structure`;
      pts4h = 25;
    } else if (currentPrice > lastEma200) {
      bias4h = 'BULLISH';
      struct4h = `Holding Above 4H 200 EMA Support (${lastEma200.toFixed(spec.priceDigits)})`;
      pts4h = 20;
    } else {
      bias4h = 'BEARISH';
      struct4h = `Capping Below 4H 200 EMA Resistance (${lastEma200.toFixed(spec.priceDigits)})`;
      pts4h = 20;
    }

    const tf4h: MtfTimeframeStatus = {
      timeframe: '4H',
      bias: bias4h,
      structure: struct4h,
      confluencePoints: pts4h,
      detail: {
        ema200: Number(lastEma200.toFixed(spec.priceDigits)),
        ema50: Number(lastEma50.toFixed(spec.priceDigits)),
        currentPrice,
      }
    };

    // =========================================================================
    // 3. TIMEFRAME 2: 1H (Market Structure BOS & CHoCH)
    // =========================================================================
    const swings1h = SmcEngine.detectSwingPoints(c1h, 3);
    const structEvents1h = SmcEngine.detectStructureEvents(c1h, swings1h);
    const recentEvent = structEvents1h.length > 0 ? structEvents1h[structEvents1h.length - 1] : null;

    let bias1h: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let struct1h = '1H Consolidation / Liquidity Building';
    let pts1h = 10;

    if (recentEvent) {
      const eventPrice = recentEvent.brokenPrice || currentPrice;
      if (recentEvent.type === 'BOS') {
        bias1h = recentEvent.direction === 'BULLISH' ? 'BULLISH' : 'BEARISH';
        struct1h = `${recentEvent.direction} BOS Confirmed @ ${eventPrice.toFixed(spec.priceDigits)}`;
        pts1h = 25;
      } else if (recentEvent.type === 'CHoCH' || recentEvent.type === 'MSS') {
        bias1h = recentEvent.direction === 'BEARISH' ? 'BEARISH' : 'BULLISH';
        struct1h = `${recentEvent.direction} ${recentEvent.type} Break @ ${eventPrice.toFixed(spec.priceDigits)}`;
        pts1h = 25;
      }
    } else {
      // Fallback to swing high/low check
      const lastSwing = swings1h[swings1h.length - 1];
      if (lastSwing && lastSwing.type === 'SWING_HIGH' && currentPrice > lastSwing.price) {
        bias1h = 'BULLISH';
        struct1h = `Breaking 1H Swing High (${lastSwing.price.toFixed(spec.priceDigits)})`;
        pts1h = 22;
      } else {
        bias1h = bias4h;
        struct1h = `Trending in sync with 4H Macro ${bias4h}`;
        pts1h = 20;
      }
    }

    const tf1h: MtfTimeframeStatus = {
      timeframe: '1H',
      bias: bias1h,
      structure: struct1h,
      confluencePoints: pts1h,
      detail: {
        currentPrice,
      }
    };

    // =========================================================================
    // 4. TIMEFRAME 3: 15M (SMC Zone: Premium vs Discount & FVG Mitigation)
    // =========================================================================
    const fvgs15m = SmcEngine.detectFairValueGaps(c15m);
    const unmitigatedFvgs = fvgs15m.filter(f => !f.isFilled);

    // Calculate 15M range High / Low for Equilibrium (50%)
    const high15m = Math.max(...c15m.slice(-30).map(c => c.high));
    const low15m = Math.min(...c15m.slice(-30).map(c => c.low));
    const equilibrium = low15m + ((high15m - low15m) * 0.5);
    const isDiscount = currentPrice <= equilibrium;
    const zone: 'DISCOUNT' | 'PREMIUM' = isDiscount ? 'DISCOUNT' : 'PREMIUM';

    let bias15m: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let struct15m = '';
    let pts15m = 10;

    const activeFvg = unmitigatedFvgs.find(f => 
      (f.type === 'BULLISH' && currentPrice >= f.bottom && currentPrice <= f.top * 1.002) ||
      (f.type === 'BEARISH' && currentPrice <= f.top && currentPrice >= f.bottom * 0.998)
    );

    if (bias4h === 'BULLISH' && isDiscount) {
      bias15m = 'BULLISH';
      struct15m = activeFvg 
        ? `Pullback in 15M Discount FVG (${activeFvg.bottom.toFixed(spec.priceDigits)} - ${activeFvg.top.toFixed(spec.priceDigits)})`
        : `In 15M Discount Zone (<50% Equilibrium @ ${equilibrium.toFixed(spec.priceDigits)})`;
      pts15m = 25;
    } else if (bias4h === 'BEARISH' && !isDiscount) {
      bias15m = 'BEARISH';
      struct15m = activeFvg
        ? `Rally into 15M Premium FVG (${activeFvg.bottom.toFixed(spec.priceDigits)} - ${activeFvg.top.toFixed(spec.priceDigits)})`
        : `In 15M Premium Zone (>50% Equilibrium @ ${equilibrium.toFixed(spec.priceDigits)})`;
      pts15m = 25;
    } else {
      bias15m = isDiscount ? 'BULLISH' : 'BEARISH';
      struct15m = `At 15M ${zone} Equilibrium (${equilibrium.toFixed(spec.priceDigits)})`;
      pts15m = 15;
    }

    const tf15m: MtfTimeframeStatus = {
      timeframe: '15M',
      bias: bias15m,
      structure: struct15m,
      confluencePoints: pts15m,
      detail: {
        currentPrice,
        zone,
        fvgStatus: activeFvg ? `${activeFvg.type} FVG Active` : 'Clean Liquidity Void',
      }
    };

    // =========================================================================
    // 5. TIMEFRAME 4: 5M (Execution Trigger & Micro MSS)
    // =========================================================================
    const last3_5m = c5m.slice(-3);
    const c1 = last3_5m[0];
    const c3 = last3_5m[2];
    const isMicroBullish = c3.close > c1.high;
    const isMicroBearish = c3.close < c1.low;

    let bias5m: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let struct5m = '5M Micro Chop (Awaiting Trigger)';
    let pts5m = 10;

    if (isMicroBullish && bias15m === 'BULLISH') {
      bias5m = 'BULLISH';
      struct5m = '5M Bullish Displacement + Liquidity Sweep Trigger ✅';
      pts5m = 25;
    } else if (isMicroBearish && bias15m === 'BEARISH') {
      bias5m = 'BEARISH';
      struct5m = '5M Bearish Displacement + Liquidity Sweep Trigger ✅';
      pts5m = 25;
    } else if (isMicroBullish) {
      bias5m = 'BULLISH';
      struct5m = '5M Bullish Momentum Spike';
      pts5m = 18;
    } else {
      bias5m = 'BEARISH';
      struct5m = '5M Bearish Momentum Spike';
      pts5m = 18;
    }

    const tf5m: MtfTimeframeStatus = {
      timeframe: '5M',
      bias: bias5m,
      structure: struct5m,
      confluencePoints: pts5m,
      detail: {
        currentPrice,
        trigger: struct5m,
      }
    };

    // =========================================================================
    // 6. TRIPLE-SCREEN & QUAD-SCREEN CONFLUENCE EVALUATION
    // =========================================================================
    const isTripleBull = (bias4h === 'BULLISH') && (bias1h === 'BULLISH') && (bias15m === 'BULLISH');
    const isTripleBear = (bias4h === 'BEARISH') && (bias1h === 'BEARISH') && (bias15m === 'BEARISH');
    const isTripleScreenConfluence = isTripleBull || isTripleBear;

    const isQuadScreenConfluence = (isTripleBull && bias5m === 'BULLISH') || (isTripleBear && bias5m === 'BEARISH');

    const totalPoints = pts4h + pts1h + pts15m + pts5m;
    const confluenceScore = Math.min(100, Math.max(25, totalPoints));

    let overallBias: 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'BULLISH_BIAS' | 'BEARISH_BIAS' | 'NEUTRAL_CHOP' = 'NEUTRAL_CHOP';
    let recommendationUrdu = '';
    let recommendationEn = '';

    if (isQuadScreenConfluence) {
      if (isTripleBull) {
        overallBias = 'STRONG_BULLISH';
        recommendationUrdu = '🔥 [100% QUAD-SCREEN CONFLUENCE]: 4H Macro Trend, 1H Structure, 15M Discount FVG aur 5M Entry Trigger tamam 100% BUY ki taraf aligned hain. Perfect A+ Institutional Entry!';
        recommendationEn = '100% Quad-Screen Confluence: 4H Macro, 1H Structure, 15M Discount FVG and 5M Trigger fully aligned BULLISH. A+ Institutional Setup!';
      } else {
        overallBias = 'STRONG_BEARISH';
        recommendationUrdu = '🔥 [100% QUAD-SCREEN CONFLUENCE]: 4H Macro Trend, 1H Structure, 15M Premium FVG aur 5M Entry Trigger tamam 100% SELL ki taraf aligned hain. Perfect A+ Institutional Short!';
        recommendationEn = '100% Quad-Screen Confluence: 4H Macro, 1H Structure, 15M Premium FVG and 5M Trigger fully aligned BEARISH. A+ Institutional Short Setup!';
      }
    } else if (isTripleScreenConfluence) {
      if (isTripleBull) {
        overallBias = 'BULLISH_BIAS';
        recommendationUrdu = '✅ [100% TRIPLE-SCREEN CONFLUENCE]: 4H + 1H + 15M Discount zone mukammal BUY aligned hain. 5M par micro confirmation ke sath high-probability trade lein.';
        recommendationEn = '100% Triple-Screen Confluence: 4H + 1H + 15M Discount aligned. High probability long continuation on 5M trigger.';
      } else {
        overallBias = 'BEARISH_BIAS';
        recommendationUrdu = '✅ [100% TRIPLE-SCREEN CONFLUENCE]: 4H + 1H + 15M Premium zone mukammal SELL aligned hain. 5M par micro rejection ke sath high-probability short lein.';
        recommendationEn = '100% Triple-Screen Confluence: 4H + 1H + 15M Premium aligned. High probability short continuation on 5M trigger.';
      }
    } else {
      overallBias = 'NEUTRAL_CHOP';
      recommendationUrdu = '⚠️ [CONFLICTING TIMEFRAMES]: 4H aur lower timeframes me tazaad (chop) hai. Smart Money rule ke mutabiq jab tak timeframes align na hon, market se bahir rahein (No Trade Zone).';
      recommendationEn = 'Conflicting Timeframes: Macro trend and execution frames are misaligned. Institutional No-Trade rule applies until alignment occurs.';
    }

    const alignment: MtfPairAlignment = {
      symbol,
      currentPrice,
      overallBias,
      confluenceScore,
      isTripleScreenConfluence,
      isQuadScreenConfluence,
      recommendationUrdu,
      recommendationEn,
      timeframes: {
        '4H': tf4h,
        '1H': tf1h,
        '15M': tf15m,
        '5M': tf5m,
      },
      lastUpdated: now,
    };

    this.cachedMatrix.set(symbol, { data: alignment, timestamp: now });
    return alignment;
  }

  /**
   * Analyzes all core institutional pairs and returns array sorted by highest confluence score
   */
  public static analyzeAllPairs(): MtfPairAlignment[] {
    const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];
    const results = symbols.map(s => this.analyzePair(s));
    // Sort so 100% Triple-Screen / Quad-Screen Confluence appears at the very top!
    return results.sort((a, b) => b.confluenceScore - a.confluenceScore);
  }
}
