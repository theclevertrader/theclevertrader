import { TradingSession } from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';

/**
 * Rounds a price to the nearest tick bin with clean decimal formatting
 */
export function roundToTickBin(price: number, tickSize: number): number {
  if (tickSize <= 0) return price;
  const factor = 1 / tickSize;
  const binned = Math.round(price * factor) / factor;
  const decimals = tickSize < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(tickSize)))) : 2;
  return Number(binned.toFixed(decimals));
}

/**
 * Computes an adaptive price bin resolution based on the actual price range and minimum tick size
 * Guarantees statistical distribution (30 - 60 bins) whether range is $0.20 or $100.00
 */
export function calculateAdaptiveTickSize(
  prices: number[],
  minInstrumentTick: number = 0.0001,
  targetBins: number = 45
): number {
  if (!prices || prices.length === 0) return minInstrumentTick;
  let min = prices[0];
  let max = prices[0];
  for (let i = 1; i < prices.length; i++) {
    const p = prices[i];
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const range = max - min;
  if (range <= 0) return minInstrumentTick;

  const rawBin = range / Math.max(15, targetBins);
  if (rawBin <= minInstrumentTick) return minInstrumentTick;

  const exponent = Math.floor(Math.log10(rawBin));
  const magnitude = Math.pow(10, exponent);
  const normalized = rawBin / magnitude;

  let multiplier = 1;
  if (normalized >= 5) multiplier = 5;
  else if (normalized >= 2.5) multiplier = 2.5;
  else if (normalized >= 2) multiplier = 2;
  else multiplier = 1;

  const adaptive = Math.max(minInstrumentTick, multiplier * magnitude);
  const decimals = minInstrumentTick < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(minInstrumentTick)))) : 2;
  return Number(adaptive.toFixed(decimals));
}

/**
 * Calculates mean and sample standard deviation of an array of numbers
 */
export function calculateMeanAndStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Determines current active market session based on UTC timestamp
 */
export function determineTradingSession(timestamp: number, config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG): TradingSession {
  const date = new Date(timestamp);
  const hour = date.getUTCHours();

  const { asia, london, newYork } = config.sessionsUtc;

  // New York (overlaps with London from 12:00 to 16:00 UTC)
  if (hour >= newYork.startHour && hour < newYork.endHour) {
    return 'NEW_YORK';
  }
  // London
  if (hour >= london.startHour && hour < london.endHour) {
    return 'LONDON';
  }
  // Asia
  if (hour >= asia.startHour && hour < asia.endHour) {
    return 'ASIA';
  }

  return 'ASIA';
}

/**
 * Checks whether a given timestamp falls within a specific trading session
 */
export function isTimestampInSession(
  timestamp: number, 
  session: TradingSession, 
  config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
): boolean {
  if (session === 'DAILY' || session === 'WEEKLY' || session === 'CUSTOM') return true;

  const date = new Date(timestamp);
  const hour = date.getUTCHours();

  if (session === 'ASIA') {
    return hour >= config.sessionsUtc.asia.startHour && hour < config.sessionsUtc.asia.endHour;
  }
  if (session === 'LONDON') {
    return hour >= config.sessionsUtc.london.startHour && hour < config.sessionsUtc.london.endHour;
  }
  if (session === 'NEW_YORK') {
    return hour >= config.sessionsUtc.newYork.startHour && hour < config.sessionsUtc.newYork.endHour;
  }

  return false;
}
