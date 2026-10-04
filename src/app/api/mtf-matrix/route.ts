import { NextRequest, NextResponse } from 'next/server';
import { MtfMatrixEngine } from '@/lib/engines/mtf-matrix-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'XAUUSD';

    const singlePair = MtfMatrixEngine.analyzePair(symbol);
    const allPairs = MtfMatrixEngine.analyzeAllPairs();

    return NextResponse.json({
      status: 'OK',
      timestamp: Date.now(),
      selectedSymbol: symbol,
      matrix: singlePair,
      allPairs,
    });
  } catch (error: any) {
    console.error('MTF Matrix API error:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error?.message || 'Failed to compute MTF matrix' },
      { status: 500 }
    );
  }
}
