import { NextRequest, NextResponse } from 'next/server';
import { JudasSwingEngine } from '@/lib/engines/judas-swing-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'XAUUSD';

    const singlePair = JudasSwingEngine.scanPair(symbol);
    const allPairs = JudasSwingEngine.scanAllPairs();

    return NextResponse.json({
      status: 'OK',
      timestamp: Date.now(),
      selectedSymbol: symbol,
      judas: singlePair,
      allPairs,
    });
  } catch (error: any) {
    console.error('Judas Swing API error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error?.message || 'Failed to compute Judas Swing data' },
      { status: 500 }
    );
  }
}
