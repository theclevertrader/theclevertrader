import { VolumeDataProvider } from './volume-data-provider';
import { NormalizedTick, VolumeDataSource } from '../volume-types';
import { fetchBiquoteTicks, BiquoteTick } from '../../data/biquote-ticks';

export class BiquoteTickProvider implements VolumeDataProvider {
  public sourceName: VolumeDataSource = 'BIQUOTE';
  private tickHistory: Map<string, NormalizedTick[]> = new Map();
  private latestQuotes: Map<string, BiquoteTick> = new Map();
  private maxHistoryPerSymbol: number = 2000;

  public isAvailable(): boolean {
    return true; // Free, open public MT5 streaming feed
  }

  public getLatestQuote(symbol: string): BiquoteTick | null {
    return this.latestQuotes.get(symbol.toUpperCase()) || null;
  }

  public recordTick(tick: NormalizedTick): void {
    const cleanSym = tick.symbol.toUpperCase();
    let history = this.tickHistory.get(cleanSym);
    if (!history) {
      history = [];
      this.tickHistory.set(cleanSym, history);
    }
    history.push(tick);
    if (history.length > this.maxHistoryPerSymbol) {
      history.shift();
    }
  }

  public async getTicks(symbol: string, limit: number = 200): Promise<NormalizedTick[]> {
    const cleanSym = symbol.toUpperCase();
    const existing = this.tickHistory.get(cleanSym) || [];

    try {
      const liveTicks = await fetchBiquoteTicks([cleanSym]);
      const tick = liveTicks?.[cleanSym];
      if (tick) {
        this.latestQuotes.set(cleanSym, tick);
      }
      if (tick && (tick.mid || tick.bid)) {
        const bid = tick.bid;
        const ask = tick.ask;
        const price = tick.mid || tick.bid;
        
        let side: 'BUY' | 'SELL' | 'UNKNOWN' = 'UNKNOWN';
        if (tick.direction === 'UP' || price >= ask) side = 'BUY';
        else if (tick.direction === 'DOWN' || price <= bid) side = 'SELL';

        const normalized: NormalizedTick = {
          symbol: cleanSym,
          timestamp: Date.now(),
          bid,
          ask,
          price,
          volume: 1.0,
          tickVolume: 1,
          side,
          source: 'BIQUOTE',
        };

        const last = existing[existing.length - 1];
        if (!last || last.price !== normalized.price || (normalized.timestamp - last.timestamp > 1000)) {
          this.recordTick(normalized);
        }
      }
    } catch (err) {
      console.warn('BiquoteTickProvider fetch error:', err);
    }

    return (this.tickHistory.get(cleanSym) || []).slice(-limit);
  }
}

export const globalBiquoteTickProvider = new BiquoteTickProvider();
