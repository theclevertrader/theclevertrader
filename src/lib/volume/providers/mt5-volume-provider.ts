import { VolumeDataProvider } from './volume-data-provider';
import { NormalizedTick, VolumeDataSource } from '../volume-types';
import { Mt5Bridge } from '../../broker/mt5-bridge';

export class MT5VolumeProvider implements VolumeDataProvider {
  public sourceName: VolumeDataSource = 'MT5';
  private tickHistory: Map<string, NormalizedTick[]> = new Map();
  private maxHistoryPerSymbol: number = 2000;

  public isAvailable(): boolean {
    const config = Mt5Bridge.getConfig();
    // Strictly require an active heartbeat ping from live MT5 EA/bridge
    return Boolean(config.isConnected && config.lastPing && (Date.now() - config.lastPing < 60000));
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

    // Also check current MT5 tick from bridge
    const liveTicks = Mt5Bridge.getLiveTicks();
    const live = liveTicks[cleanSym];
    if (live && live.price) {
      const bid = live.bid || live.price;
      const ask = live.ask || live.price;
      const price = live.price;
      const latestTick: NormalizedTick = {
        symbol: cleanSym,
        timestamp: live.time || Date.now(),
        bid,
        ask,
        price,
        volume: 1.0,
        tickVolume: 1,
        side: price >= ask ? 'BUY' : (price <= bid ? 'SELL' : 'UNKNOWN'),
        source: 'MT5',
      };
      // Prevent duplicates
      const lastRecorded = existing[existing.length - 1];
      if (!lastRecorded || lastRecorded.timestamp !== latestTick.timestamp || lastRecorded.price !== latestTick.price) {
        this.recordTick(latestTick);
      }
    }

    return existing.slice(-limit);
  }
}

export const globalMt5VolumeProvider = new MT5VolumeProvider();
