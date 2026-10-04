export interface VolumeEngineConfig {
  valueAreaPercent: number;        // Default 0.70 (70%)
  hvnPercentile: number;           // Multiplier of mean volume for HVN (default 1.35)
  lvnPercentile: number;           // Multiplier of mean volume for LVN (default 0.60)
  minProfileSamples: number;       // Minimum bins or samples required
  imbalanceRatioThreshold: number; // Ratio for strong buy/sell imbalance (default 2.5)
  spikeZThresholds: {
    elevated: number; // 1.5
    spike: number;    // 2.5
    extreme: number;  // 3.5
  };
  vwapBands: {
    band1Multiplier: number; // 1.0
    band2Multiplier: number; // 2.0
  };
  nakedPocMaxAgeDays: number;      // How long to track naked POCs (default 30)
  sessionsUtc: {
    asia: { startHour: number; endHour: number };    // 00:00 - 08:00 UTC
    london: { startHour: number; endHour: number };  // 07:00 - 16:00 UTC
    newYork: { startHour: number; endHour: number }; // 12:00 - 21:00 UTC
  };
  tickSizes: Record<string, number>;
}

export const DEFAULT_VOLUME_CONFIG: VolumeEngineConfig = {
  valueAreaPercent: 0.70,
  hvnPercentile: 1.35,
  lvnPercentile: 0.60,
  minProfileSamples: 8,
  imbalanceRatioThreshold: 2.5,
  spikeZThresholds: {
    elevated: 1.5,
    spike: 2.5,
    extreme: 3.5,
  },
  vwapBands: {
    band1Multiplier: 1.0,
    band2Multiplier: 2.0,
  },
  nakedPocMaxAgeDays: 30,
  sessionsUtc: {
    asia: { startHour: 0, endHour: 8 },
    london: { startHour: 7, endHour: 16 },
    newYork: { startHour: 12, endHour: 21 },
  },
  tickSizes: {
    XAUUSD: 0.25,     // Gold 25-cent bins
    BTCUSD: 10.0,     // Bitcoin $10 bins
    ETHUSD: 1.0,      // Ethereum $1 bins
    EURUSD: 0.0001,   // 1 pip
    GBPUSD: 0.0001,   // 1 pip
    USDJPY: 0.01,     // 1 pip
    USDCHF: 0.0001,   // 1 pip
    AUDUSD: 0.0001,   // 1 pip
    USDCAD: 0.0001,   // 1 pip
    NZDUSD: 0.0001,   // 1 pip
    US30: 5.0,        // Dow 5 pts
    US500: 0.5,       // S&P 0.5 pts
    NAS100: 2.0,      // Nasdaq 2 pts
  },
};

export function getTickSizeForSymbol(symbol: string, customConfig?: VolumeEngineConfig): number {
  const cfg = customConfig || DEFAULT_VOLUME_CONFIG;
  const clean = symbol.replace('/', '').toUpperCase();
  if (cfg.tickSizes[clean]) return cfg.tickSizes[clean];
  if (clean.startsWith('XAU')) return 0.25;
  if (clean.includes('JPY')) return 0.01;
  if (clean.length === 6) return 0.0001;
  return 0.1;
}
