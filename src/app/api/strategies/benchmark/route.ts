import { NextRequest, NextResponse } from 'next/server';
import { StrategyBenchmarkEngine, StrategyPlatform, StrategyCategory } from '@/lib/engines/strategy-benchmark-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get('platform') as StrategyPlatform) || 'ALL';
    const symbol = searchParams.get('symbol') || 'XAUUSD';

    const strategies = StrategyBenchmarkEngine.getStrategiesByPlatform(platform);
    
    // Quick statistics
    const totalCount = strategies.length;
    const avgWinRate = Number((strategies.reduce((acc, s) => acc + s.winRate, 0) / (totalCount || 1)).toFixed(1));
    const avgProfitFactor = Number((strategies.reduce((acc, s) => acc + s.profitFactor, 0) / (totalCount || 1)).toFixed(2));
    const activeStrategy = strategies.find(s => s.isActiveInAutoTrader) || strategies[0];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      benchmarkAsset: symbol,
      stats: {
        totalCount,
        avgWinRate,
        avgProfitFactor,
        activeStrategyId: activeStrategy?.id,
        activeStrategyName: activeStrategy?.name,
      },
      strategies,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching benchmark data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Benchmark all strategies on live asset
    if (action === 'benchmark_all') {
      const symbol = body.symbol || 'XAUUSD';
      const livePrice = body.livePrice;
      const updated = StrategyBenchmarkEngine.benchmarkAllOnAsset(symbol, livePrice);

      return NextResponse.json({
        success: true,
        message: `Successfully completed live quantitative benchmark on ${symbol}`,
        symbol,
        strategies: updated,
      });
    }

    // 2. Submit new candidate script for quantitative evaluation & auto-discovery
    if (action === 'evaluate_candidate') {
      const {
        name,
        platform = 'TradingView',
        author = 'Community Contributor',
        category = 'Smart Money Concepts',
        scriptContent,
        targetSymbol = 'XAUUSD',
      } = body;

      if (!scriptContent || scriptContent.trim().length < 20) {
        return NextResponse.json(
          { success: false, error: 'Script content is too short. Please provide complete Pine Script, Python, or MQL5 logic.' },
          { status: 400 }
        );
      }

      const evaluation = StrategyBenchmarkEngine.evaluateCandidateScript(
        name,
        platform as StrategyPlatform,
        author,
        category as StrategyCategory,
        scriptContent,
        targetSymbol
      );

      return NextResponse.json({
        success: true,
        evaluation,
        updatedLeaderboard: StrategyBenchmarkEngine.getAllStrategies(),
      });
    }

    // 3. Connect chosen strategy to MT5 Auto-Trader
    if (action === 'activate_strategy') {
      const { strategyId } = body;
      const activated = StrategyBenchmarkEngine.toggleActiveStrategy(strategyId);

      if (!activated) {
        return NextResponse.json(
          { success: false, error: 'Strategy not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Strategy "${activated.name}" is now connected to autonomous MT5 execution.`,
        strategy: activated,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing benchmark action' },
      { status: 500 }
    );
  }
}
