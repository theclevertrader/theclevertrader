import { NormalizedTick, VwapResult, TradingSession } from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';

export class VwapEngine {
  /**
   * Calculates Volume-Weighted Average Price and Standard Deviation Bands
   */
  public static calculateVwap(
    ticks: NormalizedTick[],
    session: TradingSession = 'DAILY',
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): VwapResult {
    const symbol = ticks[0]?.symbol || 'UNKNOWN';

    if (ticks.length === 0) {
      return {
        symbol,
        session,
        vwap: 0,
        upperBand1: 0,
        lowerBand1: 0,
        upperBand2: 0,
        lowerBand2: 0,
        stdDev: 0,
        totalVolume: 0,
        sampleCount: 0,
        timestamp: Date.now(),
      };
    }

    let cumPv = 0; // Cumulative Price * Volume
    let cumVol = 0; // Cumulative Volume

    for (const t of ticks) {
      const vol = t.volume || t.tickVolume || 1.0;
      cumPv += t.price * vol;
      cumVol += vol;
    }

    const vwap = cumVol > 0 ? cumPv / cumVol : ticks[ticks.length - 1].price;

    // Calculate Volume-Weighted Variance
    let sumSquaredDiffs = 0;
    for (const t of ticks) {
      const vol = t.volume || t.tickVolume || 1.0;
      sumSquaredDiffs += vol * Math.pow(t.price - vwap, 2);
    }

    const variance = cumVol > 0 ? sumSquaredDiffs / cumVol : 0;
    const stdDev = Math.sqrt(variance);

    const m1 = config.vwapBands.band1Multiplier;
    const m2 = config.vwapBands.band2Multiplier;

    return {
      symbol,
      session,
      vwap: Number(vwap.toFixed(5)),
      upperBand1: Number((vwap + stdDev * m1).toFixed(5)),
      lowerBand1: Number((vwap - stdDev * m1).toFixed(5)),
      upperBand2: Number((vwap + stdDev * m2).toFixed(5)),
      lowerBand2: Number((vwap - stdDev * m2).toFixed(5)),
      stdDev: Number(stdDev.toFixed(5)),
      totalVolume: Math.round(cumVol),
      sampleCount: ticks.length,
      timestamp: ticks[ticks.length - 1]?.timestamp || Date.now(),
    };
  }
}
