import { NextRequest, NextResponse } from 'next/server';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';
import { AutoTraderEngine } from '@/lib/engines/auto-trader';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { getRealOrderBook } from '@/lib/data/real-orderbook';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];

    // 1. Live MT5 Bridge status & account
    const mt5Config = Mt5Bridge.getConfig();
    const mt5Positions = Mt5Bridge.getPositions();
    const floatingProfit = Mt5Bridge.getFloatingProfit();
    const liveTicks = Mt5Bridge.getLiveTicks();
    const currentTick = liveTicks[symbol] || {
      bid: spec.currentPrice,
      ask: spec.currentPrice + (spec.spreadPips || 0.15),
      price: spec.currentPrice,
      time: Date.now(),
      change: 0,
      high: spec.currentPrice,
      low: spec.currentPrice,
    };

    // 2. Auto-Trader engine status & trade history
    const botConfig = AutoTraderEngine.getConfig();
    const history = AutoTraderEngine.getHistory();
    const todayTradesCount = AutoTraderEngine.getTodayTradeCount();
    const analytics = AutoTraderEngine.getDetailedAnalytics();

    // 3. Multi-Agent Swarm Live Consensus & Telemetry
    let finRobotConsensus = null;
    let protectionTelemetry = null;
    try {
      finRobotConsensus = await AutoTraderEngine.getFinRobotLiveConsensus(symbol);
    } catch (e) {
      console.warn('[Vortex Telemetry] getFinRobotLiveConsensus non-blocking err:', e);
    }

    try {
      protectionTelemetry = await AutoTraderEngine.getProtectionTelemetry(symbol);
    } catch (e) {
      console.warn('[Vortex Telemetry] getProtectionTelemetry non-blocking err:', e);
    }

    // 4. Real L2 Order Book Depth
    let orderBook = null;
    try {
      orderBook = await getRealOrderBook(symbol);
    } catch (e) {
      console.warn('[Vortex Telemetry] getRealOrderBook non-blocking err:', e);
    }

    return NextResponse.json({
      status: 'OK',
      timestamp: Date.now(),
      symbol,
      tick: currentTick,
      mt5: {
        isConnected: mt5Config.isConnected,
        balance: mt5Config.balance ?? 10000,
        equity: mt5Config.equity ?? (mt5Config.balance ?? 10000) + floatingProfit,
        freeMargin: mt5Config.freeMargin ?? 10000,
        server: mt5Config.server || 'Exness-MT5Trial16',
        login: mt5Config.login || '472658395',
        floatingProfit,
        positions: mt5Positions,
        openPositionsCount: mt5Positions.length,
      },
      bot: {
        isActive: botConfig.isActive,
        minScore: botConfig.minScore,
        lotSize: botConfig.lotSize,
        todayTradesCount,
        history: history.slice(0, 30),
        analytics,
      },
      agents: finRobotConsensus ? {
        consensusScore: finRobotConsensus.consensusScore,
        primaryDirection: finRobotConsensus.primaryDirection,
        isApproved: finRobotConsensus.isApproved,
        agreementRatio: finRobotConsensus.agreementRatio,
        romanUrduSummary: finRobotConsensus.romanUrduConsensusSummary,
        votes: finRobotConsensus.agentVotes,
        kelly: finRobotConsensus.fractionalKelly,
      } : null,
      protection: protectionTelemetry,
      orderBook,
    });
  } catch (error: any) {
    console.error('[Vortex Telemetry API Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || '';

    // Action A: Toggle Autonomous Swarm Bot
    if (action === 'toggle_bot') {
      const current = AutoTraderEngine.getConfig();
      const updated = AutoTraderEngine.setConfig({ isActive: !current.isActive });
      return NextResponse.json({ success: true, isActive: updated.isActive });
    }

    // Action B: Execute Swarm Signal directly into MT5 & Paper Broker
    if (action === 'execute_swarm_signal') {
      const { symbol = 'XAUUSD', direction = 'BUY', lot = 0.01, sl, tp, comment = 'VORTEX_SWARM' } = body;
      const ticks = Mt5Bridge.getLiveTicks();
      const livePrice = ticks[symbol]?.price || (direction === 'BUY' ? ticks[symbol]?.ask : ticks[symbol]?.bid) || 0;

      // Queue order to MT5 Bridge
      Mt5Bridge.queueOrder({
        action: direction === 'BUY' ? 'BUY' : 'SELL',
        symbol,
        lot: Number(lot) || 0.01,
        price: livePrice,
        stopLoss: sl ? Number(sl) : 0,
        takeProfit: tp ? Number(tp) : 0,
        magic: 889900,
      });

      // Also mirror to global Paper Broker for instantaneous local telemetry
      let paperOrder = null;
      try {
        paperOrder = await globalPaperBroker.placeOrder({
          symbol,
          type: direction === 'BUY' ? 'BUY' : 'SELL',
          lotSize: Number(lot) || 0.01,
          entryPrice: livePrice,
          stopLoss: sl ? Number(sl) : undefined,
          takeProfit: tp ? Number(tp) : undefined,
        });
      } catch (e) {
        console.warn('[Vortex Swarm Execution] Paper order mirror:', e);
      }

      Mt5Bridge.addLog(`[VORTEX SWARM]: Manual Execution ${direction} ${lot} ${symbol} @ ${livePrice}`, 'success');

      return NextResponse.json({
        success: true,
        message: `Swarm ${direction} order for ${symbol} queued to MT5 Bridge`,
        order: {
          symbol,
          direction,
          lot,
          price: livePrice,
          paperOrder,
        },
      });
    }

    // Action C: Close Position
    if (action === 'close_position') {
      const { ticket, symbol } = body;
      if (ticket) {
        Mt5Bridge.queueOrder({
          action: 'CLOSE',
          symbol: symbol || 'XAUUSD',
          lot: 0,
          magic: Number(ticket),
          price: 0,
        });
      }
      return NextResponse.json({ success: true, message: `Close order queued for ticket #${ticket}` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error processing action' }, { status: 500 });
  }
}
