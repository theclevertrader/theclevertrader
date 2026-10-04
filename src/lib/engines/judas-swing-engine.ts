import { Candle } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';
import { generateCandles } from '../data/sample-data';
import { Mt5Bridge } from '../broker/mt5-bridge';

export interface AsianRangeData {
  symbol: string;
  asianHigh: number;
  asianLow: number;
  rangePips: number;
  isTightRange: boolean; // High probability consolidation primed for expansion
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  candleCount: number;
}

export interface JudasSwingData {
  symbol: string;
  currentPrice: number;
  midnightOpenPrice: number;
  isAboveMidnightOpen: boolean; // True = Premium (Short territory), False = Discount (Long territory)
  midnightOpenDistancePips: number;
  asianRange: AsianRangeData;
  judasStatus: 'BEARISH_JUDAS_SWING' | 'BULLISH_JUDAS_SWING' | 'EXPANDING' | 'INSIDE_RANGE';
  hasJudasTrigger: boolean;
  sweepCandleIndex?: number;
  sweepPrice?: number;
  sweptBoundary?: 'ASIAN_HIGH' | 'ASIAN_LOW';
  recommendedSetup?: {
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    rrRatio: number;
  };
  commentaryUrdu: string;
  commentaryEn: string;
  sessionState: 'ASIAN_SESSION' | 'LONDON_KILLZONE' | 'NY_KILLZONE' | 'OFF_HOURS';
  lastUpdated: number;
}

export class JudasSwingEngine {
  private static cachedData: Map<string, { data: JudasSwingData; timestamp: number }> = new Map();
  private static readonly CACHE_TTL_MS = 3000;

  /**
   * Identifies the Asian Range (00:00 UTC - 06:00 UTC) from a candle series.
   * If candles are synthetic or intraday, falls back to the earliest 24 bars of the daily cycle.
   */
  public static calculateAsianRange(candles: Candle[], symbol: string): AsianRangeData {
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const pipMultiplier = symbol.includes('XAU') ? 10 : symbol.includes('JPY') ? 100 : symbol.startsWith('US30') || symbol.startsWith('NAS') ? 1 : 10000;

    if (!candles || candles.length === 0) {
      const fallbackPrice = spec.currentPrice;
      return {
        symbol,
        asianHigh: Number((fallbackPrice * 1.002).toFixed(spec.priceDigits)),
        asianLow: Number((fallbackPrice * 0.998).toFixed(spec.priceDigits)),
        rangePips: 20,
        isTightRange: true,
        startIndex: 0,
        endIndex: 0,
        startTime: Date.now() - 6 * 3600 * 1000,
        endTime: Date.now(),
        candleCount: 0,
      };
    }

    // Filter candles whose UTC hours fall between 00:00 and 06:00
    const asianCandles: { candle: Candle; index: number }[] = [];
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const d = new Date(c.time);
      const hours = d.getUTCHours();
      if (hours >= 0 && hours < 6) {
        asianCandles.push({ candle: c, index: i });
      }
    }

    // If historical timestamps do not span 00:00-06:00 UTC (e.g. sample data window),
    // use the first 30% of the candle stream as the Asian baseline session
    let targetSlice: { candle: Candle; index: number }[] = asianCandles;
    if (targetSlice.length < 5) {
      const fallbackCount = Math.max(6, Math.floor(candles.length * 0.35));
      targetSlice = candles.slice(0, fallbackCount).map((c, i) => ({ candle: c, index: i }));
    }

    const highs = targetSlice.map(item => item.candle.high);
    const lows = targetSlice.map(item => item.candle.low);
    const asianHigh = Math.max(...highs);
    const asianLow = Math.min(...lows);
    const startIndex = targetSlice[0].index;
    const endIndex = targetSlice[targetSlice.length - 1].index;
    const startTime = targetSlice[0].candle.time;
    const endTime = targetSlice[targetSlice.length - 1].candle.time;

    const rangePoints = asianHigh - asianLow;
    const rangePips = Number((rangePoints * pipMultiplier).toFixed(1));

    // A tight range is prime for ICT Judas manipulation:
    // Gold < 120 pips ($12.0), FX < 35-40 pips, Indices < 80 pts
    const maxTightPips = symbol.includes('XAU') ? 120 : symbol.includes('JPY') ? 40 : symbol.startsWith('US30') ? 90 : 35;
    const isTightRange = rangePips <= maxTightPips;

    return {
      symbol,
      asianHigh: Number(asianHigh.toFixed(spec.priceDigits)),
      asianLow: Number(asianLow.toFixed(spec.priceDigits)),
      rangePips,
      isTightRange,
      startIndex,
      endIndex,
      startTime,
      endTime,
      candleCount: targetSlice.length,
    };
  }

  /**
   * Extracts the 00:00 UTC Midnight Open (True Day Open)
   */
  public static calculateMidnightOpen(candles: Candle[], symbol: string): number {
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    if (!candles || candles.length === 0) return spec.currentPrice;

    // Find candle closest to 00:00 UTC
    for (let i = 0; i < candles.length; i++) {
      const d = new Date(candles[i].time);
      if (d.getUTCHours() === 0) {
        return Number(candles[i].open.toFixed(spec.priceDigits));
      }
    }

    // Default to the open of the first candle in the session
    return Number(candles[0].open.toFixed(spec.priceDigits));
  }

  /**
   * Detects London Open / New York Judas Swings (Fakeouts & Liquidity Raids)
   */
  public static analyzeJudasSwing(
    candles: Candle[],
    symbol: string,
    providedLivePrice?: number
  ): JudasSwingData {
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const liveTicks = Mt5Bridge.getLiveTicks();
    const liveTick = liveTicks[symbol];
    const livePrice = providedLivePrice || (liveTick ? liveTick.price : spec.currentPrice);

    const pipMultiplier = symbol.includes('XAU') ? 10 : symbol.includes('JPY') ? 100 : symbol.startsWith('US30') || symbol.startsWith('NAS') ? 1 : 10000;

    const asianRange = this.calculateAsianRange(candles, symbol);
    const midnightOpenPrice = this.calculateMidnightOpen(candles, symbol);

    const currentPrice = livePrice || candles[candles.length - 1]?.close || spec.currentPrice;
    const isAboveMidnightOpen = currentPrice >= midnightOpenPrice;
    const midnightDistPoints = Math.abs(currentPrice - midnightOpenPrice);
    const midnightOpenDistancePips = Number((midnightDistPoints * pipMultiplier).toFixed(1));

    // Determine current market session state based on UTC hour
    const nowUtcHours = new Date().getUTCHours();
    let sessionState: 'ASIAN_SESSION' | 'LONDON_KILLZONE' | 'NY_KILLZONE' | 'OFF_HOURS' = 'OFF_HOURS';
    if (nowUtcHours >= 0 && nowUtcHours < 6) sessionState = 'ASIAN_SESSION';
    else if (nowUtcHours >= 7 && nowUtcHours <= 10) sessionState = 'LONDON_KILLZONE';
    else if (nowUtcHours >= 12 && nowUtcHours <= 15) sessionState = 'NY_KILLZONE';

    // Scan post-Asian candles for Judas Swings
    const postAsianCandles = candles.slice(asianRange.endIndex + 1);

    let judasStatus: 'BEARISH_JUDAS_SWING' | 'BULLISH_JUDAS_SWING' | 'EXPANDING' | 'INSIDE_RANGE' = 'INSIDE_RANGE';
    let hasJudasTrigger = false;
    let sweepCandleIndex: number | undefined;
    let sweepPrice: number | undefined;
    let sweptBoundary: 'ASIAN_HIGH' | 'ASIAN_LOW' | undefined;
    let recommendedSetup: JudasSwingData['recommendedSetup'];
    let commentaryUrdu = '';
    let commentaryEn = '';

    // Check for Bearish Judas Swing (Bull Trap):
    // Price spike ABOVE Asian High, followed by rejection and close back below Asian High
    let foundBullTrap = false;
    let foundBearTrap = false;

    for (let i = 0; i < postAsianCandles.length; i++) {
      const c = postAsianCandles[i];
      const globalIdx = asianRange.endIndex + 1 + i;

      // 1. Bearish Judas Swing Check (Raid on Asian High / Buy-Side Liquidity)
      if (c.high > asianRange.asianHigh) {
        // Did it reject and close back below Asian High or print a wick?
        const isRejection = c.close < asianRange.asianHigh || (c.high - Math.max(c.open, c.close)) > (c.high - c.low) * 0.45;
        if (isRejection || currentPrice < asianRange.asianHigh) {
          foundBullTrap = true;
          sweepCandleIndex = globalIdx;
          sweepPrice = c.high;
          sweptBoundary = 'ASIAN_HIGH';
          break;
        }
      }

      // 2. Bullish Judas Swing Check (Raid on Asian Low / Sell-Side Liquidity)
      if (c.low < asianRange.asianLow) {
        // Did it reject and close back above Asian Low or print a lower wick?
        const isRejection = c.close > asianRange.asianLow || (Math.min(c.open, c.close) - c.low) > (c.high - c.low) * 0.45;
        if (isRejection || currentPrice > asianRange.asianLow) {
          foundBearTrap = true;
          sweepCandleIndex = globalIdx;
          sweepPrice = c.low;
          sweptBoundary = 'ASIAN_LOW';
          break;
        }
      }
    }

    // Evaluate live current price against boundaries if post-Asian candles were flat
    if (!foundBullTrap && !foundBearTrap) {
      if (currentPrice > asianRange.asianHigh * 1.0005) {
        judasStatus = 'EXPANDING';
        commentaryUrdu = `Market Asian High (${asianRange.asianHigh}) se ooper expand kar rahi hai. London/NY confirmation ka intezar karein.`;
        commentaryEn = `Market expanding above Asian High (${asianRange.asianHigh}). Awaiting confirmation.`;
      } else if (currentPrice < asianRange.asianLow * 0.9995) {
        judasStatus = 'EXPANDING';
        commentaryUrdu = `Market Asian Low (${asianRange.asianLow}) se neeche expand kar rahi hai. London/NY confirmation ka intezar karein.`;
        commentaryEn = `Market expanding below Asian Low (${asianRange.asianLow}). Awaiting confirmation.`;
      } else {
        judasStatus = 'INSIDE_RANGE';
        commentaryUrdu = `Price Asian Box ke andar consolidate kar rahi hai (${asianRange.asianLow} - ${asianRange.asianHigh}, ${asianRange.rangePips} pips). Judas Swing trigger ka intezar hai.`;
        commentaryEn = `Price consolidating inside Asian Range (${asianRange.asianLow} - ${asianRange.asianHigh}, ${asianRange.rangePips} pips). Awaiting Judas sweep.`;
      }
    }

    if (foundBullTrap) {
      judasStatus = 'BEARISH_JUDAS_SWING';
      hasJudasTrigger = true;
      const fakeHigh = sweepPrice || (asianRange.asianHigh * 1.001);
      const stopLoss = Number((fakeHigh + (fakeHigh * 0.0005)).toFixed(spec.priceDigits));
      const takeProfit = Number(asianRange.asianLow.toFixed(spec.priceDigits));
      const risk = Math.max(0.01, stopLoss - currentPrice);
      const reward = Math.max(0.01, currentPrice - takeProfit);
      const rrRatio = Number((reward / risk).toFixed(2));

      recommendedSetup = {
        direction: 'SELL',
        entryPrice: Number(currentPrice.toFixed(spec.priceDigits)),
        stopLoss,
        takeProfit,
        rrRatio: rrRatio > 0 ? rrRatio : 2.5,
      };

      commentaryUrdu = `⚡ [BEARISH JUDAS SWING DETECTED]: London Open ne Asian High (${asianRange.asianHigh}) ko fake break (Bull Trap) kiya aur wapis andar gir gayi. Midnight Open (${midnightOpenPrice}) se ooper Premium zone me institutional SELL trigger tayyar hai!`;
      commentaryEn = `⚡ [BEARISH JUDAS SWING DETECTED]: London Open engineered a fakeout above Asian High (${asianRange.asianHigh}) trapping breakout buyers. Institutional SELL setup armed targeting Asian Low (${asianRange.asianLow})!`;
    } else if (foundBearTrap) {
      judasStatus = 'BULLISH_JUDAS_SWING';
      hasJudasTrigger = true;
      const fakeLow = sweepPrice || (asianRange.asianLow * 0.999);
      const stopLoss = Number((fakeLow - (fakeLow * 0.0005)).toFixed(spec.priceDigits));
      const takeProfit = Number(asianRange.asianHigh.toFixed(spec.priceDigits));
      const risk = Math.max(0.01, currentPrice - stopLoss);
      const reward = Math.max(0.01, takeProfit - currentPrice);
      const rrRatio = Number((reward / risk).toFixed(2));

      recommendedSetup = {
        direction: 'BUY',
        entryPrice: Number(currentPrice.toFixed(spec.priceDigits)),
        stopLoss,
        takeProfit,
        rrRatio: rrRatio > 0 ? rrRatio : 2.5,
      };

      commentaryUrdu = `⚡ [BULLISH JUDAS SWING DETECTED]: London Open ne Asian Low (${asianRange.asianLow}) ko fake break (Bear Trap) kiya aur wapis ooper nikal gayi. Midnight Open (${midnightOpenPrice}) se neeche Discount zone me institutional BUY trigger tayyar hai!`;
      commentaryEn = `⚡ [BULLISH JUDAS SWING DETECTED]: London Open swept Sell-Side Liquidity below Asian Low (${asianRange.asianLow}) and rejected sharply. Institutional BUY setup armed targeting Asian High (${asianRange.asianHigh})!`;
    }

    return {
      symbol,
      currentPrice: Number(currentPrice.toFixed(spec.priceDigits)),
      midnightOpenPrice,
      isAboveMidnightOpen,
      midnightOpenDistancePips,
      asianRange,
      judasStatus,
      hasJudasTrigger,
      sweepCandleIndex,
      sweepPrice,
      sweptBoundary,
      recommendedSetup,
      commentaryUrdu,
      commentaryEn,
      sessionState,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Scans a single pair with caching
   */
  public static scanPair(symbol: string): JudasSwingData {
    const cached = this.cachedData.get(symbol);
    const now = Date.now();
    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data;
    }

    const candles = generateCandles(symbol, 75, 15, 'BULLISH');
    const data = this.analyzeJudasSwing(candles, symbol);
    this.cachedData.set(symbol, { data, timestamp: now });
    return data;
  }

  /**
   * Scans all 7 core institutional pairs
   */
  public static scanAllPairs(): JudasSwingData[] {
    const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];
    const list = symbols.map(s => this.scanPair(s));
    // Prioritize active Judas Swing triggers at the top
    return list.sort((a, b) => (b.hasJudasTrigger ? 1 : 0) - (a.hasJudasTrigger ? 1 : 0));
  }
}
