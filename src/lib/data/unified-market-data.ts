import { Candle, SymbolSpec } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';
import { Mt5Bridge, LiveTick } from '../broker/mt5-bridge';
import { fetchBiquoteTicks, BiquoteTick } from './biquote-ticks';
import { getLiveMarketCandles } from './live-candles';
import { getRealOrderBook } from './real-orderbook';
import { SessionFilterEngine } from '../engines/session-filter-engine';

export type FeedConnectionQuality = 'LIVE' | 'DEGRADED' | 'STALE' | 'DISCONNECTED';

export interface NormalizedTick {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spreadPips: number;
  high24h: number;
  low24h: number;
  change24h: number;
  quality: FeedConnectionQuality;
  feedSource: string;
  timestamp: number;
}

export interface NormalizedMarketSnapshot {
  symbol: string;
  timeframe: number;
  currentPrice: number;
  isMarketOpen: boolean;
  marketState: 'OPEN' | 'WEEKEND_CLOSED' | 'ROLLOVER';
  marketStatusText: string;
  marketOpensAt?: string;
  spec: SymbolSpec & { quality: FeedConnectionQuality; feedSource: string };
  tick?: NormalizedTick;
  ticks: Record<string, NormalizedTick>;
  candles: Candle[];
  orderBook: {
    bids: Array<{ p: number; s: number }>;
    asks: Array<{ p: number; s: number }>;
    spread?: number;
    source?: string;
  };
  feedQuality: FeedConnectionQuality;
  feedSource: string;
  timestamp: number;
}

export class UnifiedMarketDataService {
  /**
   * Sanitizes, validates, and sorts candles chronologically.
   * Filters out NaNs, inverted highs/lows, and duplicate timestamps.
   */
  public static validateAndCleanCandles(candles: any[]): Candle[] {
    if (!Array.isArray(candles) || candles.length === 0) return [];

    const seenTimes = new Set<number>();
    const cleaned: Candle[] = [];
    const now = Date.now();

    for (const c of candles) {
      if (!c) continue;
      const rawTime = Number(c.time || c.timestamp || 0);
      const open = Number(c.open);
      const high = Number(c.high);
      const low = Number(c.low);
      const close = Number(c.close);
      const volume = Math.max(0, Number(c.volume || 0));

      // Invalidation checks
      if (isNaN(rawTime) || rawTime <= 0) continue;
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;

      // Normalize time to milliseconds if in seconds
      const timeMs = rawTime < 10_000_000_000 ? rawTime * 1000 : rawTime;

      // Reject future dates (Twelve Data forward-dated ticks glitch)
      if (timeMs > now + 60_000) continue;

      // Correct inverted high/low boundaries if contaminated by provider glitch
      const trueHigh = Math.max(high, open, close);
      const trueLow = Math.min(low, open, close);

      if (!seenTimes.has(timeMs)) {
        seenTimes.add(timeMs);
        cleaned.push({
          time: timeMs,
          open,
          high: trueHigh,
          low: trueLow,
          close,
          volume,
        });
      }
    }

    // Sort ascending chronologically
    cleaned.sort((a, b) => a.time - b.time);

    // If all candles are flat (identical open/close across entire series), discard
    if (cleaned.length > 5) {
      const firstOpen = cleaned[0].open;
      const allFlat = cleaned.every(c => Math.abs(c.open - firstOpen) < 0.0001);
      if (allFlat) return [];
    }

    return cleaned;
  }

  /**
   * Normalizes tick data from MT5 Direct Bridge, Biquote, or fallback quotes.
   */
  public static normalizeTick(
    symbol: string,
    rawTick?: LiveTick | BiquoteTick | any,
    baseSpec?: SymbolSpec
  ): NormalizedTick {
    const spec = baseSpec || INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const now = Date.now();

    if (!rawTick) {
      return {
        symbol,
        price: spec.currentPrice,
        bid: Number((spec.currentPrice - (spec.spreadPips * spec.pipSize) / 2).toFixed(spec.priceDigits)),
        ask: Number((spec.currentPrice + (spec.spreadPips * spec.pipSize) / 2).toFixed(spec.priceDigits)),
        spreadPips: spec.spreadPips,
        high24h: spec.high24h,
        low24h: spec.low24h,
        change24h: spec.change24h,
        quality: 'STALE',
        feedSource: 'INSTITUTIONAL_SPEC_DEFAULT',
        timestamp: now,
      };
    }

    const bid = Number(rawTick.bid || rawTick.price || spec.currentPrice);
    const ask = Number(rawTick.ask || (bid + spec.spreadPips * spec.pipSize));
    const price = Number(rawTick.price || rawTick.mid || (bid + ask) / 2);
    const high24h = Number(rawTick.high || spec.high24h);
    const low24h = Number(rawTick.low || spec.low24h);
    const change24h = Number(rawTick.change ?? rawTick.dayDiffPercent ?? spec.change24h);

    const tickTime = Number(rawTick.time || rawTick.timestamp || now);
    const ageMs = now - (tickTime < 10_000_000_000 ? tickTime * 1000 : tickTime);

    let quality: FeedConnectionQuality = 'LIVE';
    if (ageMs > 60_000) {
      quality = 'STALE';
    } else if (ageMs > 15_000) {
      quality = 'DEGRADED';
    }

    let spreadPips = spec.spreadPips;
    if (ask > bid && spec.pipSize > 0) {
      spreadPips = Number(((ask - bid) / spec.pipSize).toFixed(1));
    }

    let feedSource = 'BIQUOTE_MT5';
    if (rawTick.source) {
      feedSource = String(rawTick.source);
    } else if (rawTick.bid && rawTick.ask && !rawTick.source) {
      feedSource = 'MT5_DIRECT_BRIDGE';
    }

    return {
      symbol,
      price: Number(price.toFixed(spec.priceDigits)),
      bid: Number(bid.toFixed(spec.priceDigits)),
      ask: Number(ask.toFixed(spec.priceDigits)),
      spreadPips,
      high24h,
      low24h,
      change24h,
      quality,
      feedSource,
      timestamp: tickTime,
    };
  }

  /**
   * Unified Single Source of Truth snapshot generation.
   * Produces an authoritative, schema-compliant snapshot for the entire terminal.
   */
  public static async getSnapshot(
    symbol: string,
    timeframeMinutes: number = 15
  ): Promise<NormalizedMarketSnapshot> {
    const sym = symbol.toUpperCase();
    const baseSpec = INSTITUTIONAL_SYMBOLS[sym] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const now = Date.now();

    // 1. Gather live ticks from MT5 Direct Bridge
    const mt5Ticks = Mt5Bridge.getLiveTicks();
    const rawTicksRecord: Record<string, any> = { ...mt5Ticks };

    // 2. Augment with Biquote Hub Ticks
    try {
      const bqTicks = await fetchBiquoteTicks();
      if (bqTicks) {
        for (const [s, t] of Object.entries(bqTicks)) {
          if (!rawTicksRecord[s]) {
            rawTicksRecord[s] = t;
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // 3. Build normalized ticks dictionary
    const normalizedTicks: Record<string, NormalizedTick> = {};
    for (const [s, spec] of Object.entries(INSTITUTIONAL_SYMBOLS)) {
      normalizedTicks[s] = this.normalizeTick(s, rawTicksRecord[s], spec);
    }

    const currentTick = normalizedTicks[sym] || this.normalizeTick(sym, rawTicksRecord[sym], baseSpec);

    // 4. Fetch real-time live candles
    let rawCandles: Candle[] = [];
    let candleSource = 'LIVE_STREAM';
    try {
      const candleResult = await getLiveMarketCandles(sym, timeframeMinutes, 180, currentTick.price);
      rawCandles = candleResult.candles || [];
      candleSource = candleResult.source || 'LIVE_STREAM';
    } catch (e) {
      console.warn(`[UnifiedMarketData] Candle fetch failed for ${sym}:`, e);
    }

    const cleanedCandles = this.validateAndCleanCandles(rawCandles);

    // 5. Harmonize current price with candles without overriding real broker ticks
    let currentPrice = currentTick.price;
    if (cleanedCandles.length > 0) {
      const last = cleanedCandles[cleanedCandles.length - 1];
      if (currentTick.feedSource === 'SYNTHETIC_STUB' && last.close > 0) {
        currentPrice = last.close;
        currentTick.price = last.close;
      } else if (currentPrice > 0) {
        last.close = currentPrice;
        last.high = Math.max(last.high, currentPrice);
        last.low = Math.min(last.low, currentPrice);
      }
    }

    // 6. Fetch real L2 Order Book
    let orderBook: any = { bids: [], asks: [] };
    try {
      orderBook = await getRealOrderBook(sym);
    } catch {
      // Non-blocking
    }

    // 7. Assess overall feed quality & market open/closed status
    const marketInfo = SessionFilterEngine.isMarketOpen(sym, now);
    let feedQuality: FeedConnectionQuality = currentTick.quality;
    if (cleanedCandles.length === 0) {
      feedQuality = 'DEGRADED';
    }

    return {
      symbol: sym,
      timeframe: timeframeMinutes,
      currentPrice,
      isMarketOpen: marketInfo.isOpen,
      marketState: marketInfo.state,
      marketStatusText: marketInfo.label,
      marketOpensAt: marketInfo.opensAt,
      spec: {
        ...baseSpec,
        currentPrice,
        quality: feedQuality,
        feedSource: candleSource !== 'ANCHORED_REAL_PRICE' ? candleSource : currentTick.feedSource,
      },
      tick: currentTick,
      ticks: normalizedTicks,
      candles: cleanedCandles,
      orderBook,
      feedQuality,
      feedSource: candleSource !== 'ANCHORED_REAL_PRICE' ? candleSource : currentTick.feedSource,
      timestamp: now,
    };
  }
}
