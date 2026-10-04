export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetCategory = 'CRYPTO' | 'FOREX' | 'METALS' | 'INDICES' | 'COMMODITIES' | 'ENERGY';

export interface SymbolSpec {
  symbol: string;
  name: string;
  category: AssetCategory;
  priceDigits: number;
  digits?: number; // Backward-compatible alias for priceDigits
  pipSize: number;
  tickValuePerLot: number;
  pipValue?: number; // Backward-compatible alias for tickValuePerLot
  contractSize: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  spreadPips: number;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export type TrendBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  label: 'HH' | 'HL' | 'LH' | 'LL';
}

export interface StructureEvent {
  type: 'BOS' | 'CHoCH' | 'MSS';
  direction: 'BULLISH' | 'BEARISH';
  brokenPrice: number;
  breakTime: number;
  candleIndex: number;
  description: string;
}

export interface OrderBlock {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  high: number;
  low: number;
  time: number;
  candleIndex: number;
  isMitigated: boolean;
  isBreaker: boolean;
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  time: number;
  candleIndex: number;
  isFilled: boolean;
  isInverted: boolean;
}

export interface LiquidityPool {
  id: string;
  type: 'BUY_SIDE' | 'SELL_SIDE';
  price: number;
  isEqual: boolean;
  isSwept: boolean;
  sweepTime?: number;
  candleIndex: number;
}

export interface KillZone {
  name: 'ASIAN' | 'LONDON' | 'NEW_YORK';
  startHourUtc: number;
  endHourUtc: number;
  isActive: boolean;
  rangeHigh?: number;
  rangeLow?: number;
}

export interface PriceActionSignal {
  pattern: 'PIN_BAR' | 'ENGULFING' | 'INSIDE_BAR' | 'REJECTION_WICK' | 'DISPLACEMENT';
  direction: 'BULLISH' | 'BEARISH';
  candleIndex: number;
  quality: number; // 0 - 100
  note: string;
}

export type MarketRegime = 
  | 'TRENDING_BULLISH' 
  | 'TRENDING_BEARISH' 
  | 'RANGING' 
  | 'HIGH_VOLATILITY' 
  | 'LOW_VOLATILITY' 
  | 'UNCERTAIN';

export type SetupClassification = 
  | 'NO TRADE' 
  | 'WEAK' 
  | 'WATCH' 
  | 'VALID' 
  | 'HIGH QUALITY' 
  | 'A+ SETUP';

export interface ConfluenceBreakdown {
  smcScore: number;       // Max 20
  ictScore: number;       // Max 20
  htfBiasScore: number;   // Max 15
  priceActionScore: number;// Max 15
  volumeScore: number;    // Max 10
  momentumScore: number;  // Max 10
  sessionScore: number;   // Max 5
  riskRewardScore: number;// Max 5
  totalScore: number;     // 0 - 100
}

export interface TradeSetup {
  id: string;
  symbol: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'NO_TRADE';
  classification: SetupClassification;
  setupScore: number;
  confidence: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  regime: MarketRegime;
  htfBias: TrendBias;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: number;
  estimatedRiskUsd: number;
  estimatedRewardUsd: number;
  suggestedLotSize: number;
  invalidation: string;
  reasons: string[];
  romanUrduExplanation: string;
  timestamp: number;
  liquidityContext: string;
}

export interface PositionSizeResult {
  symbol: string;
  lotSize: number;
  riskAmountUsd: number;
  rewardAmountUsd: number;
  riskRewardRatio: number;
  slDistancePips: number;
  tpDistancePips: number;
  pipValue: number;
  isValid: boolean;
  warningMessage?: string;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPl: number;
  openTime: number;
  status: 'OPEN' | 'CLOSED';
  closePrice?: number;
  closeTime?: number;
  realizedPl?: number;
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profitUsd: number;
  returnPercent: number;
  rMultiple: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  reason: string;
}

export interface BacktestSummary {
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdownUsd: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageRiskReward: number;
  equityCurve: { time: string; equity: number; drawdown: number }[];
  trades: BacktestTrade[];
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnl: number;
  rMultiple: number;
  setupType: string;
  smcConfirmation: string;
  ictConfirmation: string;
  emotion: 'DISCIPLINED' | 'FOMO' | 'GREED' | 'FEAR' | 'REVENGE' | 'CONFIDENT';
  mistake: string;
  notes: string;
  aiReview?: string;
  screenshotUrl?: string;
}

export type { BrokerAccountInfo, PlaceOrderInput } from '../broker/broker-adapter';
