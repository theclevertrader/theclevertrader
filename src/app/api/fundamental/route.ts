import { NextRequest, NextResponse } from 'next/server';
import { FundamentalEngine } from '@/lib/engines/fundamental-engine';
import { fetchLiveEconomicCalendar } from '@/lib/data/biquote-calendar';

export async function GET() {
  const overview = FundamentalEngine.evaluateOverview();
  const apiKeys = FundamentalEngine.getApiKeys();

  // Inject live institutional economic calendar from Biquote feed
  try {
    const liveEvents = await fetchLiveEconomicCalendar();
    if (liveEvents && liveEvents.length > 0) {
      overview.economicEvents = liveEvents;
      // Check if any high impact event has no-trade lock active
      const lockActive = liveEvents.some(e => e.noTradeLock);
      overview.noTradeLockActive = lockActive;
    }
  } catch (err) {
    console.error('Failed to load live economic events:', err);
  }

  return NextResponse.json({
    status: 'OK',
    overview,
    hasCustomKeys: Boolean(apiKeys.finnhub || apiKeys.alphaVantage || apiKeys.fmp),
    apiKeysMasked: {
      finnhub: apiKeys.finnhub ? '••••••••' + apiKeys.finnhub.slice(-4) : '',
      alphaVantage: apiKeys.alphaVantage ? '••••••••' + apiKeys.alphaVantage.slice(-4) : '',
      fmp: apiKeys.fmp ? '••••••••' + apiKeys.fmp.slice(-4) : '',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'save_keys') {
      FundamentalEngine.setApiKeys({
        finnhub: body.finnhub,
        alphaVantage: body.alphaVantage,
        fmp: body.fmp,
      });
      return NextResponse.json({
        success: true,
        message: 'Fundamental API keys saved successfully! Live economic data synced.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
