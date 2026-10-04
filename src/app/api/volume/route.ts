import { NextRequest, NextResponse } from 'next/server';
import { VolumeService } from '@/lib/volume/volume-service';
import { fetchLiveEconomicCalendar, getCachedEconomicEvents } from '@/lib/data/biquote-calendar';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
  const timeframe = (searchParams.get('timeframe') || '15M').toUpperCase() as any;
  const mode = (searchParams.get('mode') || 'VISIBLE').toUpperCase() as any;

  // Instant non-blocking check for Biquote high-impact news lock
  let newsLockActive = false;
  const cachedEvents = getCachedEconomicEvents();
  if (cachedEvents && cachedEvents.length > 0) {
    newsLockActive = cachedEvents.some(e => e.noTradeLock);
  } else {
    // Fire-and-forget in background without blocking this route
    fetchLiveEconomicCalendar().catch(() => {});
  }

  try {
    const analysis = await VolumeService.analyzeSymbol(symbol, newsLockActive, timeframe, mode);

    return NextResponse.json({
      status: 'OK',
      symbol,
      timeframe,
      mode,
      analysis,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('API /api/volume error:', err);
    return NextResponse.json(
      { status: 'ERROR', message: err?.message || 'Volume analysis failed' },
      { status: 500 }
    );
  }
}
