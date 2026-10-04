import { Candle, BacktestSummary, BacktestTrade, SymbolSpec } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';
import { SmcEngine } from './smc-engine';
import { PriceActionEngine } from './price-action-engine';

export interface BacktestParams {
  symbol: string;
  strategy: 'SMC_ICT_CONFLUENCE' | 'LIQUIDITY_SWEEP_MSS' | 'ORDER_BLOCK_FVG_RETEST' | 'EMA_TREND_PULLBACK';
  initialBalance: number;
  riskPercent: number;      // e.g. 1.0 = 1%
  fixedLotSize?: number;    // if null/0, uses dynamic risk sizing
  spreadPips: number;       // e.g. 1.0
  commissionPerLot: number; // e.g. 5.0 ($5 per lot round turn)
  slippagePips: number;     // e.g. 0.5
  candles: Candle[];
}

export class BacktestEngine {
  /**
   * Runs an institutional forward-simulation backtest with strictly NO lookahead bias
   */
  public static runBacktest(params: BacktestParams): BacktestSummary {
    const {
      symbol,
      strategy,
      initialBalance,
      riskPercent,
      fixedLotSize,
      spreadPips,
      commissionPerLot,
      slippagePips,
      candles,
    } = params;

    const spec: SymbolSpec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const trades: BacktestTrade[] = [];
    const equityCurve: { time: string; equity: number; drawdown: number }[] = [];

    let currentEquity = initialBalance;
    let peakEquity = initialBalance;
    let maxDrawdownUsd = 0;
    let maxDrawdownPct = 0;

    // Minimum warmup period of 30 bars so indicators and swing points have history
    const warmup = 30;

    // Active trade tracker with Institutional Trade Management (BE, 50% Partial, Trailing)
    let openTrade: {
      type: 'BUY' | 'SELL';
      entryPrice: number;
      entryTime: number;
      stopLoss: number;
      initialStopLoss: number;
      takeProfit: number;
      lotSize: number;
      initialLotSize: number;
      reason: string;
      isBreakEvenArmed: boolean;
      isPartialClosed: boolean;
      partialProfitBooked: number;
    } | null = null;

    for (let i = warmup; i < candles.length; i++) {
      const currentCandle = candles[i];
      const historicalSlice = candles.slice(0, i); // Strictly NO future data leakage!

      // 1. If we have an open position, evaluate Trade Management & SL/TP Hit
      if (openTrade) {
        const isBuy = openTrade.type === 'BUY';
        const bestPrice = isBuy ? currentCandle.high : currentCandle.low;
        const favorablePriceDiff = isBuy ? bestPrice - openTrade.entryPrice : openTrade.entryPrice - bestPrice;
        const favorablePips = spec.pipSize > 0 ? favorablePriceDiff / spec.pipSize : favorablePriceDiff;

        // Auto-Breakeven (+12 pips): shift SL to entry price (+ spread buffer)
        if (!openTrade.isBreakEvenArmed && favorablePips >= 12) {
          const beBuffer = (spreadPips * spec.pipSize * 0.2);
          openTrade.stopLoss = isBuy ? openTrade.entryPrice + beBuffer : openTrade.entryPrice - beBuffer;
          openTrade.isBreakEvenArmed = true;
        }

        // 50% Partial Close (+20 pips): lock in 50% profit, arm BE
        if (!openTrade.isPartialClosed && favorablePips >= 20) {
          const partialLot = Math.max(spec.minLot, Math.round((openTrade.lotSize * 0.5) / spec.lotStep) * spec.lotStep);
          if (partialLot > 0 && partialLot < openTrade.lotSize) {
            const bookedPips = 20;
            const grossBooked = bookedPips * (partialLot * spec.tickValuePerLot);
            const commBooked = partialLot * commissionPerLot;
            const netBooked = grossBooked - commBooked;

            currentEquity += netBooked;
            if (currentEquity > peakEquity) peakEquity = currentEquity;
            openTrade.partialProfitBooked += netBooked;
            openTrade.lotSize = Number((openTrade.lotSize - partialLot).toFixed(2));
            openTrade.isPartialClosed = true;

            const beBuffer = (spreadPips * spec.pipSize * 0.2);
            openTrade.stopLoss = isBuy ? Math.max(openTrade.stopLoss, openTrade.entryPrice + beBuffer) : Math.min(openTrade.stopLoss, openTrade.entryPrice - beBuffer);
            openTrade.isBreakEvenArmed = true;
          }
        }

        // Dynamic Trailing Stop (+18 pips activation, 12 pips trail distance)
        if (favorablePips >= 18) {
          const trailDistance = 12 * spec.pipSize;
          if (isBuy) {
            const potentialSl = currentCandle.close - trailDistance;
            if (potentialSl > openTrade.stopLoss) {
              openTrade.stopLoss = potentialSl;
            }
          } else {
            const potentialSl = currentCandle.close + trailDistance;
            if (potentialSl < openTrade.stopLoss) {
              openTrade.stopLoss = potentialSl;
            }
          }
        }

        // Check Exit Hit
        let isClosed = false;
        let exitPrice = 0;

        if (isBuy) {
          if (currentCandle.low <= openTrade.stopLoss) {
            isClosed = true;
            exitPrice = openTrade.stopLoss - (slippagePips * spec.pipSize);
          } else if (currentCandle.high >= openTrade.takeProfit) {
            isClosed = true;
            exitPrice = openTrade.takeProfit;
          }
        } else {
          if (currentCandle.high >= openTrade.stopLoss) {
            isClosed = true;
            exitPrice = openTrade.stopLoss + (slippagePips * spec.pipSize);
          } else if (currentCandle.low <= openTrade.takeProfit) {
            isClosed = true;
            exitPrice = openTrade.takeProfit;
          }
        }

        if (isClosed) {
          const priceDiff = isBuy ? exitPrice - openTrade.entryPrice : openTrade.entryPrice - exitPrice;
          const pipsGain = spec.pipSize > 0 ? priceDiff / spec.pipSize : priceDiff;
          const grossProfit = pipsGain * (openTrade.lotSize * spec.tickValuePerLot);
          const commissionCost = openTrade.lotSize * commissionPerLot;
          const remainingNetProfit = grossProfit - commissionCost;
          const totalNetProfit = remainingNetProfit + openTrade.partialProfitBooked;

          currentEquity += remainingNetProfit;
          if (currentEquity > peakEquity) peakEquity = currentEquity;
          const ddUsd = peakEquity - currentEquity;
          const ddPct = (ddUsd / peakEquity) * 100;
          if (ddUsd > maxDrawdownUsd) maxDrawdownUsd = ddUsd;
          if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

          const initialSlPips = Math.abs(openTrade.entryPrice - openTrade.initialStopLoss) / spec.pipSize;
          const rMultiple = initialSlPips > 0 ? Number((pipsGain / initialSlPips).toFixed(2)) : 0;

          trades.push({
            id: `bt-trade-${trades.length + 1}`,
            symbol,
            type: openTrade.type,
            entryTime: openTrade.entryTime,
            entryPrice: openTrade.entryPrice,
            exitTime: currentCandle.time,
            exitPrice,
            stopLoss: openTrade.stopLoss,
            takeProfit: openTrade.takeProfit,
            lotSize: openTrade.initialLotSize,
            profitUsd: Number(totalNetProfit.toFixed(2)),
            returnPercent: Number(((totalNetProfit / initialBalance) * 100).toFixed(2)),
            rMultiple,
            result: totalNetProfit > 0.05 ? 'WIN' : (totalNetProfit < -0.05 ? 'LOSS' : 'BREAKEVEN'),
            reason: openTrade.isPartialClosed ? `${openTrade.reason} [50% Partial Booked]` : openTrade.reason,
          });

          openTrade = null;
        }
      }

      // Record equity curve point every 5 candles or on trade exit
      if (i % 5 === 0 || i === candles.length - 1) {
        const dd = Math.max(0, peakEquity - currentEquity);
        equityCurve.push({
          time: new Date(currentCandle.time).toISOString().split('T')[0] + ` ${new Date(currentCandle.time).getHours()}:00`,
          equity: Number(currentEquity.toFixed(2)),
          drawdown: Number(dd.toFixed(2)),
        });
      }

      // 2. If no open trade, check strategy entry signal
      if (!openTrade && i < candles.length - 1) {
        const swings = SmcEngine.detectSwingPoints(historicalSlice, 2);
        const fvgs = SmcEngine.detectFairValueGaps(historicalSlice);
        const obs = SmcEngine.detectOrderBlocks(historicalSlice);
        const sweeps = SmcEngine.detectLiquiditySweeps(historicalSlice, swings);
        const paSignals = PriceActionEngine.detectPatterns(historicalSlice);

        const lastBar = historicalSlice[historicalSlice.length - 1];
        let signal: 'BUY' | 'SELL' | null = null;
        let entryReason = '';

        if (strategy === 'LIQUIDITY_SWEEP_MSS' || strategy === 'SMC_ICT_CONFLUENCE') {
          const recentSweep = sweeps.slice(-4).find(s => s.isSwept);
          const recentDisplacement = paSignals.slice(-2).find(p => p.pattern === 'DISPLACEMENT' || p.pattern === 'ENGULFING');

          if (recentSweep?.type === 'SELL_SIDE' && recentDisplacement?.direction === 'BULLISH') {
            signal = 'BUY';
            entryReason = 'SSL swept followed by Bullish Displacement MSS';
          } else if (recentSweep?.type === 'BUY_SIDE' && recentDisplacement?.direction === 'BEARISH') {
            signal = 'SELL';
            entryReason = 'BSL swept followed by Bearish Displacement MSS';
          }
        } else if (strategy === 'ORDER_BLOCK_FVG_RETEST') {
          const activeBullOb = obs.slice(-3).find(o => o.type === 'BULLISH' && !o.isMitigated);
          const activeBearOb = obs.slice(-3).find(o => o.type === 'BEARISH' && !o.isMitigated);

          if (activeBullOb && lastBar.low <= activeBullOb.high && lastBar.close >= activeBullOb.low) {
            signal = 'BUY';
            entryReason = 'Unmitigated Bullish Order Block retest';
          } else if (activeBearOb && lastBar.high >= activeBearOb.low && lastBar.close <= activeBearOb.high) {
            signal = 'SELL';
            entryReason = 'Unmitigated Bearish Order Block retest';
          }
        } else if (strategy === 'EMA_TREND_PULLBACK') {
          const emaFast = historicalSlice.slice(-10).reduce((a, b) => a + b.close, 0) / 10;
          const emaSlow = historicalSlice.slice(-25).reduce((a, b) => a + b.close, 0) / 25;
          if (emaFast > emaSlow && lastBar.close > emaFast && lastBar.low <= emaFast) {
            signal = 'BUY';
            entryReason = 'Bullish Trend EMA 10/25 dynamic pullback';
          } else if (emaFast < emaSlow && lastBar.close < emaFast && lastBar.high >= emaFast) {
            signal = 'SELL';
            entryReason = 'Bearish Trend EMA 10/25 dynamic pullback';
          }
        }

        if (signal) {
          const isBuy = signal === 'BUY';
          const spreadCost = spreadPips * spec.pipSize;
          const entryPrice = isBuy 
            ? currentCandle.close + spreadCost + (slippagePips * spec.pipSize)
            : currentCandle.close - (slippagePips * spec.pipSize);

          const recentRanges = historicalSlice.slice(-14).map(c => c.high - c.low);
          const atr = recentRanges.reduce((a, b) => a + b, 0) / 14;
          const slDistance = Math.max(spec.pipSize * 15, atr * 1.5);
          const tpDistance = slDistance * 2.5; // 1:2.5 R:R

          const stopLoss = isBuy ? entryPrice - slDistance : entryPrice + slDistance;
          const takeProfit = isBuy ? entryPrice + tpDistance : entryPrice - tpDistance;

          let lot = 0.01;
          if (fixedLotSize && fixedLotSize > 0) {
            lot = fixedLotSize;
          } else {
            const riskUsd = (currentEquity * (riskPercent / 100));
            const slPips = slDistance / spec.pipSize;
            const calculatedLot = riskUsd / (slPips * spec.tickValuePerLot);
            lot = Math.max(spec.minLot, Math.min(spec.maxLot, Math.round(calculatedLot / spec.lotStep) * spec.lotStep));
          }

          openTrade = {
            type: signal,
            entryPrice,
            entryTime: currentCandle.time,
            stopLoss,
            initialStopLoss: stopLoss,
            takeProfit,
            lotSize: lot,
            initialLotSize: lot,
            reason: entryReason,
            isBreakEvenArmed: false,
            isPartialClosed: false,
            partialProfitBooked: 0,
          };
        }
      }
    }

    // Calculate aggregated metrics
    const winningTrades = trades.filter(t => t.result === 'WIN');
    const losingTrades = trades.filter(t => t.result === 'LOSS');
    const totalTrades = trades.length;

    const grossProfit = winningTrades.reduce((acc, t) => acc + t.profitUsd, 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.profitUsd, 0));
    const netProfit = grossProfit - grossLoss;

    const winRate = totalTrades > 0 ? Number(((winningTrades.length / totalTrades) * 100).toFixed(1)) : 0;
    const lossRate = totalTrades > 0 ? Number(((losingTrades.length / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.9 : 0);

    const averageWin = winningTrades.length > 0 ? Number((grossProfit / winningTrades.length).toFixed(2)) : 0;
    const averageLoss = losingTrades.length > 0 ? Number((grossLoss / losingTrades.length).toFixed(2)) : 0;
    const expectancy = Number(((winRate / 100 * averageWin) - (lossRate / 100 * averageLoss)).toFixed(2));

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitUsd)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitUsd)) : 0;

    // Consecutive wins/losses
    let maxWins = 0, currWins = 0;
    let maxLosses = 0, currLosses = 0;
    for (const t of trades) {
      if (t.result === 'WIN') {
        currWins++;
        currLosses = 0;
        if (currWins > maxWins) maxWins = currWins;
      } else if (t.result === 'LOSS') {
        currLosses++;
        currWins = 0;
        if (currLosses > maxLosses) maxLosses = currLosses;
      }
    }

    // Institutional Periodic Sharpe & Sortino Ratio
    // Group equity curve changes by calendar day for hedge fund gold standard
    const dailyEquityMap = new Map<string, number>();
    for (const pt of equityCurve) {
      const day = pt.time.split(' ')[0];
      dailyEquityMap.set(day, pt.equity);
    }

    const dailyEquities = Array.from(dailyEquityMap.values());
    const dailyReturns: number[] = [];
    for (let k = 1; k < dailyEquities.length; k++) {
      const prev = dailyEquities[k - 1];
      if (prev > 0) {
        dailyReturns.push((dailyEquities[k] - prev) / prev);
      }
    }

    let sharpeRatio = 0;
    let sortinoRatio = 0;

    if (dailyReturns.length >= 2) {
      const avgDailyRet = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const dailyVar = dailyReturns.reduce((a, b) => a + Math.pow(b - avgDailyRet, 2), 0) / (dailyReturns.length - 1);
      const dailyStd = Math.sqrt(dailyVar);
      sharpeRatio = dailyStd > 0 ? Number(((avgDailyRet / dailyStd) * Math.sqrt(252)).toFixed(2)) : 0;

      const downsideDaily = dailyReturns.filter(r => r < 0);
      const downsideDailyVar = downsideDaily.length > 0 
        ? downsideDaily.reduce((a, b) => a + Math.pow(b, 2), 0) / downsideDaily.length 
        : 0;
      const downsideDailyStd = Math.sqrt(downsideDailyVar);
      sortinoRatio = downsideDailyStd > 0 ? Number(((avgDailyRet / downsideDailyStd) * Math.sqrt(252)).toFixed(2)) : 0;
    } else {
      const returns = trades.map(t => t.returnPercent);
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const variance = returns.length > 0 ? returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length : 0;
      const stdDev = Math.sqrt(variance);
      const durationMs = candles.length > 1 ? candles[candles.length - 1].time - candles[0].time : 86400000;
      const durationDays = Math.max(1, durationMs / (1000 * 60 * 60 * 24));
      const annualizedTrades = Math.max(1, (trades.length / durationDays) * 252);
      sharpeRatio = stdDev > 0 ? Number(((avgReturn / stdDev) * Math.sqrt(annualizedTrades)).toFixed(2)) : 0;

      const downsideReturns = returns.filter(r => r < 0);
      const downsideVar = downsideReturns.length > 0 ? downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / downsideReturns.length : 0;
      const downsideStdDev = Math.sqrt(downsideVar);
      sortinoRatio = downsideStdDev > 0 ? Number(((avgReturn / downsideStdDev) * Math.sqrt(annualizedTrades)).toFixed(2)) : 0;
    }

    const avgRr = trades.length > 0 ? Number((trades.reduce((a, b) => a + b.rMultiple, 0) / trades.length).toFixed(2)) : 0;

    const startDate = candles[0] ? new Date(candles[0].time).toLocaleDateString() : '';
    const endDate = candles[candles.length - 1] ? new Date(candles[candles.length - 1].time).toLocaleDateString() : '';

    return {
      strategyName: strategy,
      symbol,
      timeframe: '15m',
      startDate,
      endDate,
      initialBalance,
      finalBalance: Number(currentEquity.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      lossRate,
      profitFactor,
      expectancy,
      maxDrawdownUsd: Number(maxDrawdownUsd.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPct.toFixed(2)),
      sharpeRatio,
      sortinoRatio,
      averageWin,
      averageLoss,
      largestWin: Number(largestWin.toFixed(2)),
      largestLoss: Number(largestLoss.toFixed(2)),
      maxConsecutiveWins: maxWins,
      maxConsecutiveLosses: maxLosses,
      averageRiskReward: avgRr,
      equityCurve,
      trades,
    };
  }
}
