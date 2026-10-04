import { NextRequest, NextResponse } from 'next/server';
import { VipSentimentEngine } from '@/lib/engines/vip-sentiment-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'ALL';
    const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();

    const feed = await VipSentimentEngine.getLiveFeed(filter);
    const symbolSentiment = VipSentimentEngine.getSymbolSentiment(symbol);

    const trackedSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];
    const allSymbolsSentiment: Record<string, any> = {};
    for (const sym of trackedSymbols) {
      allSymbolsSentiment[sym] = VipSentimentEngine.getSymbolSentiment(sym);
    }

    const breakingAlertCount = feed.filter(p => p.isBreaking).length;

    return NextResponse.json({
      status: 'OK',
      filter,
      symbol,
      feed,
      symbolSentiment,
      allSymbolsSentiment,
      breakingAlertCount,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error?.message || 'Failed to fetch VIP sentiment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'refresh';

    if (action === 'refresh') {
      await VipSentimentEngine.refreshIntelligence();
      const feed = await VipSentimentEngine.getLiveFeed();
      return NextResponse.json({
        status: 'OK',
        message: 'VIP Sentiment Intelligence stream successfully refreshed.',
        totalItems: feed.length,
        timestamp: Date.now(),
      });
    }

    if (action === 'classify' && body.text) {
      const result = VipSentimentEngine.classifyText(body.text);
      return NextResponse.json({
        status: 'OK',
        classification: result,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { status: 'ERROR', message: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error?.message || 'Request execution failed' },
      { status: 500 }
    );
  }
}
