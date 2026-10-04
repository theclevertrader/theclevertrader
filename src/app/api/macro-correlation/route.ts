import { NextRequest, NextResponse } from 'next/server';
import { AdvancedIctEngine } from '@/lib/engines/advanced-ict-engine';
import { generateCandles } from '@/lib/data/sample-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'XAUUSD';

    const candles = generateCandles(symbol, 80, 15, 'BULLISH');
    const ote = AdvancedIctEngine.calculateOteZones(candles, symbol);
    const turtleSoup = AdvancedIctEngine.detectTurtleSoupPatterns(candles, symbol);
    const macro = AdvancedIctEngine.calculateMacroCorrelation(symbol);

    return NextResponse.json({
      status: 'OK',
      timestamp: Date.now(),
      symbol,
      ote,
      turtleSoup,
      macro,
    });
  } catch (error: any) {
    console.error('Macro Correlation API error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error?.message || 'Failed to compute Macro Correlation data' },
      { status: 500 }
    );
  }
}
