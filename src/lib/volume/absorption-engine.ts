import { NormalizedTick, AbsorptionResult } from './volume-types';
import { VolumeDeltaEngine } from './volume-delta-engine';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';

export class AbsorptionEngine {
  /**
   * Detects institutional absorption where large liquidity absorbs market orders
   * without allowing price to displace.
   */
  public static detectAbsorption(
    ticks: NormalizedTick[],
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): AbsorptionResult {
    const symbol = ticks[0]?.symbol || 'UNKNOWN';

    if (ticks.length < 15) {
      return {
        symbol,
        type: 'NONE',
        confidence: 0,
        priceLevel: 0,
        deltaImbalance: 0,
        volumeConcentration: 0,
        description: 'Insufficient tick samples for absorption analysis.',
        timestamp: Date.now(),
      };
    }

    const prices = ticks.map(t => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Slice into two halves: previous vs recent
    const midIdx = Math.floor(ticks.length / 2);
    const recentTicks = ticks.slice(midIdx);

    const deltaResult = VolumeDeltaEngine.calculateDelta(recentTicks, config);
    const totalRecentVol = deltaResult.buyVolume + deltaResult.sellVolume;

    // Average price step
    const avgStep = priceRange / Math.max(1, ticks.length);

    // Criteria 1: Heavy delta imbalance with small price range (absorption signature)
    const isHeavySellPressure = deltaResult.sellRatio >= 0.65;
    const isHeavyBuyPressure = deltaResult.buyRatio >= 0.65;

    // Current price relative to range
    const currentPrice = ticks[ticks.length - 1].price;
    const isNearLows = currentPrice <= minPrice + priceRange * 0.25;
    const isNearHighs = currentPrice >= maxPrice - priceRange * 0.25;

    // ABSORPTION BUY: Aggressive sellers hitting the bid, but price refuses to break lower (Supported by Limit Buy Wall)
    if (isHeavySellPressure && isNearLows && priceRange <= avgStep * 10) {
      const confidence = Math.min(95, Math.round(50 + deltaResult.sellRatio * 40));
      return {
        symbol,
        type: 'ABSORPTION_BUY',
        confidence,
        priceLevel: Number(minPrice.toFixed(5)),
        deltaImbalance: -Math.abs(deltaResult.delta),
        volumeConcentration: totalRecentVol,
        description: `Institutional Absorption BUY: Heavy sell volume (${Math.round(deltaResult.sellRatio * 100)}%) absorbed at ${minPrice.toFixed(5)} without downward displacement.`,
        timestamp: Date.now(),
      };
    }

    // ABSORPTION SELL: Aggressive buyers lifting the offer, but price refuses to break higher (Capped by Limit Sell Wall)
    if (isHeavyBuyPressure && isNearHighs && priceRange <= avgStep * 10) {
      const confidence = Math.min(95, Math.round(50 + deltaResult.buyRatio * 40));
      return {
        symbol,
        type: 'ABSORPTION_SELL',
        confidence,
        priceLevel: Number(maxPrice.toFixed(5)),
        deltaImbalance: Math.abs(deltaResult.delta),
        volumeConcentration: totalRecentVol,
        description: `Institutional Absorption SELL: Aggressive buy volume (${Math.round(deltaResult.buyRatio * 100)}%) absorbed at ${maxPrice.toFixed(5)} without upward displacement.`,
        timestamp: Date.now(),
      };
    }

    return {
      symbol,
      type: 'NONE',
      confidence: 0,
      priceLevel: Number(currentPrice.toFixed(5)),
      deltaImbalance: deltaResult.delta,
      volumeConcentration: totalRecentVol,
      description: 'Balanced two-way auction. No abnormal absorption detected.',
      timestamp: Date.now(),
    };
  }
}
