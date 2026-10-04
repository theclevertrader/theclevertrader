import { VolumeDataProvider } from './volume-data-provider';
import { NormalizedTick, VolumeDataSource } from '../volume-types';
import { fetchTwelveDataCandles } from '../../data/twelve-data';
import { Candle } from '../../types/trading';

export class TwelveDataCandleProvider implements VolumeDataProvider {
  public sourceName: VolumeDataSource = 'TWELVE_DATA';

  public isAvailable(): boolean {
    return Boolean(process.env.TWELVE_DATA_API_KEY);
  }

  public recordTick(_tick: NormalizedTick): void {
    // Candle provider generates synthetic or intra-bar ticks from historical OHLCV
  }

  private tickCache = new Map<string, { ticks: NormalizedTick[]; timestamp: number }>();

  public async getTicks(symbol: string, limit: number = 500): Promise<NormalizedTick[]> {
    if (!this.isAvailable()) return [];

    const clean = symbol.toUpperCase();
    const cached = this.tickCache.get(clean);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.ticks.slice(-limit);
    }

    try {
      // Fetch 1h candles (up to 50 hours) to cover full historical session cycles (Asia, London, New York)
      // even over weekends or off-market hours
      let candles = await fetchTwelveDataCandles(symbol, 60, 50);
      
      // If 1h candles return empty, fallback to 15m candles
      if (!candles || candles.length === 0) {
        candles = await fetchTwelveDataCandles(symbol, 15, 100);
      }
      if (!candles || candles.length === 0) {
        return cached ? cached.ticks.slice(-limit) : [];
      }

      const ticks = this.convertCandlesToTicks(symbol, candles, limit);
      this.tickCache.set(clean, { ticks, timestamp: Date.now() });
      return ticks;
    } catch (err) {
      console.warn('TwelveDataCandleProvider error:', err);
      return cached ? cached.ticks.slice(-limit) : [];
    }
  }

  public convertCandlesToTicks(symbol: string, rawCandles: Candle[], limit: number = 500): NormalizedTick[] {
    const sym = symbol.toUpperCase();
    
    // Determine minimum price step based on instrument
    let minStep = 0.0001;
    if (sym.startsWith('XAU')) minStep = 0.10;
    else if (sym.includes('JPY')) minStep = 0.01;
    else if (sym.startsWith('US30') || sym.startsWith('NAS') || sym.startsWith('SPX')) minStep = 0.5;
    else if (sym.startsWith('BTC')) minStep = 5.0;

    // Filter out repetitive frozen/closed market candles (keep max 2 consecutive flat candles)
    // to prevent weekend flatlines from drowning out genuine trading sessions
    const activeCandles: Candle[] = [];
    let consecutiveFlat = 0;
    const flatThreshold = minStep * 3;

    for (const c of rawCandles) {
      const range = Math.abs(c.high - c.low);
      if (range < flatThreshold) {
        consecutiveFlat++;
        if (consecutiveFlat <= 2) {
          activeCandles.push(c);
        }
      } else {
        consecutiveFlat = 0;
        activeCandles.push(c);
      }
    }

    const candlesToUse = activeCandles.length > 0 ? activeCandles : rawCandles;
    const ticks: NormalizedTick[] = [];

    // Target total ticks distributed across all active candles
    const slicesPerCandle = Math.min(15, Math.max(6, Math.floor(limit / Math.max(1, candlesToUse.length))));

    for (const c of candlesToUse) {
      const volPerBar = Math.max(1, c.volume || 25);
      const isBullish = c.close >= c.open;
      const low = Math.min(c.low, c.high);
      const high = Math.max(c.low, c.high);
      const range = high - low;
      const bodyLow = Math.min(c.open, c.close);
      const bodyHigh = Math.max(c.open, c.close);

      if (range <= minStep) {
        ticks.push({
          symbol: sym,
          timestamp: c.time,
          bid: c.close,
          ask: c.close + minStep,
          price: Number(c.close.toFixed(5)),
          volume: Math.round(volPerBar),
          tickVolume: Math.round(volPerBar),
          side: isBullish ? 'BUY' : 'SELL',
          source: 'TWELVE_DATA',
        });
        continue;
      }

      // Slice candle into price levels across its actual range
      const numSlices = Math.min(18, Math.max(4, Math.round(range / (minStep * 4)) || slicesPerCandle));
      const sliceStep = range / Math.max(1, numSlices - 1);
      const volPerSlice = volPerBar / numSlices;

      for (let s = 0; s < numSlices; s++) {
        const slicePrice = Number((low + s * sliceStep).toFixed(5));
        const isInBody = slicePrice >= bodyLow && slicePrice <= bodyHigh;
        // Body has 1.35x volume weight of wicks
        const sliceVol = Math.max(1, Math.round(isInBody ? volPerSlice * 1.35 : volPerSlice * 0.65));
        
        let side: 'BUY' | 'SELL' = isBullish ? 'BUY' : 'SELL';
        if (isBullish && slicePrice < (low + high) / 2) {
          side = s % 3 === 0 ? 'BUY' : 'SELL';
        } else if (!isBullish && slicePrice > (low + high) / 2) {
          side = s % 3 === 0 ? 'SELL' : 'BUY';
        }

        ticks.push({
          symbol: sym,
          timestamp: c.time + s * 1000,
          bid: slicePrice,
          ask: slicePrice + minStep,
          price: slicePrice,
          volume: sliceVol,
          tickVolume: sliceVol,
          side,
          source: 'TWELVE_DATA',
        });
      }
    }

    return ticks.slice(-limit);
  }
}

export const globalTwelveDataProvider = new TwelveDataCandleProvider();
