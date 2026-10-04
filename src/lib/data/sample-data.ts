import { Candle } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';

/**
 * Generates realistic institutional candlestick series with proper market structure,
 * swings, liquidity raids, and displacement candles.
 */
export function generateCandles(
  symbol: string, 
  count: number = 100, 
  timeframeMinutes: number = 15,
  seedTrend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'BULLISH'
): Candle[] {
  const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const candles: Candle[] = [];

  const now = Date.now();
  const stepMs = timeframeMinutes * 60 * 1000;
  let currentPrice = spec.currentPrice * 0.985; // start slightly lower for realistic progression
  const volatility = (spec.currentPrice * 0.002); // 0.2% typical bar volatility

  let trend = seedTrend;
  let cycle = 0;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - (i * stepMs);
    cycle++;

    // Switch micro-regimes every 25 bars for realistic market waves
    if (cycle % 25 === 0) {
      trend = trend === 'BULLISH' ? 'BEARISH' : (trend === 'BEARISH' ? 'RANGING' : 'BULLISH');
    }

    const drift = trend === 'BULLISH' ? volatility * 0.4 : (trend === 'BEARISH' ? -volatility * 0.4 : 0);
    const noise = (Math.random() - 0.5) * volatility * 2.0;

    const open = currentPrice;
    let close = open + drift + noise;

    // Inject occasional institutional displacement candle
    const isDisplacement = Math.random() < 0.08;
    if (isDisplacement) {
      const dir = trend === 'BEARISH' ? -1 : 1;
      close = open + (dir * volatility * 3.5);
    }

    const high = Math.max(open, close) + (Math.random() * volatility * 0.8);
    const low = Math.min(open, close) - (Math.random() * volatility * 0.8);

    const volume = Math.round((Math.random() * 800 + 300) * (isDisplacement ? 2.5 : 1.0));

    candles.push({
      time,
      open: Number(open.toFixed(spec.priceDigits)),
      high: Number(high.toFixed(spec.priceDigits)),
      low: Number(low.toFixed(spec.priceDigits)),
      close: Number(close.toFixed(spec.priceDigits)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export const INITIAL_CANDLES_MAP: Record<string, Candle[]> = {
  XAUUSD: generateCandles('XAUUSD', 120, 15, 'BULLISH'),
  BTCUSD: generateCandles('BTCUSD', 120, 15, 'BULLISH'),
  EURUSD: generateCandles('EURUSD', 120, 15, 'BEARISH'),
  GBPUSD: generateCandles('GBPUSD', 120, 15, 'BULLISH'),
  USDJPY: generateCandles('USDJPY', 120, 15, 'BEARISH'),
  NAS100: generateCandles('NAS100', 120, 15, 'BULLISH'),
  US30: generateCandles('US30', 120, 15, 'BULLISH'),
  SPX500: generateCandles('SPX500', 120, 15, 'BULLISH'),
};
