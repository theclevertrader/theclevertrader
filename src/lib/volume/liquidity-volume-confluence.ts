import { 
  VolumeProfileResult, 
  VwapResult, 
  VolumeDeltaResult, 
  AbsorptionResult, 
  LiquidityVolumeConfluence 
} from './volume-types';

export interface ConfluenceInput {
  symbol: string;
  currentPrice: number;
  profile: VolumeProfileResult;
  vwap: VwapResult;
  delta: VolumeDeltaResult;
  absorption: AbsorptionResult;
  hasLiquiditySweep?: boolean;
  hasUnmitigatedOB?: boolean;
  hasActiveFVG?: boolean;
  cotNetBullish?: boolean;
  newsLockActive?: boolean;
}

export class LiquidityVolumeConfluenceEngine {
  /**
   * Evaluates institutional confluence across Volume Profile, VWAP, Order Flow Delta,
   * Absorption, and Smart Money Liquidity structures.
   */
  public static evaluateConfluence(input: ConfluenceInput): LiquidityVolumeConfluence {
    const { 
      symbol, 
      currentPrice, 
      profile, 
      vwap, 
      delta, 
      absorption, 
      hasLiquiditySweep = false, 
      hasUnmitigatedOB = false, 
      hasActiveFVG = false, 
      cotNetBullish = true,
      newsLockActive = false 
    } = input;

    const factors: { name: string; score: number; description: string; aligned: boolean }[] = [];
    let bullishWeight = 0;
    let bearishWeight = 0;
    let totalPossible = 0;

    // 1. Value Area Location (VAH/VAL/POC)
    const isAboveVah = currentPrice > profile.vah;
    const isBelowVal = currentPrice < profile.val;
    const isAtPoc = Math.abs(currentPrice - profile.poc) <= profile.tickSize * 2;

    if (isAboveVah && delta.delta > 0) {
      factors.push({
        name: 'Value Area Acceptance (Long)',
        score: 20,
        description: 'Price accepted above Value Area High (VAH) with positive delta expansion.',
        aligned: true,
      });
      bullishWeight += 20;
    } else if (isBelowVal && delta.delta < 0) {
      factors.push({
        name: 'Value Area Acceptance (Short)',
        score: 20,
        description: 'Price accepted below Value Area Low (VAL) with aggressive selling delta.',
        aligned: true,
      });
      bearishWeight += 20;
    } else if (isAtPoc) {
      factors.push({
        name: 'POC High-Volume Node (Equilibrium)',
        score: 15,
        description: 'Price rotating around Point of Control (POC). High institutional liquidity anchor.',
        aligned: true,
      });
      bullishWeight += 7.5;
      bearishWeight += 7.5;
    }
    totalPossible += 20;

    // 2. VWAP Institutional Bias
    if (vwap.vwap > 0) {
      if (currentPrice > vwap.vwap) {
        const isNearUpper = currentPrice >= vwap.upperBand1;
        factors.push({
          name: 'VWAP Institutional Alignment (Bullish)',
          score: isNearUpper ? 15 : 20,
          description: isNearUpper ? 'Price testing VWAP +1 SD band.' : 'Price holding above VWAP baseline (Buyer advantage).',
          aligned: true,
        });
        bullishWeight += isNearUpper ? 15 : 20;
      } else {
        const isNearLower = currentPrice <= vwap.lowerBand1;
        factors.push({
          name: 'VWAP Institutional Alignment (Bearish)',
          score: isNearLower ? 15 : 20,
          description: isNearLower ? 'Price testing VWAP -1 SD band.' : 'Price trading below VWAP baseline (Seller advantage).',
          aligned: true,
        });
        bearishWeight += isNearLower ? 15 : 20;
      }
    }
    totalPossible += 20;

    // 3. Order Flow Delta & Imbalance
    if (delta.isBuyImbalance) {
      factors.push({
        name: 'Aggressive Buy Imbalance',
        score: 20,
        description: `Strong institutional buying pressure (${Math.round(delta.buyRatio * 100)}% buy volume).`,
        aligned: true,
      });
      bullishWeight += 20;
    } else if (delta.isSellImbalance) {
      factors.push({
        name: 'Aggressive Sell Imbalance',
        score: 20,
        description: `Strong institutional selling pressure (${Math.round(delta.sellRatio * 100)}% sell volume).`,
        aligned: true,
      });
      bearishWeight += 20;
    } else {
      factors.push({
        name: 'Two-Way Order Flow Equilibrium',
        score: 10,
        description: 'Order flow delta balanced between buyers and sellers.',
        aligned: false,
      });
      bullishWeight += 5;
      bearishWeight += 5;
    }
    totalPossible += 20;

    // 4. Absorption Signal
    if (absorption.type === 'ABSORPTION_BUY') {
      factors.push({
        name: 'Institutional Absorption BUY',
        score: Math.round(absorption.confidence * 0.2),
        description: absorption.description,
        aligned: true,
      });
      bullishWeight += Math.round(absorption.confidence * 0.2);
    } else if (absorption.type === 'ABSORPTION_SELL') {
      factors.push({
        name: 'Institutional Absorption SELL',
        score: Math.round(absorption.confidence * 0.2),
        description: absorption.description,
        aligned: true,
      });
      bearishWeight += Math.round(absorption.confidence * 0.2);
    }
    totalPossible += 20;

    // 5. SMC / ICT Liquidity Sweep & Smart Money
    if (hasLiquiditySweep) {
      factors.push({
        name: 'Liquidity Sweep Confirmed',
        score: 10,
        description: 'Prior session liquidity high/low swept before volume displacement.',
        aligned: true,
      });
      if (delta.delta > 0) bullishWeight += 10;
      else bearishWeight += 10;
    }
    if (hasUnmitigatedOB || hasActiveFVG) {
      factors.push({
        name: 'Institutional Order Block / FVG Key Level',
        score: 10,
        description: 'Price interacting with unmitigated institutional order block or fair value gap.',
        aligned: true,
      });
      if (cotNetBullish) bullishWeight += 10;
      else bearishWeight += 10;
    }
    totalPossible += 20;

    // Calculate final score
    const netDirection = bullishWeight >= bearishWeight ? 'BULLISH' : 'BEARISH';
    const dominantWeight = Math.max(bullishWeight, bearishWeight);
    const confluenceScore = Math.min(100, Math.round((dominantWeight / totalPossible) * 100));

    let bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH' = 'NEUTRAL';
    if (confluenceScore >= 75) {
      bias = netDirection === 'BULLISH' ? 'STRONG_BULLISH' : 'STRONG_BEARISH';
    } else if (confluenceScore >= 55) {
      bias = netDirection === 'BULLISH' ? 'BULLISH' : 'BEARISH';
    }

    let recommendation = `${bias.replace('_', ' ')} confluence detected (${confluenceScore}/100). Align execution with POC & VWAP retests.`;
    if (newsLockActive) {
      recommendation = '⚠️ NO TRADE: High-Impact News Lock Active. Volume signals held in observation mode.';
    }

    return {
      symbol,
      confluenceScore,
      bias,
      factors,
      institutionalRecommendation: recommendation,
      newsLockEnforced: newsLockActive,
      timestamp: Date.now(),
    };
  }
}
