import { 
  Candle, 
  ConfluenceBreakdown, 
  SetupClassification, 
  MarketRegime,
  TrendBias 
} from '../types/trading';
import { SmcEngine } from './smc-engine';
import { IctEngine } from './ict-engine';
import { PriceActionEngine } from './price-action-engine';

export interface ConfluenceWeights {
  smcWeight: number;        // Default 20
  ictWeight: number;        // Default 20
  htfBiasWeight: number;    // Default 15
  priceActionWeight: number;// Default 15
  volumeWeight: number;     // Default 10
  momentumWeight: number;   // Default 10
  sessionWeight: number;    // Default 5
  riskRewardWeight: number; // Default 5
}

export const DEFAULT_CONFLUENCE_WEIGHTS: ConfluenceWeights = {
  smcWeight: 20,
  ictWeight: 20,
  htfBiasWeight: 15,
  priceActionWeight: 15,
  volumeWeight: 10,
  momentumWeight: 10,
  sessionWeight: 5,
  riskRewardWeight: 5,
};

export class ConfluenceEngine {
  /**
   * Evaluates market confluence across SMC, ICT, HTF, Price Action, Volume, Momentum, Session, R:R
   */
  public static evaluateConfluence(
    candles: Candle[],
    htfBias: TrendBias,
    proposedRr: number = 3.0,
    weights: ConfluenceWeights = DEFAULT_CONFLUENCE_WEIGHTS
  ): { breakdown: ConfluenceBreakdown; classification: SetupClassification; regime: MarketRegime; primaryDirection: 'BUY' | 'SELL' | 'NO_TRADE' } {
    if (candles.length < 20) {
      return {
        breakdown: {
          smcScore: 0,
          ictScore: 0,
          htfBiasScore: 0,
          priceActionScore: 0,
          volumeScore: 0,
          momentumScore: 0,
          sessionScore: 0,
          riskRewardScore: 0,
          totalScore: 0,
        },
        classification: 'NO TRADE',
        regime: 'UNCERTAIN',
        primaryDirection: 'NO_TRADE',
      };
    }

    const lastCandle = candles[candles.length - 1];
    const swingPoints = SmcEngine.detectSwingPoints(candles);
    const structureEvents = SmcEngine.detectStructureEvents(candles, swingPoints);
    const fvgs = SmcEngine.detectFairValueGaps(candles);
    const orderBlocks = SmcEngine.detectOrderBlocks(candles);
    const sweeps = SmcEngine.detectLiquiditySweeps(candles, swingPoints);
    const killZones = IctEngine.getKillZones(lastCandle.time);
    const paSignals = PriceActionEngine.detectPatterns(candles);
    const premDisc = SmcEngine.calculatePremiumDiscount(candles);

    // 1. SMC Score (Max smcWeight, default 20)
    let smcRaw = 0;
    const recentBOS = structureEvents.slice(-3);
    const hasBullBOS = recentBOS.some(e => e.direction === 'BULLISH');
    const hasBearBOS = recentBOS.some(e => e.direction === 'BEARISH');
    const hasUnmitigatedOB = orderBlocks.some(ob => !ob.isMitigated);
    const hasActiveFVG = fvgs.some(f => !f.isFilled);

    if (hasBullBOS || hasBearBOS) smcRaw += 0.4;
    if (hasUnmitigatedOB) smcRaw += 0.3;
    if (hasActiveFVG) smcRaw += 0.3;
    const smcScore = Math.round(smcRaw * weights.smcWeight);

    // 2. ICT Score (Max ictWeight, default 20)
    let ictRaw = 0;
    const recentSweeps = sweeps.filter(s => s.isSwept);
    const inKillZone = killZones.some(k => k.isActive);
    const ifvgs = IctEngine.detectInversionFvgs(candles, fvgs);

    if (recentSweeps.length > 0) ictRaw += 0.5; // Liquidity raid confirmed
    if (inKillZone) ictRaw += 0.3;              // Kill zone timing
    if (ifvgs.length > 0) ictRaw += 0.2;        // Inversion FVG
    const ictScore = Math.round(ictRaw * weights.ictWeight);

    // 3. HTF Bias Score (Max 15)
    let htfRaw = 0;
    const shortEma = candles.slice(-10).reduce((acc, c) => acc + c.close, 0) / 10;
    const isBullAligned = htfBias === 'BULLISH' && lastCandle.close > shortEma;
    const isBearAligned = htfBias === 'BEARISH' && lastCandle.close < shortEma;

    if (isBullAligned || isBearAligned) {
      htfRaw = 1.0;
    } else if (htfBias === 'NEUTRAL') {
      htfRaw = 0.5;
    } else {
      htfRaw = 0.2; // Counter-trend penalty
    }
    const htfBiasScore = Math.round(htfRaw * weights.htfBiasWeight);

    // 4. Price Action Score (Max 15)
    let paRaw = 0;
    const recentPA = paSignals.slice(-3);
    if (recentPA.some(p => p.pattern === 'DISPLACEMENT')) paRaw += 0.5;
    if (recentPA.some(p => p.pattern === 'PIN_BAR' || p.pattern === 'ENGULFING')) paRaw += 0.5;
    const priceActionScore = Math.round(Math.min(1.0, paRaw) * weights.priceActionWeight);

    // 5. Volume Score (Max 10)
    const avgVol = candles.slice(-20).reduce((acc, c) => acc + c.volume, 0) / 20;
    let volRaw = lastCandle.volume >= avgVol * 1.2 ? 1.0 : (lastCandle.volume >= avgVol ? 0.7 : 0.4);
    const volumeScore = Math.round(volRaw * weights.volumeWeight);

    // 6. Momentum Score (Max 10)
    // Simple 14-bar RSI proxy
    const closes = candles.slice(-14).map(c => c.close);
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));
    const momentumRaw = (rsi > 40 && rsi < 70) ? 1.0 : 0.5;
    const momentumScore = Math.round(momentumRaw * weights.momentumWeight);

    // 7. Session Score (Max 5)
    const sessionScore = inKillZone ? weights.sessionWeight : Math.round(weights.sessionWeight * 0.4);

    // 8. Risk/Reward Score (Max 5)
    let rrRaw = 0;
    if (proposedRr >= 3.0) rrRaw = 1.0;
    else if (proposedRr >= 2.0) rrRaw = 0.7;
    else if (proposedRr >= 1.5) rrRaw = 0.4;
    else rrRaw = 0.1;
    const riskRewardScore = Math.round(rrRaw * weights.riskRewardWeight);

    const totalScore = Math.min(
      100,
      smcScore + ictScore + htfBiasScore + priceActionScore + volumeScore + momentumScore + sessionScore + riskRewardScore
    );

    // Classification
    let classification: SetupClassification = 'NO TRADE';
    if (totalScore >= 95) classification = 'A+ SETUP';
    else if (totalScore >= 85) classification = 'HIGH QUALITY';
    else if (totalScore >= 75) classification = 'VALID';
    else if (totalScore >= 65) classification = 'WATCH';
    else if (totalScore >= 50) classification = 'WEAK';
    else classification = 'NO TRADE';

    // Market Regime detection
    let regime: MarketRegime = 'UNCERTAIN';
    const recentRange = Math.max(...candles.slice(-10).map(c => c.high)) - Math.min(...candles.slice(-10).map(c => c.low));
    const priorRange = Math.max(...candles.slice(-20, -10).map(c => c.high)) - Math.min(...candles.slice(-20, -10).map(c => c.low));

    if (recentRange > priorRange * 1.8) {
      regime = 'HIGH_VOLATILITY';
    } else if (hasBullBOS && htfBias === 'BULLISH' && premDisc.isDiscount) {
      regime = 'TRENDING_BULLISH';
    } else if (hasBearBOS && htfBias === 'BEARISH' && premDisc.isPremium) {
      regime = 'TRENDING_BEARISH';
    } else if (Math.abs(lastCandle.close - premDisc.equilibrium) / premDisc.equilibrium < 0.003) {
      regime = 'RANGING';
    } else {
      regime = 'LOW_VOLATILITY';
    }

    // Directional bias
    let primaryDirection: 'BUY' | 'SELL' | 'NO_TRADE' = 'NO_TRADE';
    if (totalScore >= 65) {
      if (hasBullBOS || (htfBias === 'BULLISH' && premDisc.isDiscount)) {
        primaryDirection = 'BUY';
      } else if (hasBearBOS || (htfBias === 'BEARISH' && premDisc.isPremium)) {
        primaryDirection = 'SELL';
      }
    }

    return {
      breakdown: {
        smcScore,
        ictScore,
        htfBiasScore,
        priceActionScore,
        volumeScore,
        momentumScore,
        sessionScore,
        riskRewardScore,
        totalScore,
      },
      classification,
      regime,
      primaryDirection,
    };
  }
}
