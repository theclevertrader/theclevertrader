import { NextRequest, NextResponse } from 'next/server';
import { fetchFmpQuote, fetchFmpBatchQuotes, getFmpApiKey } from '@/lib/data/fmp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const symbolsParam = searchParams.get('symbols');

    const apiKey = getFmpApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FMP_API_KEY is not configured in .env.local' },
        { status: 400 }
      );
    }

    if (symbolsParam) {
      const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());
      const quotes = await fetchFmpBatchQuotes(symbols);
      return NextResponse.json({
        status: 'OK',
        provider: 'Financial Modeling Prep (FMP)',
        count: Object.keys(quotes).length,
        quotes,
      });
    }

    const targetSymbol = symbol ? symbol.toUpperCase() : 'EURUSD';
    const quote = await fetchFmpQuote(targetSymbol);

    if (!quote) {
      return NextResponse.json(
        { error: `Could not retrieve live FMP quote for ${targetSymbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'OK',
      provider: 'Financial Modeling Prep (FMP)',
      quote,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error executing FMP request' },
      { status: 500 }
    );
  }
}
