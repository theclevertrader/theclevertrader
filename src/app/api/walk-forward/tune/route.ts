import { NextRequest, NextResponse } from 'next/server';
import { WalkForwardOptimizer } from '@/lib/engines/walk-forward-optimizer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = WalkForwardOptimizer.getCurrentParameters();
  return NextResponse.json({
    success: true,
    data: current,
  });
}

export async function POST(req: NextRequest) {
  try {
    let customCandles = undefined;
    try {
      const body = await req.json();
      if (Array.isArray(body.candles)) {
        customCandles = body.candles;
      }
    } catch {
      // Empty body is acceptable; will use benchmark ATR
    }

    const updated = WalkForwardOptimizer.optimize(customCandles);
    return NextResponse.json({
      success: true,
      message: `Walk-Forward calibration successful: ${updated.regime} (Volatility: ${updated.volatilityIndexPct}%)`,
      data: updated,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Optimization failed' }, { status: 500 });
  }
}
