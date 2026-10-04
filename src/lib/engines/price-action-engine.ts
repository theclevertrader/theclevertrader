import { Candle, PriceActionSignal } from '../types/trading';

export class PriceActionEngine {
  public static detectPatterns(candles: Candle[]): PriceActionSignal[] {
    const signals: PriceActionSignal[] = [];
    if (candles.length < 5) return signals;

    const avgVolume = candles.slice(-20).reduce((acc, c) => acc + c.volume, 0) / Math.min(20, candles.length);

    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const prev = candles[i - 1];

      const range = c.high - c.low;
      if (range <= 0) continue;

      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const bodyRatio = body / range;

      // 1. PIN BAR / WICK REJECTION
      if (bodyRatio <= 0.35) {
        if (lowerWick >= range * 0.60) {
          signals.push({
            pattern: 'PIN_BAR',
            direction: 'BULLISH',
            candleIndex: i,
            quality: Math.min(95, Math.round((lowerWick / range) * 100)),
            note: 'Bullish Hammer / Pin Bar with strong demand absorption at the low',
          });
        } else if (upperWick >= range * 0.60) {
          signals.push({
            pattern: 'PIN_BAR',
            direction: 'BEARISH',
            candleIndex: i,
            quality: Math.min(95, Math.round((upperWick / range) * 100)),
            note: 'Bearish Shooting Star / Pin Bar with supply rejection at the high',
          });
        }
      }

      // 2. ENGULFING PATTERN
      const prevBody = Math.abs(prev.close - prev.open);
      if (c.close > c.open && prev.close < prev.open) {
        if (c.open <= prev.close && c.close >= prev.open && body > prevBody) {
          signals.push({
            pattern: 'ENGULFING',
            direction: 'BULLISH',
            candleIndex: i,
            quality: c.volume > avgVolume ? 90 : 75,
            note: 'Bullish Engulfing candle overpowering previous bearish pressure',
          });
        }
      } else if (c.close < c.open && prev.close > prev.open) {
        if (c.open >= prev.close && c.close <= prev.open && body > prevBody) {
          signals.push({
            pattern: 'ENGULFING',
            direction: 'BEARISH',
            candleIndex: i,
            quality: c.volume > avgVolume ? 90 : 75,
            note: 'Bearish Engulfing candle overpowering previous bullish pressure',
          });
        }
      }

      // 3. INSIDE BAR
      if (c.high <= prev.high && c.low >= prev.low) {
        signals.push({
          pattern: 'INSIDE_BAR',
          direction: prev.close > prev.open ? 'BULLISH' : 'BEARISH',
          candleIndex: i,
          quality: 65,
          note: 'Inside Bar consolidation before expansion breakout',
        });
      }

      // 4. DISPLACEMENT (Institutional momentum thrust)
      if (bodyRatio >= 0.75 && c.volume >= avgVolume * 1.3) {
        signals.push({
          pattern: 'DISPLACEMENT',
          direction: c.close > c.open ? 'BULLISH' : 'BEARISH',
          candleIndex: i,
          quality: 92,
          note: `Strong ${c.close > c.open ? 'Bullish' : 'Bearish'} Displacement with institutional volume expansion`,
        });
      }
    }

    return signals;
  }
}
