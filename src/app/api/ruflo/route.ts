import { NextRequest, NextResponse } from 'next/server';
import { RufloSelfHealingEngine } from '@/lib/engines/ruflo-self-healing-engine';
import { RufloSwarmEngine } from '@/lib/engines/ruflo-swarm-engine';
import { RufloAgentMemory } from '@/lib/engines/ruflo-agent-memory';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();

  try {
    const diagnostics = RufloSelfHealingEngine.runFullDiagnostics();
    const memoryStats = RufloAgentMemory.getMemoryStats();

    // Get live price anchor from MT5 or baseline
    const liveTicks = Mt5Bridge.getLiveTicks();
    const currentPrice = liveTicks[symbol]?.price || (symbol.includes('BTC') ? 81250 : 4378.29);

    // Run quick consensus evaluation
    const swarm = await RufloSwarmEngine.evaluateSwarm(symbol, [], currentPrice, 50000);

    return NextResponse.json({
      status: 'OK',
      symbol,
      diagnostics,
      memoryStats,
      swarm,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Ruflo API GET error:', err);
    return NextResponse.json(
      { status: 'ERROR', message: err?.message || 'Ruflo API request failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'trigger_self_heal';

    if (action === 'trigger_self_heal') {
      const healResult = RufloSelfHealingEngine.triggerManualSelfHeal();
      return NextResponse.json({
        success: true,
        action: 'trigger_self_heal',
        result: healResult,
        timestamp: Date.now(),
      });
    }

    if (action === 'evaluate_swarm') {
      const symbol = (body.symbol || 'XAUUSD').toUpperCase();
      const accountBalance = Number(body.accountBalance || 50000);
      const currentPrice = Number(body.currentPrice || 4378.29);
      const candles = Array.isArray(body.candles) ? body.candles : [];

      const swarm = await RufloSwarmEngine.evaluateSwarm(
        symbol,
        candles,
        currentPrice,
        accountBalance,
        body.options || {}
      );

      return NextResponse.json({
        success: true,
        action: 'evaluate_swarm',
        swarm,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Ruflo API POST error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Ruflo action execution failed' },
      { status: 500 }
    );
  }
}
