export type VolumeDataSource = 'MT5' | 'BIQUOTE' | 'TWELVE_DATA' | 'SYNTHETIC';

export type TimeframeId = '5M' | '15M' | '1H' | '4H' | '1D';

export type ProfileMode = 'VISIBLE' | 'SESSION' | 'DAILY' | 'WEEKLY';

export type VolumeType = 'BROKER_TICK_VOLUME' | 'CENTRALIZED_EXCHANGE_VOLUME';

export type DeltaMethodology = 'ESTIMATED_QUOTE_RULE_PROXY' | 'TICK_RULE_PROXY' | 'BID_ASK_AGGRESSOR';

export type TradingSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'DAILY' | 'WEEKLY' | 'CUSTOM';

export type VolumeSpikeClassification = 'NORMAL' | 'ELEVATED' | 'SPIKE' | 'EXTREME';

export type AbsorptionType = 'ABSORPTION_BUY' | 'ABSORPTION_SELL' | 'NONE';

export type DataQualityStatus = 'LIVE' | 'STALE' | 'INSUFFICIENT_DATA' | 'DEGRADED' | 'OFFLINE';

export interface FootprintPriceLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  isBuyImbalance: boolean; // 300% diagonal buy imbalance
  isSellImbalance: boolean; // 300% diagonal sell imbalance
}

export interface FootprintCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  delta: number;
  cvd: number;
  pocPrice: number;
  levels: FootprintPriceLevel[];
}

export interface CvdDivergence {
  type: 'BEARISH_ABSORPTION' | 'BULLISH_ACCUMULATION';
  priceLevel: number;
  timestamp: number;
  description: string;
}

export interface NormalizedMarketRecord {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  bid: number;
  ask: number;
  volume: number;
  tickVolume: number;
  source: VolumeDataSource;
  footprint?: FootprintCandle;
}

export interface CumulativeDeltaPoint {
  timestamp: number;
  timeString: string;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cvd: number;
}

export interface VolumeSpikePoint {
  timestamp: number;
  timeString: string;
  volume: number;
  zScore: number;
  classification: VolumeSpikeClassification;
}

export interface VolumeZone {
  priceStart: number;
  priceEnd: number;
  peakPrice: number;
  volume: number;
  type: 'HVN' | 'LVN';
}

export interface MultiTimeframeBias {
  '5M': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  '15M': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  '1H': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  '4H': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  '1D': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  overall: 'BULLISH' | 'BEARISH' | 'MIXED';
  reasoning: string;
}

export interface NormalizedTick {
  symbol: string;
  timestamp: number;
  bid: number;
  ask: number;
  price: number;
  volume: number;
  tickVolume: number;
  side: 'BUY' | 'SELL' | 'UNKNOWN';
  source: VolumeDataSource;
}

export interface VolumeProfileBin {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  tickCount: number;
}

export interface NakedPOC {
  id: string;
  symbol: string;
  price: number;
  date: string;
  session: TradingSession;
  ageBars: number;
  status: 'UNFILLED' | 'FILLED';
  timestamp: number;
  filledAtPrice?: number;
  filledTimestamp?: number;
}

export interface VolumeProfileResult {
  symbol: string;
  session: TradingSession;
  timeframe: string;
  poc: number;
  vah: number;
  val: number;
  hvn: number[];
  lvn: number[];
  developingPoc: number;
  developingVah: number;
  developingVal: number;
  totalVolume: number;
  totalBuyVolume: number;
  totalSellVolume: number;
  delta: number;
  cumulativeDelta: number;
  deltaMethodology: DeltaMethodology;
  valueAreaPercent: number;
  tickSize: number;
  bins: VolumeProfileBin[];
  timestamp: number;
}

export interface VwapResult {
  symbol: string;
  session: TradingSession;
  vwap: number;
  upperBand1: number;
  lowerBand1: number;
  upperBand2: number;
  lowerBand2: number;
  stdDev: number;
  totalVolume: number;
  sampleCount: number;
  timestamp: number;
}

export interface VolumeDeltaResult {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cumulativeDelta: number;
  deltaPercentage: number;
  buyRatio: number;
  sellRatio: number;
  isBuyImbalance: boolean;
  isSellImbalance: boolean;
  methodology: DeltaMethodology;
  timestamp: number;
}

export interface VolumeSpikeResult {
  symbol: string;
  currentVolume: number;
  averageVolume: number;
  standardDeviation: number;
  volumeZScore: number;
  classification: VolumeSpikeClassification;
  isSpike: boolean;
  timestamp: number;
}

export interface AbsorptionResult {
  symbol: string;
  type: AbsorptionType;
  confidence: number; // 0 - 100
  priceLevel: number;
  deltaImbalance: number;
  volumeConcentration: number;
  description: string;
  timestamp: number;
}

export interface LiquidityVolumeConfluence {
  symbol: string;
  confluenceScore: number; // 0 - 100
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  factors: {
    name: string;
    score: number; // 0 - 100
    description: string;
    aligned: boolean;
  }[];
  institutionalRecommendation: string;
  newsLockEnforced: boolean;
  timestamp: number;
}

export interface VolumeDiagnostics {
  symbol: string;
  tickCount: number;
  uniquePriceLevels: number;
  totalVolume: number;
  numberPriceBins: number;
  poc: number;
  vah: number;
  val: number;
  hvnCount: number;
  lvnCount: number;
  vwap: number;
  buyVolume: number;
  sellVolume: number;
  deltaMethodology: DeltaMethodology;
  lastTickTimestamp: number;
  dataSource: VolumeDataSource;
  volumeType: VolumeType;
  dataQualityStatus: DataQualityStatus;
  adaptiveTickSize: number;
}

export interface CompleteVolumeAnalysis {
  symbol: string;
  volumeType: VolumeType;
  dataQuality: {
    status: DataQualityStatus;
    primarySource: VolumeDataSource;
    tickCount: number;
    latencyMs: number;
    lastUpdated: number;
  };
  activeSession: TradingSession;
  currentPrice: number;
  currentProfile: VolumeProfileResult;
  sessionProfiles: {
    asia?: VolumeProfileResult;
    london?: VolumeProfileResult;
    newYork?: VolumeProfileResult;
    daily?: VolumeProfileResult;
    weekly?: VolumeProfileResult;
  };
  nakedPOCs: NakedPOC[];
  vwap: VwapResult;
  delta: VolumeDeltaResult;
  spike: VolumeSpikeResult;
  absorption: AbsorptionResult;
  confluence: LiquidityVolumeConfluence;
  diagnostics?: VolumeDiagnostics;
  newsLockActive: boolean;
  timestamp: number;
  timeframe?: TimeframeId;
  profileMode?: ProfileMode;
  cvdSeries?: CumulativeDeltaPoint[];
  spikeSeries?: VolumeSpikePoint[];
  zones?: VolumeZone[];
  mtfBias?: MultiTimeframeBias;
  candles?: NormalizedMarketRecord[];
  footprintSeries?: FootprintCandle[];
  divergences?: CvdDivergence[];
  minHistoryMet?: boolean;
  historyCoverageDays?: number;
}

export interface BigTradeMarker {
  timestamp: number;
  price: number;
  volume: number;
  side: 'BUY' | 'SELL';
  isAggressive: boolean;
}

export interface MboIcebergAlert {
  price: number;
  timestamp: number;
  lotsAbsorbed: number;
  type: 'ICEBERG_BUY' | 'ICEBERG_SELL';
}

export interface DomOrderLevel {
  price: number;
  volume: number;
  pullingStackingDelta: number;
  type: 'BID' | 'ASK';
}

