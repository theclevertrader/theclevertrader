import { 
  NormalizedTick, 
  VolumeDeltaResult, 
  DeltaMethodology, 
  NormalizedMarketRecord, 
  CumulativeDeltaPoint, 
  FootprintCandle, 
  FootprintPriceLevel,
  CvdDivergence 
} from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';

export class VolumeDeltaEngine {
  /**
   * Calculates buy/sell volume, delta, cumulative delta and imbalance
   */
  public static calculateDelta(
    ticks: NormalizedTick[],
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): VolumeDeltaResult {
    const symbol = ticks[0]?.symbol || 'UNKNOWN';

    if (ticks.length === 0) {
      return {
        symbol,
        buyVolume: 0,
        sellVolume: 0,
        delta: 0,
        cumulativeDelta: 0,
        deltaPercentage: 0,
        buyRatio: 0.5,
        sellRatio: 0.5,
        isBuyImbalance: false,
        isSellImbalance: false,
        methodology: 'ESTIMATED_QUOTE_RULE_PROXY',
        timestamp: Date.now(),
      };
    }

    let buyVol = 0;
    let sellVol = 0;
    let methodology: DeltaMethodology = 'ESTIMATED_QUOTE_RULE_PROXY';

    for (let i = 0; i < ticks.length; i++) {
      const t = ticks[i];
      const vol = t.volume || t.tickVolume || 1.0;

      if (t.side === 'BUY') {
        buyVol += vol;
      } else if (t.side === 'SELL') {
        sellVol += vol;
      } else {
        // Fallback to Tick Rule Proxy (compare to prior tick price)
        methodology = 'TICK_RULE_PROXY';
        const prevPrice = i > 0 ? ticks[i - 1].price : t.price;
        if (t.price > prevPrice) {
          buyVol += vol;
        } else if (t.price < prevPrice) {
          sellVol += vol;
        } else {
          // Flat tick: distribute 50/50
          buyVol += vol * 0.5;
          sellVol += vol * 0.5;
        }
      }
    }

    const totalVol = buyVol + sellVol;
    const delta = buyVol - sellVol;
    const deltaPercentage = totalVol > 0 ? (delta / totalVol) * 100 : 0;
    const buyRatio = totalVol > 0 ? buyVol / totalVol : 0.5;
    const sellRatio = totalVol > 0 ? sellVol / totalVol : 0.5;

    const threshold = config.imbalanceRatioThreshold;
    const isBuyImbalance = sellVol > 0 ? (buyVol / sellVol) >= threshold : buyVol > 0;
    const isSellImbalance = buyVol > 0 ? (sellVol / buyVol) >= threshold : sellVol > 0;

    return {
      symbol,
      buyVolume: Math.round(buyVol * 100) / 100,
      sellVolume: Math.round(sellVol * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      cumulativeDelta: Math.round(delta * 100) / 100, // For given slice
      deltaPercentage: Math.round(deltaPercentage * 10) / 10,
      buyRatio: Math.round(buyRatio * 100) / 100,
      sellRatio: Math.round(sellRatio * 100) / 100,
      isBuyImbalance,
      isSellImbalance,
      methodology,
      timestamp: ticks[ticks.length - 1]?.timestamp || Date.now(),
    };
  }

  /**
   * Builds an institutional Footprint Candle (Bid x Ask cluster ladder)
   * with intra-candle POC and diagonal 300% stacked imbalance markers.
   */
  public static buildFootprintCandle(
    candle: NormalizedMarketRecord,
    tickSize: number = 0.5,
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): FootprintCandle {
    const isBull = candle.close >= candle.open;
    const span = Math.max(tickSize, candle.high - candle.low);
    const numBins = Math.min(16, Math.max(4, Math.round(span / tickSize)));
    const binStep = span / numBins;

    const levels: FootprintPriceLevel[] = [];
    let maxLevelVolume = 0;
    let intraPocPrice = candle.low;

    // Distribute volume into price bins (skewed towards close and body center)
    for (let i = 0; i < numBins; i++) {
      const price = Number((candle.low + (i + 0.5) * binStep).toFixed(2));
      const inBody = price >= Math.min(candle.open, candle.close) && price <= Math.max(candle.open, candle.close);
      
      // Volume weighting: body has 70% of volume, wicks have 30%
      const weightFactor = inBody ? 1.4 : 0.6;
      const baseLevelVol = (candle.volume / numBins) * weightFactor;
      
      // Directional bias
      const buyFraction = isBull ? 0.62 : 0.38;
      const buyVol = Math.round(baseLevelVol * buyFraction);
      const sellVol = Math.round(baseLevelVol * (1 - buyFraction));
      const totalVol = buyVol + sellVol;

      if (totalVol > maxLevelVolume) {
        maxLevelVolume = totalVol;
        intraPocPrice = price;
      }

      levels.push({
        price,
        bidVolume: sellVol, // sell market orders hit bid
        askVolume: buyVol,  // buy market orders lift ask
        totalVolume: totalVol,
        delta: buyVol - sellVol,
        isBuyImbalance: false,
        isSellImbalance: false,
      });
    }

    // Evaluate diagonal 300% imbalances (Ask at level i vs Bid at level i-1)
    const ratioThreshold = config.imbalanceRatioThreshold || 3.0;
    for (let i = 0; i < levels.length; i++) {
      if (i > 0) {
        // Buy imbalance: Ask[i] >= threshold * Bid[i-1]
        if (levels[i].askVolume >= levels[i - 1].bidVolume * ratioThreshold && levels[i].askVolume > 15) {
          levels[i].isBuyImbalance = true;
        }
      }
      if (i < levels.length - 1) {
        // Sell imbalance: Bid[i] >= threshold * Ask[i+1]
        if (levels[i].bidVolume >= levels[i + 1].askVolume * ratioThreshold && levels[i].bidVolume > 15) {
          levels[i].isSellImbalance = true;
        }
      }
    }

    const candleDelta = levels.reduce((acc, l) => acc + l.delta, 0);

    return {
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      delta: candleDelta,
      cvd: 0, // Assigned externally when assembling series
      pocPrice: intraPocPrice,
      levels,
    };
  }

  /**
   * Detects Institutional Cumulative Volume Delta (CVD) Divergences:
   * 1. BEARISH ABSORPTION: Price reaches a Higher High, but CVD forms a Lower High.
   * 2. BULLISH ACCUMULATION: Price reaches a Lower Low, but CVD forms a Higher Low.
   */
  public static calculateCvdDivergences(
    candles: NormalizedMarketRecord[],
    cvdSeries: CumulativeDeltaPoint[]
  ): CvdDivergence[] {
    if (candles.length < 10 || cvdSeries.length < 10) return [];

    const divergences: CvdDivergence[] = [];
    const windowSize = Math.min(20, candles.length);
    const recentCandles = candles.slice(-windowSize);
    const recentCvd = cvdSeries.slice(-windowSize);

    // Find price peaks and troughs in recent window
    let highestPriceIdx = 0;
    let lowestPriceIdx = 0;
    for (let i = 1; i < recentCandles.length; i++) {
      if (recentCandles[i].high > recentCandles[highestPriceIdx].high) highestPriceIdx = i;
      if (recentCandles[i].low < recentCandles[lowestPriceIdx].low) lowestPriceIdx = i;
    }

    // Prior half vs latter half comparison
    const half = Math.floor(recentCandles.length / 2);
    const p1High = Math.max(...recentCandles.slice(0, half).map(c => c.high));
    const p2High = Math.max(...recentCandles.slice(half).map(c => c.high));
    const cvd1High = Math.max(...recentCvd.slice(0, half).map(c => c.cvd));
    const cvd2High = Math.max(...recentCvd.slice(half).map(c => c.cvd));

    // Bearish Divergence (Absorption Trap)
    if (p2High > p1High && cvd2High < cvd1High) {
      divergences.push({
        type: 'BEARISH_ABSORPTION',
        priceLevel: p2High,
        timestamp: recentCandles[recentCandles.length - 1].timestamp,
        description: `Bearish CVD Absorption: Price made Higher High (${p2High.toFixed(2)} vs ${p1High.toFixed(2)}) but CVD made Lower High (${cvd2High} vs ${cvd1High}). Smart Money selling into retail breakout!`,
      });
    }

    // Bullish Divergence (Accumulation Sweep)
    const p1Low = Math.min(...recentCandles.slice(0, half).map(c => c.low));
    const p2Low = Math.min(...recentCandles.slice(half).map(c => c.low));
    const cvd1Low = Math.min(...recentCvd.slice(0, half).map(c => c.cvd));
    const cvd2Low = Math.min(...recentCvd.slice(half).map(c => c.cvd));

    if (p2Low < p1Low && cvd2Low > cvd1Low) {
      divergences.push({
        type: 'BULLISH_ACCUMULATION',
        priceLevel: p2Low,
        timestamp: recentCandles[recentCandles.length - 1].timestamp,
        description: `Bullish CVD Accumulation: Price made Lower Low (${p2Low.toFixed(2)} vs ${p1Low.toFixed(2)}) but CVD made Higher Low (${cvd2Low} vs ${cvd1Low}). Institutional limit bids absorbing sell pressure!`,
      });
    }

    return divergences;
  }
}
