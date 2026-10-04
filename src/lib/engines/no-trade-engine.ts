import { ConfluenceBreakdown, TrendBias, MarketRegime } from '../types/trading';

export interface NoTradeCheckInput {
  setupScore: number;
  riskReward: number;
  spreadPips: number;
  maxSpreadPips?: number;
  slPips: number;
  htfBias: TrendBias;
  direction: 'BUY' | 'SELL' | 'NO_TRADE';
  regime: MarketRegime;
  hasLiquiditySweep: boolean;
  dailyLossLimitReached: boolean;
  maxOpenTradesReached: boolean;
  isHighImpactNewsWindow?: boolean;
}

export interface NoTradeDecision {
  allowTrade: boolean;
  status: 'APPROVED' | 'NO_TRADE';
  reasons: string[];
  rejections?: string[];
  primaryRejectionCode?: string;
  romanUrduSummary: string;
}

export class NoTradeEngine {
  /**
   * Institutional Gatekeeper: Rejects low-probability setups before any risk is exposed
   */
  public static evaluate(input: NoTradeCheckInput): NoTradeDecision {
    const rejections: string[] = [];
    const maxSpread = input.maxSpreadPips || 3.0;

    // 1. Minimum Setup Score
    if (input.setupScore < 65) {
      rejections.push(`Setup score (${input.setupScore}/100) is below institutional threshold (minimum 65 required for WATCH/VALID).`);
    }

    // 2. Risk/Reward Ratio Gate
    if (input.riskReward < 2.0 && input.direction !== 'NO_TRADE') {
      rejections.push(`Risk/Reward ratio (1:${input.riskReward.toFixed(1)}) is insufficient. Institutional minimum is 1:2.0.`);
    }

    // 3. Spread Cost vs Risk Gate
    if (input.spreadPips > maxSpread) {
      rejections.push(`Broker spread (${input.spreadPips} pips) exceeds maximum tolerance (${maxSpread} pips).`);
    }
    if (input.slPips > 0 && (input.spreadPips / input.slPips) > 0.20) {
      rejections.push(`Spread friction accounts for >20% of the stop loss distance, severely degrading expectancy.`);
    }

    // 4. Daily Loss & Max Trades Protection
    if (input.dailyLossLimitReached) {
      rejections.push(`Daily drawdown lock is active. Account has reached maximum allowed daily risk.`);
    }
    if (input.maxOpenTradesReached) {
      rejections.push(`Maximum concurrent open positions reached. No new execution allowed.`);
    }

    // 5. Conflicting HTF Structure
    if (input.direction === 'BUY' && input.htfBias === 'BEARISH') {
      rejections.push(`Conflicting Higher Timeframe: Attempting to BUY directly into a dominant HTF Bearish trend.`);
    }
    if (input.direction === 'SELL' && input.htfBias === 'BULLISH') {
      rejections.push(`Conflicting Higher Timeframe: Attempting to SELL directly into a dominant HTF Bullish trend.`);
    }

    // 6. Liquidity Confirmation Gate
    if (!input.hasLiquiditySweep && input.setupScore < 85) {
      rejections.push(`Lack of Liquidity Sweep: Neither buy-side nor sell-side liquidity has been raided before entry.`);
    }

    // 7. Market Regime Hazards
    if (input.regime === 'UNCERTAIN' || input.regime === 'HIGH_VOLATILITY') {
      rejections.push(`Adverse Market Regime (${input.regime}): Choppy or erratic volatility detected.`);
    }

    // 8. News Window
    if (input.isHighImpactNewsWindow) {
      rejections.push(`High-Impact Economic Release Window: Slippage and spread expansion risk is unacceptable.`);
    }

    const allowTrade = rejections.length === 0;

    let romanUrduSummary = '';
    if (allowTrade) {
      romanUrduSummary = `Setup valid hai. Tamam institutional risk aur confluence checks pass ho chuke hain. Trade execute ki ja sakti hai.`;
    } else {
      romanUrduSummary = `NO TRADE: Abhi trade lena mana hai. Waja: ${rejections[0]} Sabar karein aur behtar confirmation ka intezar karein.`;
    }

    return {
      allowTrade,
      status: allowTrade ? 'APPROVED' : 'NO_TRADE',
      rejections,
      reasons: rejections,
      primaryRejectionCode: rejections.length > 0 ? rejections[0] : undefined,
      romanUrduSummary,
    };
  }
}
