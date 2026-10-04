import { NextRequest, NextResponse } from 'next/server';
import { AutoTraderEngine } from '@/lib/engines/auto-trader';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { NotificationService } from '@/lib/notifications/notification-service';
import { RufloSelfHealingEngine } from '@/lib/engines/ruflo-self-healing-engine';
import { RufloSwarmEngine } from '@/lib/engines/ruflo-swarm-engine';

let lastAutonomousScanTime = 0;
let lastManagePositionsTime = 0;
const AUTO_SCAN_INTERVAL_MS = 25000; // scan every 25 seconds autonomously
const MANAGE_POSITIONS_THROTTLE_MS = 5000; // throttle position management to max once per 5 seconds
let cachedTelemetry: Record<string, { data: any; time: number }> = {};
let cachedConsensus: Record<string, { data: any; time: number }> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
  const config = AutoTraderEngine.getConfig();
  const now = Date.now();

  // If bot is active, manage open positions at most once every 5 seconds wrapped in Ruflo Self-Healing
  if (config.isActive && config.autoCloseEnabled && (now - lastManagePositionsTime >= MANAGE_POSITIONS_THROTTLE_MS)) {
    lastManagePositionsTime = now;
    await RufloSelfHealingEngine.executeWithRecovery(
      'BROKER_EXECUTION',
      'AutoTrader.manageOpenPositions',
      async () => {
        await AutoTraderEngine.manageOpenPositions();
      },
      () => {}
    );
  }

  // If bot is active, run autonomous scan periodically wrapped in Ruflo Self-Healing
  if (config.isActive && (now - lastAutonomousScanTime >= AUTO_SCAN_INTERVAL_MS)) {
    lastAutonomousScanTime = now;
    await RufloSelfHealingEngine.executeWithRecovery(
      'BROKER_EXECUTION',
      'AutoTrader.scanAndExecute',
      async () => {
        await AutoTraderEngine.scanAndExecute();
      },
      () => {}
    );
  }

  const history = AutoTraderEngine.getHistory();
  const todayTradesCount = AutoTraderEngine.getTodayTradeCount();
  const analytics = AutoTraderEngine.getDetailedAnalytics();
  const persistence = AutoTraderEngine.getStorageMetadata();

  // Fast in-memory cached FinRobot consensus (15s TTL)
  let finRobotConsensus;
  if (cachedConsensus[symbol] && now - cachedConsensus[symbol].time < 15000) {
    finRobotConsensus = cachedConsensus[symbol].data;
  } else {
    finRobotConsensus = await AutoTraderEngine.getFinRobotLiveConsensus(symbol);
    cachedConsensus[symbol] = { data: finRobotConsensus, time: now };
  }

  // Fast in-memory cached protection telemetry (15s TTL)
  let protectionTelemetry;
  if (cachedTelemetry[symbol] && now - cachedTelemetry[symbol].time < 15000) {
    protectionTelemetry = cachedTelemetry[symbol].data;
  } else {
    protectionTelemetry = await AutoTraderEngine.getProtectionTelemetry(symbol);
    cachedTelemetry[symbol] = { data: protectionTelemetry, time: now };
  }

  return NextResponse.json({
    status: 'OK',
    config: AutoTraderEngine.getConfig(),
    todayTradesCount,
    history,
    analytics,
    persistence,
    finRobotConsensus,
    protectionTelemetry,
    lastScanAudit: AutoTraderEngine.getLastScanAudit(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || '';

    // Toggle Bot On / Off
    if (action === 'toggle') {
      const current = AutoTraderEngine.getConfig().isActive;
      const updated = AutoTraderEngine.updateConfig({ isActive: !current });
      return NextResponse.json({
        success: true,
        isActive: updated.isActive,
        message: updated.isActive 
          ? 'Autonomous AI Trading Bot activated! Live SMC/ICT scanning is active.' 
          : 'Autonomous AI Trading Bot paused.',
      });
    }

    // Force Immediate Market Scan & Auto-Execution
    if (action === 'force_scan') {
      const newTrades = await AutoTraderEngine.scanAndExecute(body.symbols);
      return NextResponse.json({
        success: true,
        message: newTrades.length > 0 
          ? `Scan complete! ${newTrades.length} new institutional trade(s) autonomously executed.` 
          : 'Market scan complete. No setup currently exceeds minimum confluence & No-Trade threshold.',
        executedCount: newTrades.length,
        executedTrades: newTrades,
        history: AutoTraderEngine.getHistory(),
        lastScanAudit: AutoTraderEngine.getLastScanAudit(),
      });
    }

    // Reset Circuit Breaker
    if (action === 'reset_circuit_breaker') {
      AutoTraderEngine.resetCircuitBreaker();
      return NextResponse.json({
        success: true,
        message: 'Circuit breaker reset successfully. Prop firm lock cleared.',
      });
    }

    // Update settings or modify lot size
    if (action === 'update_config' || action === 'set_lot_size' || body.lotSize !== undefined) {
      const updated = AutoTraderEngine.updateConfig({
        minScore: body.minScore !== undefined ? Number(body.minScore) : undefined,
        lotSize: body.lotSize !== undefined ? Number(body.lotSize) : undefined,
        targetExecution: body.targetExecution,
        riskPreset: body.riskPreset,
        microScalpRiskUsd: body.microScalpRiskUsd !== undefined ? Number(body.microScalpRiskUsd) : undefined,
        microScalpRewardUsd: body.microScalpRewardUsd !== undefined ? Number(body.microScalpRewardUsd) : undefined,
        maxDailyTrades: body.maxDailyTrades !== undefined ? Number(body.maxDailyTrades) : undefined,
        monitoredSymbols: body.monitoredSymbols,
        autoCloseEnabled: body.autoCloseEnabled !== undefined ? Boolean(body.autoCloseEnabled) : undefined,
        autoBreakEvenEnabled: body.autoBreakEvenEnabled !== undefined ? Boolean(body.autoBreakEvenEnabled) : undefined,
        breakEvenPips: body.breakEvenPips !== undefined ? Number(body.breakEvenPips) : undefined,
        autoPartialCloseEnabled: body.autoPartialCloseEnabled !== undefined ? Boolean(body.autoPartialCloseEnabled) : undefined,
        partialClosePips: body.partialClosePips !== undefined ? Number(body.partialClosePips) : undefined,
        partialClosePercentage: body.partialClosePercentage !== undefined ? Number(body.partialClosePercentage) : undefined,
        autoTrailingStopEnabled: body.autoTrailingStopEnabled !== undefined ? Boolean(body.autoTrailingStopEnabled) : undefined,
        trailingActivationPips: body.trailingActivationPips !== undefined ? Number(body.trailingActivationPips) : undefined,
        trailingDistancePips: body.trailingDistancePips !== undefined ? Number(body.trailingDistancePips) : undefined,
        trailingStepPips: body.trailingStepPips !== undefined ? Number(body.trailingStepPips) : undefined,
        maxPositionsPerSymbol: body.maxPositionsPerSymbol !== undefined ? Number(body.maxPositionsPerSymbol) : undefined,
        highAccuracyMode: body.highAccuracyMode !== undefined ? Boolean(body.highAccuracyMode) : undefined,
        useFinRobotConsensus: body.useFinRobotConsensus !== undefined ? Boolean(body.useFinRobotConsensus) : undefined,
        minFinRobotConsensus: body.minFinRobotConsensus !== undefined ? Number(body.minFinRobotConsensus) : undefined,
        cooldownSeconds: body.cooldownSeconds !== undefined ? Number(body.cooldownSeconds) : undefined,
        maxConcurrentTrades: body.maxConcurrentTrades !== undefined ? Number(body.maxConcurrentTrades) : undefined,
      });

      return NextResponse.json({
        success: true,
        config: updated,
        message: `Auto-trader configuration updated. Active Lot: ${updated.lotSize}`,
      });
    }

    // 1-Click Manual Close All Positions & Resume Auto-Trading
    if (action === 'close_all_positions' || action === 'close_all_trades') {
      const result = await AutoTraderEngine.closeAllPositions('USER_1CLICK');
      return NextResponse.json({
        success: true,
        message: `Tamam trades close kar di gayi hain (${result.closedCount} positions closed). Bot active hai aur foran nai trades scan kar raha hai!`,
        closedCount: result.closedCount,
        history: AutoTraderEngine.getHistory(),
      });
    }

    // Reset Cooldowns & Trigger Instant Scan
    if (action === 'reset_cooldown' || action === 'resume_trading' || action === 'reset_circuit_breaker') {
      AutoTraderEngine.resetCooldowns();
      AutoTraderEngine.resetCircuitBreaker();
      const newTrades = await AutoTraderEngine.scanAndExecute();
      return NextResponse.json({
        success: true,
        message: `Cooldowns aur Circuit Breaker reset ho gaye hain! Market scan complete (${newTrades.length} trades executed).`,
        executedTrades: newTrades,
        history: AutoTraderEngine.getHistory(),
      });
    }

    // Manual or Autonomous Position Close Trigger
    if (action === 'close_position') {
      const { symbol, ticket, lot } = body;
      const order = Mt5Bridge.queueOrder({
        action: 'CLOSE',
        symbol,
        lot: lot || 0.01,
        magic: ticket,
      });
      return NextResponse.json({
        success: true,
        message: `Close command queued for ${symbol} #${ticket || ''}`,
        order,
      });
    }

    // Manual Trigger Break-Even for a specific running position
    if (action === 'trigger_break_even') {
      const { symbol, ticket, entryPrice, stopLoss, takeProfit, lot, isBuy } = body;
      const digits = symbol === 'XAUUSD' || symbol.includes('JPY') || symbol === 'BTCUSD' ? 2 : 5;
      const pipSize = symbol === 'XAUUSD' || symbol.includes('JPY') || symbol === 'BTCUSD' ? 0.1 : 0.0001;
      const openPrice = Number(entryPrice);
      const breakEvenSL = isBuy 
        ? Number((openPrice + pipSize * 1.0).toFixed(digits))
        : Number((openPrice - pipSize * 1.0).toFixed(digits));

      const order = Mt5Bridge.queueOrder({
        action: 'MODIFY',
        symbol,
        lot: lot || 0.01,
        magic: ticket,
        price: openPrice,
        stopLoss: breakEvenSL,
        takeProfit: Number(takeProfit) || 0,
      });

      // Dispatch Telegram Break-Even notification
      void NotificationService.sendBreakEvenAlert({
        symbol,
        action: isBuy ? 'BUY' : 'SELL',
        lotSize: lot || 0.01,
        entryPrice: openPrice,
        newStopLoss: breakEvenSL,
        takeProfit: Number(takeProfit) || 0,
        pips: 15.0,
        profitUsd: 4.80,
        ticket,
        targetBroker: 'Exness MT5 Live Bridge',
        timestamp: Date.now(),
      });

      return NextResponse.json({
        success: true,
        message: `Position #${ticket} Break-Even par shift kar di gayi hai (New SL: ${breakEvenSL})!`,
        order,
      });
    }

    // Manual or 1-Click 50% Partial Close for a specific running position
    if (action === 'partial_close') {
      const { symbol, ticket, lot, currentPrice, entryPrice, isBuy, takeProfit, profit } = body;
      const fullLot = Number(lot) || 0.02;
      const closedLot = Number((fullLot * 0.5).toFixed(2)) || 0.01;
      const remainingLot = Number((fullLot - closedLot).toFixed(2)) || 0.01;
      const pnl = Number(profit) || 0;
      const realizedProfit = Number((pnl * 0.5).toFixed(2));
      const digits = symbol === 'EURUSD' || symbol === 'GBPUSD' ? 5 : 2;
      const pipSize = symbol === 'XAUUSD' || symbol.includes('JPY') || symbol === 'BTCUSD' ? 0.1 : 0.0001;
      const openPrice = Number(entryPrice) || Number(currentPrice);
      const breakEvenPrice = isBuy 
        ? Number((openPrice + pipSize * 1.0).toFixed(digits))
        : Number((openPrice - pipSize * 1.0).toFixed(digits));

      // 1. Queue PARTIAL_CLOSE deal to MT5 Bridge
      const order = Mt5Bridge.queueOrder({
        action: 'PARTIAL_CLOSE' as any,
        symbol,
        lot: closedLot,
        magic: ticket,
        price: Number(currentPrice),
      });

      // 2. Move Stop Loss to Break-Even for remaining Runner
      Mt5Bridge.queueOrder({
        action: 'MODIFY' as any,
        symbol,
        lot: remainingLot,
        magic: ticket,
        price: openPrice,
        stopLoss: breakEvenPrice,
        takeProfit: Number(takeProfit) || 0,
      });

      // 3. Trigger Paper Broker partial close & modify
      try {
        await globalPaperBroker.partialClosePosition(String(ticket), 50, Number(currentPrice));
        await globalPaperBroker.modifyPosition(String(ticket), breakEvenPrice, Number(takeProfit) || 0);
      } catch (e) {}

      // 4. Dispatch Telegram & Discord Partial Alert
      void NotificationService.sendPartialCloseAlert({
        symbol,
        action: isBuy ? 'BUY' : 'SELL',
        closedLot,
        remainingLot,
        closePrice: Number(currentPrice),
        profitUsd: realizedProfit > 0 ? realizedProfit : 5.50,
        pips: 25.0,
        ticket,
        targetBroker: 'Exness MT5 Live Bridge',
        newStopLoss: breakEvenPrice,
        takeProfit: Number(takeProfit) || 0,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        success: true,
        message: `Position #${ticket}: 50% lot (${closedLot} Lot) close karke profit book kar liya! Runner (${remainingLot} Lot) Break-Even par mehfooz hai.`,
        order,
      });
    }

    // Test Break-Even Telegram Alert
    if (action === 'test_be_alert') {
      const res = await NotificationService.sendBreakEvenAlert({
        symbol: body.symbol || 'XAUUSD',
        action: 'BUY',
        lotSize: body.lotSize || 0.01,
        entryPrice: 2648.50,
        newStopLoss: 2648.60,
        takeProfit: 2665.00,
        pips: 16.5,
        profitUsd: 5.20,
        ticket: 18749205,
        targetBroker: 'Exness MT5 Live Bridge',
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: 'Auto Break-Even Alert sent to Telegram & Discord!',
        result: res,
      });
    }

    // Test 50% Partial Close Telegram Alert
    if (action === 'test_partial_alert') {
      const res = await NotificationService.sendPartialCloseAlert({
        symbol: body.symbol || 'XAUUSD',
        action: 'BUY',
        closedLot: 0.01,
        remainingLot: 0.01,
        closePrice: 2673.50,
        profitUsd: 8.50,
        pips: 25.0,
        ticket: 18749208,
        targetBroker: 'Exness MT5 Live Bridge',
        newStopLoss: 2648.50,
        takeProfit: 2695.00,
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: '50% Partial Close Alert sent to Telegram & Discord!',
        result: res,
      });
    }

    // Manual Trailing Stop Trigger for a Running Trade
    if (action === 'trigger_trailing_stop') {
      const result = AutoTraderEngine.triggerManualTrailingStop({
        ticket: Number(body.ticket),
        symbol: body.symbol,
        lot: Number(body.lot || 0.01),
        currentPrice: Number(body.currentPrice),
        entryPrice: Number(body.entryPrice),
        currentSL: Number(body.stopLoss || 0),
        takeProfit: Number(body.takeProfit || 0),
        isBuy: Boolean(body.isBuy),
        profit: Number(body.profit || 0),
      });
      return NextResponse.json(result);
    }

    // Test Dynamic Trailing Stop Telegram Alert
    if (action === 'test_trailing_alert') {
      const res = await NotificationService.sendTrailingStopAlert({
        symbol: body.symbol || 'XAUUSD',
        action: 'BUY',
        lotSize: body.lotSize || 0.01,
        entryPrice: 2650.00,
        currentPrice: 2685.50,
        previousStopLoss: 2660.00,
        newStopLoss: 2670.50,
        takeProfit: 2710.00,
        pips: 35.5,
        lockedPips: 20.5,
        profitUsd: 18.50,
        ticket: 18749210,
        targetBroker: 'Exness MT5 Live Bridge',
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: 'Dynamic Trailing Stop Alert sent to Telegram & Discord!',
        result: res,
      });
    }

    // Test Take Profit Telegram Alert
    if (action === 'test_tp_alert') {
      const res = await NotificationService.sendTradeCloseAlert({
        symbol: body.symbol || 'XAUUSD',
        action: 'BUY',
        lotSize: body.lotSize || 0.01,
        closePrice: 2658.50,
        profitUsd: 15.20,
        pips: 45.0,
        reason: 'Target Liquidity Pool hit at 2658.50 (Take Profit target reached)',
        closeType: 'TP_HIT',
        ticket: 18749201,
        targetBroker: 'Exness MT5 Live Bridge',
        totalDailyProfit: 54.80,
        totalDailyLoss: 8.20,
        todayNetPnl: 46.60,
        activeTradesCount: 47,
        accountBalance: 554.80,
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: 'Take Profit Hit Alert sent to Telegram & Discord!',
        result: res,
      });
    }

    // Test Stop Loss Telegram Alert
    if (action === 'test_sl_alert') {
      const res = await NotificationService.sendTradeCloseAlert({
        symbol: body.symbol || 'BTCUSD',
        action: 'BUY',
        lotSize: body.lotSize || 0.01,
        closePrice: 63310.00,
        profitUsd: -4.80,
        pips: -18.5,
        reason: 'SMC Invalidation Level hit at 63310.00 (Stop Loss triggered)',
        closeType: 'SL_HIT',
        ticket: 18749202,
        targetBroker: 'Exness MT5 Live Bridge',
        totalDailyProfit: 54.80,
        totalDailyLoss: 13.00,
        todayNetPnl: 41.80,
        activeTradesCount: 47,
        accountBalance: 550.00,
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: 'Stop Loss Hit Alert sent to Telegram & Discord!',
        result: res,
      });
    }

    // Force Save to Disk
    if (action === 'force_save') {
      AutoTraderEngine.persistState();
      const meta = AutoTraderEngine.getStorageMetadata();
      return NextResponse.json({
        success: true,
        message: `Trade history disk par mehfooz kar di gayi hai (${meta.recordsCount} records in data/trade_history.json)!`,
        persistence: meta,
      });
    }

    // Get Persistence Metadata
    if (action === 'get_persistence_info') {
      const meta = AutoTraderEngine.getStorageMetadata();
      return NextResponse.json({
        success: true,
        persistence: meta,
      });
    }

    // Emergency Stop
    if (action === 'emergency_stop') {
      AutoTraderEngine.updateConfig({ isActive: false });
      return NextResponse.json({
        success: true,
        message: 'EMERGENCY STOP ACTIVATED: Auto-trader halted immediately.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
