import { SymbolSpec, PositionSizeResult } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';

export interface RiskCalculationInput {
  symbol: string;
  accountBalance: number;
  mode: 'PERCENT' | 'FIXED_USD' | 'FIXED_LOT' | 'MICRO_SCALP_PRESET';
  riskPercent?: number;       // e.g. 1.0 = 1%
  fixedRiskUsd?: number;      // e.g. $50.00
  lotSize?: number;           // e.g. 0.01
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number;
  riskRewardTarget?: number;  // e.g. 3.0 = 1:3 RR
  // Micro scalp configurable target template:
  microScalpLot?: number;     // default 0.01
  microScalpTargetRisk?: number; // default $3.00
  microScalpTargetReward?: number; // default $9.00
}

export class RiskEngine {
  /**
   * Calculates position size, exact dollar risk and reward based on institutional symbol specs
   */
  public static calculatePositionSize(input: RiskCalculationInput): PositionSizeResult {
    const spec = INSTITUTIONAL_SYMBOLS[input.symbol] || {
      symbol: input.symbol,
      name: input.symbol,
      category: 'FOREX',
      priceDigits: 5,
      pipSize: 0.0001,
      tickValuePerLot: 10.0,
      contractSize: 100000,
      minLot: 0.01,
      maxLot: 50.0,
      lotStep: 0.01,
      spreadPips: 1.0,
      currentPrice: input.entryPrice,
      change24h: 0,
      high24h: 0,
      low24h: 0,
    };

    const isBuy = input.stopLoss < input.entryPrice;
    const priceDiffSl = Math.abs(input.entryPrice - input.stopLoss);
    
    // Convert price difference into pips/points
    const slDistancePips = spec.pipSize > 0 ? priceDiffSl / spec.pipSize : priceDiffSl;

    // Dollar value of 1 pip for 1.00 standard lot
    const pipValuePerStandardLot = spec.tickValuePerLot;

    let lotSize = 0.01;
    let riskAmountUsd = 0;

    if (input.mode === 'MICRO_SCALP_PRESET') {
      lotSize = input.microScalpLot || 0.01;
      // Calculate actual USD risk for this distance at the preset lot size
      const pipValueForLot = (lotSize / 1.0) * pipValuePerStandardLot;
      riskAmountUsd = slDistancePips * pipValueForLot;
    } else if (input.mode === 'FIXED_LOT') {
      lotSize = input.lotSize || 0.01;
      const pipValueForLot = (lotSize / 1.0) * pipValuePerStandardLot;
      riskAmountUsd = slDistancePips * pipValueForLot;
    } else {
      let targetRiskUsd = 0;
      if (input.mode === 'PERCENT') {
        const pct = input.riskPercent || 1.0;
        targetRiskUsd = (input.accountBalance * pct) / 100;
      } else {
        targetRiskUsd = input.fixedRiskUsd || 50.0;
      }

      if (slDistancePips > 0 && pipValuePerStandardLot > 0) {
        // Lot = Target Risk USD / (SL Pips * Pip Value per 1 lot)
        const rawLot = targetRiskUsd / (slDistancePips * pipValuePerStandardLot);
        // Round to broker step
        lotSize = Math.max(spec.minLot, Math.min(spec.maxLot, Math.round(rawLot / spec.lotStep) * spec.lotStep));
        // Recalculate exact dollar risk for rounded lot
        riskAmountUsd = slDistancePips * (lotSize * pipValuePerStandardLot);
      }
    }

    // Determine Take Profit and Reward
    let takeProfit = input.takeProfit;
    let rewardAmountUsd = 0;
    let tpDistancePips = 0;

    if (takeProfit && takeProfit > 0) {
      const priceDiffTp = Math.abs(takeProfit - input.entryPrice);
      tpDistancePips = spec.pipSize > 0 ? priceDiffTp / spec.pipSize : priceDiffTp;
      const pipValueForLot = (lotSize / 1.0) * pipValuePerStandardLot;
      rewardAmountUsd = tpDistancePips * pipValueForLot;
    } else if (input.riskRewardTarget && input.riskRewardTarget > 0) {
      tpDistancePips = slDistancePips * input.riskRewardTarget;
      rewardAmountUsd = riskAmountUsd * input.riskRewardTarget;
      takeProfit = isBuy 
        ? input.entryPrice + (tpDistancePips * spec.pipSize)
        : input.entryPrice - (tpDistancePips * spec.pipSize);
    }

    const riskRewardRatio = riskAmountUsd > 0 ? Number((rewardAmountUsd / riskAmountUsd).toFixed(2)) : 0;
    const pipValueForLot = (lotSize / 1.0) * pipValuePerStandardLot;

    // Check validity against account constraints
    let isValid = true;
    let warningMessage: string | undefined;

    if (riskAmountUsd > input.accountBalance * 0.05) {
      isValid = false;
      warningMessage = `Institutional Risk Breach: Single trade risk ($${riskAmountUsd.toFixed(2)}) exceeds maximum 5% account threshold.`;
    } else if (priceDiffSl <= 0) {
      isValid = false;
      warningMessage = 'Invalid Stop Loss: Stop Loss price cannot equal Entry price.';
    }

    return {
      symbol: input.symbol,
      lotSize: Number(lotSize.toFixed(2)),
      riskAmountUsd: Number(riskAmountUsd.toFixed(2)),
      rewardAmountUsd: Number(rewardAmountUsd.toFixed(2)),
      riskRewardRatio,
      slDistancePips: Number(slDistancePips.toFixed(1)),
      tpDistancePips: Number(tpDistancePips.toFixed(1)),
      pipValue: Number(pipValueForLot.toFixed(4)),
      isValid,
      warningMessage,
    };
  }

  /**
   * Helper for the MICRO SCALP preset (0.01 lot with target $3 risk and $9 reward)
   * Calculates the exact Stop Loss and Take Profit price levels for a given direction and entry.
   */
  public static calculateMicroScalpLevels(
    symbol: string, 
    entryPrice: number, 
    direction: 'BUY' | 'SELL',
    targetRiskUsd: number = 3.0,
    targetRewardUsd: number = 9.0,
    lotSize: number = 0.01
  ) {
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    // Dollar value of 1 pip/point for the specified lot size
    const pipValueForLot = (lotSize / 1.0) * spec.tickValuePerLot;

    // Points/pips required to hit target dollar risk
    const requiredSlPips = targetRiskUsd / pipValueForLot;
    const requiredTpPips = targetRewardUsd / pipValueForLot;

    const slOffset = requiredSlPips * spec.pipSize;
    const tpOffset = requiredTpPips * spec.pipSize;

    const stopLoss = direction === 'BUY' ? entryPrice - slOffset : entryPrice + slOffset;
    const takeProfit = direction === 'BUY' ? entryPrice + tpOffset : entryPrice - tpOffset;

    return {
      lotSize,
      targetRiskUsd,
      targetRewardUsd,
      slPips: Number(requiredSlPips.toFixed(1)),
      tpPips: Number(requiredTpPips.toFixed(1)),
      stopLoss: Number(stopLoss.toFixed(spec.priceDigits)),
      takeProfit: Number(takeProfit.toFixed(spec.priceDigits)),
      riskRewardRatio: Number((targetRewardUsd / targetRiskUsd).toFixed(2)),
    };
  }

  /**
   * AI Dynamic SL & TP (Smart Money Concepts / Market Invalidation & Liquidity Targets)
   * Instead of fixed arbitrary dollar amounts, AI analyzes recent candle structure:
   * - SL: Placed at recent swing invalidation / Order Block level with dynamic ATR cushion
   * - TP: Placed at opposing institutional liquidity pool / dynamic R:R (1:3.0)
   * - Real dollar risk & reward calculated dynamically from selected lot size and pip distances
   */
  public static calculateAiDynamicLevels(
    symbol: string,
    entryPrice: number,
    direction: 'BUY' | 'SELL',
    candles?: Array<{ high: number; low: number; close: number; open: number }>,
    lotSize: number = 0.01
  ) {
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const pipValueForLot = (lotSize / 1.0) * spec.tickValuePerLot;

    // 1. Calculate 14-period True Range / ATR if candles available
    let atr = 0;
    if (candles && candles.length >= 10) {
      const recent = candles.slice(-14);
      let trSum = 0;
      for (let i = 1; i < recent.length; i++) {
        const h = recent[i].high;
        const l = recent[i].low;
        const prevC = recent[i - 1].close;
        const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
        trSum += tr;
      }
      atr = trSum / (recent.length - 1);
    }
    
    // Default ATR fallback if candles are short or flat
    if (!atr || atr <= 0) {
      atr = entryPrice * 0.0035; // ~0.35% average volatility
    }

    // 2. Identify local swing invalidation
    let stopLoss = 0;
    let takeProfit = 0;
    let slDistancePips = 0;
    let tpDistancePips = 0;
    const dynamicRR = 3.0; // Institutional 1:3.0 Target

    if (direction === 'BUY') {
      let swingLow = entryPrice - (atr * 1.5);
      if (candles && candles.length >= 10) {
        const lookback = candles.slice(-12);
        const lowestLow = Math.min(...lookback.map(c => c.low));
        swingLow = Math.min(lowestLow, entryPrice - (atr * 1.0)) - (atr * 0.25);
      }
      // Ensure SL is within reasonable bounds (between 1.2 * ATR and 3.5 * ATR from entry)
      const minDistance = atr * 1.2;
      const maxDistance = atr * 3.5;
      const actualDist = Math.max(minDistance, Math.min(maxDistance, entryPrice - swingLow));
      
      stopLoss = entryPrice - actualDist;
      takeProfit = entryPrice + (actualDist * dynamicRR);
      
      slDistancePips = spec.pipSize > 0 ? actualDist / spec.pipSize : actualDist;
      tpDistancePips = spec.pipSize > 0 ? (actualDist * dynamicRR) / spec.pipSize : actualDist * dynamicRR;
    } else {
      let swingHigh = entryPrice + (atr * 1.5);
      if (candles && candles.length >= 10) {
        const lookback = candles.slice(-12);
        const highestHigh = Math.max(...lookback.map(c => c.high));
        swingHigh = Math.max(highestHigh, entryPrice + (atr * 1.0)) + (atr * 0.25);
      }
      const minDistance = atr * 1.2;
      const maxDistance = atr * 3.5;
      const actualDist = Math.max(minDistance, Math.min(maxDistance, swingHigh - entryPrice));

      stopLoss = entryPrice + actualDist;
      takeProfit = entryPrice - (actualDist * dynamicRR);

      slDistancePips = spec.pipSize > 0 ? actualDist / spec.pipSize : actualDist;
      tpDistancePips = spec.pipSize > 0 ? (actualDist * dynamicRR) / spec.pipSize : actualDist * dynamicRR;
    }

    const calculatedRiskUsd = Number((slDistancePips * pipValueForLot).toFixed(2));
    const calculatedRewardUsd = Number((tpDistancePips * pipValueForLot).toFixed(2));

    return {
      lotSize,
      targetRiskUsd: calculatedRiskUsd,
      targetRewardUsd: calculatedRewardUsd,
      slPips: Number(slDistancePips.toFixed(1)),
      tpPips: Number(tpDistancePips.toFixed(1)),
      stopLoss: Number(stopLoss.toFixed(spec.priceDigits)),
      takeProfit: Number(takeProfit.toFixed(spec.priceDigits)),
      riskRewardRatio: dynamicRR,
      isAiDynamic: true,
      invalidationBasis: 'SMC Swing Liquidity + ATR Volatility Buffer',
    };
  }

  /**
   * Checks portfolio daily drawdown gate
   */
  public static checkDrawdownGuard(accountBalance: number, currentEquity: number, maxDailyLossPct: number = 3.0): { canTrade: boolean; currentLossPct: number; reason?: string } {
    const loss = accountBalance - currentEquity;
    const currentLossPct = loss > 0 ? (loss / accountBalance) * 100 : 0;

    if (currentLossPct >= maxDailyLossPct) {
      return {
        canTrade: false,
        currentLossPct: Number(currentLossPct.toFixed(2)),
        reason: `Daily Loss Protection Triggered: Current drawdown (${currentLossPct.toFixed(2)}%) has reached or exceeded max daily limit of ${maxDailyLossPct}%. Trading halted.`,
      };
    }
    return {
      canTrade: true,
      currentLossPct: Number(currentLossPct.toFixed(2)),
    };
  }

  /**
   * Pre-trade execution gatekeeper: Validates symbol, lot boundaries, SL/TP integrity, and spread limits.
   */
  public static validatePreExecutionOrder(order: {
    symbol: string;
    action: 'BUY' | 'SELL';
    lot: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    currentSpreadPips?: number;
    maxAllowedSpreadPips?: number;
  }): { isValid: boolean; reason?: string } {
    const spec = INSTITUTIONAL_SYMBOLS[order.symbol.toUpperCase()];
    if (!spec) {
      return { isValid: false, reason: `Unrecognized symbol: ${order.symbol}. Not in institutional register.` };
    }

    if (order.lot < spec.minLot || order.lot > spec.maxLot) {
      return { isValid: false, reason: `Lot size ${order.lot} exceeds permitted broker range [${spec.minLot}, ${spec.maxLot}] for ${order.symbol}.` };
    }

    if (order.price <= 0) {
      return { isValid: false, reason: `Invalid execution price: ${order.price}.` };
    }

    if (order.currentSpreadPips !== undefined && order.maxAllowedSpreadPips !== undefined && order.currentSpreadPips > order.maxAllowedSpreadPips) {
      return { isValid: false, reason: `Spread Spike Guard: Current spread (${order.currentSpreadPips} pips) exceeds maximum threshold (${order.maxAllowedSpreadPips} pips).` };
    }

    if (order.stopLoss && order.stopLoss > 0) {
      if (order.action === 'BUY' && order.stopLoss >= order.price) {
        return { isValid: false, reason: `Invalid Stop Loss for BUY: SL (${order.stopLoss}) must be strictly below Entry (${order.price}).` };
      }
      if (order.action === 'SELL' && order.stopLoss <= order.price) {
        return { isValid: false, reason: `Invalid Stop Loss for SELL: SL (${order.stopLoss}) must be strictly above Entry (${order.price}).` };
      }
    }

    if (order.takeProfit && order.takeProfit > 0) {
      if (order.action === 'BUY' && order.takeProfit <= order.price) {
        return { isValid: false, reason: `Invalid Take Profit for BUY: TP (${order.takeProfit}) must be strictly above Entry (${order.price}).` };
      }
      if (order.action === 'SELL' && order.takeProfit >= order.price) {
        return { isValid: false, reason: `Invalid Take Profit for SELL: TP (${order.takeProfit}) must be strictly below Entry (${order.price}).` };
      }
    }

    return { isValid: true };
  }
}

