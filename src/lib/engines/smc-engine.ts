import { Candle, SwingPoint, StructureEvent, OrderBlock, FairValueGap, LiquidityPool } from '../types/trading';

export class SmcEngine {
  /**
   * Detects swing highs and swing lows using a lookback window
   */
  public static detectSwingPoints(candles: Candle[], lookback: number = 3): SwingPoint[] {
    const points: SwingPoint[] = [];

    for (let i = lookback; i < candles.length - lookback; i++) {
      const current = candles[i];
      let isHigh = true;
      let isLow = true;

      for (let j = 1; j <= lookback; j++) {
        if (candles[i - j].high >= current.high || candles[i + j].high >= current.high) {
          isHigh = false;
        }
        if (candles[i - j].low <= current.low || candles[i + j].low <= current.low) {
          isLow = false;
        }
      }

      if (isHigh) {
        let label: 'HH' | 'LH' = 'HH';
        const lastHigh = [...points].reverse().find(p => p.type === 'SWING_HIGH');
        if (lastHigh && current.high < lastHigh.price) {
          label = 'LH';
        }
        points.push({
          index: i,
          time: current.time,
          price: current.high,
          type: 'SWING_HIGH',
          label,
        });
      }

      if (isLow) {
        let label: 'HL' | 'LL' = 'HL';
        const lastLow = [...points].reverse().find(p => p.type === 'SWING_LOW');
        if (lastLow && current.low < lastLow.price) {
          label = 'LL';
        }
        points.push({
          index: i,
          time: current.time,
          price: current.low,
          type: 'SWING_LOW',
          label,
        });
      }
    }

    return points;
  }

  /**
   * Identifies Break of Structure (BOS), Change of Character (CHoCH), and Market Structure Shift (MSS)
   */
  public static detectStructureEvents(candles: Candle[], swingPoints: SwingPoint[]): StructureEvent[] {
    const events: StructureEvent[] = [];
    const highs = swingPoints.filter(p => p.type === 'SWING_HIGH');
    const lows = swingPoints.filter(p => p.type === 'SWING_LOW');

    let currentTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];

      // Check bullish break of prior swing high
      for (const sh of highs) {
        if (sh.index < i && candle.close > sh.price) {
          const alreadyLogged = events.some(e => e.breakTime === candle.time && e.direction === 'BULLISH');
          if (!alreadyLogged) {
            const isReversal = currentTrend === 'BEARISH';
            events.push({
              type: isReversal ? 'CHoCH' : 'BOS',
              direction: 'BULLISH',
              brokenPrice: sh.price,
              breakTime: candle.time,
              candleIndex: i,
              description: isReversal 
                ? `Bullish CHoCH: Broken prior Lower High at ${sh.price.toFixed(2)} with displacement` 
                : `Bullish BOS: Continuation break above swing high ${sh.price.toFixed(2)}`,
            });
            currentTrend = 'BULLISH';
          }
        }
      }

      // Check bearish break of prior swing low
      for (const sl of lows) {
        if (sl.index < i && candle.close < sl.price) {
          const alreadyLogged = events.some(e => e.breakTime === candle.time && e.direction === 'BEARISH');
          if (!alreadyLogged) {
            const isReversal = currentTrend === 'BULLISH';
            events.push({
              type: isReversal ? 'CHoCH' : 'BOS',
              direction: 'BEARISH',
              brokenPrice: sl.price,
              breakTime: candle.time,
              candleIndex: i,
              description: isReversal 
                ? `Bearish CHoCH: Broken prior Higher Low at ${sl.price.toFixed(2)} with displacement` 
                : `Bearish BOS: Continuation break below swing low ${sl.price.toFixed(2)}`,
            });
            currentTrend = 'BEARISH';
          }
        }
      }
    }

    return events;
  }

  /**
   * Detects Fair Value Gaps (FVG) and checks for mitigation
   */
  public static detectFairValueGaps(candles: Candle[]): FairValueGap[] {
    const fvgs: FairValueGap[] = [];

    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = candles[i];

      // Bullish FVG: Low of candle 3 is above High of candle 1
      if (c3.low > c1.high) {
        const top = c3.low;
        const bottom = c1.high;
        let isFilled = false;

        for (let k = i + 1; k < candles.length; k++) {
          if (candles[k].low <= bottom) {
            isFilled = true;
            break;
          }
        }

        fvgs.push({
          id: `bull-fvg-${c2.time}`,
          type: 'BULLISH',
          top,
          bottom,
          time: c2.time,
          candleIndex: i - 1,
          isFilled,
          isInverted: false,
        });
      }

      // Bearish FVG: High of candle 3 is below Low of candle 1
      if (c3.high < c1.low) {
        const top = c1.low;
        const bottom = c3.high;
        let isFilled = false;

        for (let k = i + 1; k < candles.length; k++) {
          if (candles[k].high >= top) {
            isFilled = true;
            break;
          }
        }

        fvgs.push({
          id: `bear-fvg-${c2.time}`,
          type: 'BEARISH',
          top,
          bottom,
          time: c2.time,
          candleIndex: i - 1,
          isFilled,
          isInverted: false,
        });
      }
    }

    return fvgs;
  }

  /**
   * Detects Institutional Order Blocks (OB)
   */
  public static detectOrderBlocks(candles: Candle[]): OrderBlock[] {
    const obs: OrderBlock[] = [];

    for (let i = 1; i < candles.length - 2; i++) {
      const current = candles[i];
      const next1 = candles[i + 1];
      const next2 = candles[i + 2];

      // Bullish OB: Bearish candle followed by strong bullish displacement
      const isBearishCandle = current.close < current.open;
      const isBullishDisplacement = (next1.close > current.high && next2.close > next1.close);

      if (isBearishCandle && isBullishDisplacement) {
        let isMitigated = false;
        for (let k = i + 3; k < candles.length; k++) {
          if (candles[k].low <= current.low) {
            isMitigated = true;
            break;
          }
        }

        obs.push({
          id: `bull-ob-${current.time}`,
          type: 'BULLISH',
          high: current.high,
          low: current.low,
          time: current.time,
          candleIndex: i,
          isMitigated,
          isBreaker: false,
        });
      }

      // Bearish OB: Bullish candle followed by strong bearish displacement
      const isBullishCandle = current.close > current.open;
      const isBearishDisplacement = (next1.close < current.low && next2.close < next1.close);

      if (isBullishCandle && isBearishDisplacement) {
        let isMitigated = false;
        for (let k = i + 3; k < candles.length; k++) {
          if (candles[k].high >= current.high) {
            isMitigated = true;
            break;
          }
        }

        obs.push({
          id: `bear-ob-${current.time}`,
          type: 'BEARISH',
          high: current.high,
          low: current.low,
          time: current.time,
          candleIndex: i,
          isMitigated,
          isBreaker: false,
        });
      }
    }

    return obs;
  }

  /**
   * Detects Liquidity Sweeps (Buy-side BSL and Sell-side SSL)
   */
  public static detectLiquiditySweeps(candles: Candle[], swingPoints: SwingPoint[]): LiquidityPool[] {
    const pools: LiquidityPool[] = [];
    const highs = swingPoints.filter(p => p.type === 'SWING_HIGH');
    const lows = swingPoints.filter(p => p.type === 'SWING_LOW');

    // Check Equal Highs / Buy-side sweeps
    for (const sh of highs) {
      let swept = false;
      let sweepTime: number | undefined;

      for (let i = sh.index + 1; i < candles.length; i++) {
        const c = candles[i];
        // Wick went above swing high but candle body closed back below
        if (c.high > sh.price && c.close < sh.price) {
          swept = true;
          sweepTime = c.time;
          break;
        }
      }

      pools.push({
        id: `pool-bsl-${sh.time}`,
        type: 'BUY_SIDE',
        price: sh.price,
        isEqual: sh.label === 'LH',
        isSwept: swept,
        sweepTime,
        candleIndex: sh.index,
      });
    }

    // Check Equal Lows / Sell-side sweeps
    for (const sl of lows) {
      let swept = false;
      let sweepTime: number | undefined;

      for (let i = sl.index + 1; i < candles.length; i++) {
        const c = candles[i];
        // Wick went below swing low but candle body closed back above
        if (c.low < sl.price && c.close > sl.price) {
          swept = true;
          sweepTime = c.time;
          break;
        }
      }

      pools.push({
        id: `pool-ssl-${sl.time}`,
        type: 'SELL_SIDE',
        price: sl.price,
        isEqual: sl.label === 'HL',
        isSwept: swept,
        sweepTime,
        candleIndex: sl.index,
      });
    }

    return pools;
  }

  /**
   * Calculates Premium and Discount Zones (50% Equilibrium)
   */
  public static calculatePremiumDiscount(candles: Candle[], lookback: number = 50) {
    const slice = candles.slice(-lookback);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const equilibrium = (highest + lowest) / 2;
    const currentPrice = candles[candles.length - 1]?.close || equilibrium;

    return {
      highest,
      lowest,
      equilibrium,
      currentPrice,
      isPremium: currentPrice > equilibrium,
      isDiscount: currentPrice < equilibrium,
      premiumRange: { min: equilibrium, max: highest },
      discountRange: { min: lowest, max: equilibrium },
    };
  }
}
