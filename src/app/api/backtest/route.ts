import { NextResponse } from 'next/server';
import { BacktestEngine } from '@/lib/engines/backtest-engine';
import { generateCandles } from '@/lib/data/sample-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      symbol = 'XAUUSD',
      strategy = 'SMC_ICT_CONFLUENCE',
      initialBalance = 50000,
      riskPercent = 1.0,
      spreadPips = 1.0,
      commission = 5.0,
      slippage = 0.5,
      candles,
    } = body;

    const candleSeries = candles && candles.length > 20 
      ? candles 
      : generateCandles(symbol, 120, 15);

    const result = BacktestEngine.runBacktest({
      symbol,
      strategy,
      initialBalance,
      riskPercent,
      spreadPips,
      commissionPerLot: commission,
      slippagePips: slippage,
      candles: candleSeries,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Backtest error' }, { status: 500 });
  }
}
