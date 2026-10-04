import { NextResponse } from 'next/server';
import { UnifiedMarketDataService } from '@/lib/data/unified-market-data';

function parseTimeframeToMinutes(tfParam: string | null): number {
  if (!tfParam) return 15;
  const lower = tfParam.toLowerCase().trim();
  if (lower === '30s') return 0.5;
  if (lower === '1m') return 1;
  if (lower === '5m') return 5;
  if (lower === '15m') return 15;
  if (lower === '30m') return 30;
  if (lower === '1h' || lower === '60m') return 60;
  if (lower === '4h' || lower === '240m') return 240;
  if (lower === '1d' || lower === 'd') return 1440;
  const parsed = parseFloat(tfParam);
  return isNaN(parsed) || parsed <= 0 ? 15 : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
    const timeframe = parseTimeframeToMinutes(searchParams.get('timeframe'));

    const snapshot = await UnifiedMarketDataService.getSnapshot(symbol, timeframe);

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error('[API /api/market-data] Unhandled exception:', error);
    return NextResponse.json(
      {
        error: 'MARKET_DATA_SERVICE_ERROR',
        message: error?.message || 'Failed to generate market snapshot',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
