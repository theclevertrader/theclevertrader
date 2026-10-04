import { NextRequest, NextResponse } from 'next/server';
import { InstitutionalDataEngine } from '@/lib/engines/institutional-data-engine';

export async function GET() {
  const sources = InstitutionalDataEngine.getSources();
  const consensus = InstitutionalDataEngine.evaluateConsensus();
  const apiKeys = InstitutionalDataEngine.getApiKeys();

  const maskedKeys: Record<string, string> = {};
  for (const [k, v] of Object.entries(apiKeys)) {
    if (v) {
      maskedKeys[k] = '••••••••' + v.slice(-4);
    }
  }

  return NextResponse.json({
    status: 'OK',
    totalSources: sources.length,
    activeSources: sources.filter(s => s.status === 'LIVE_SYNCED' || s.status === 'ACTIVE_BUILTIN').length,
    sources,
    consensus,
    apiKeysConfigured: Object.keys(apiKeys).length,
    maskedKeys,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'save_keys') {
      InstitutionalDataEngine.setApiKeys({
        fred: body.fred,
        bls: body.bls,
        bea: body.bea,
        tradingEconomics: body.tradingEconomics,
        twelveData: body.twelveData,
        alphaVantage: body.alphaVantage,
        finnhub: body.finnhub,
      });

      return NextResponse.json({
        success: true,
        message: 'All 20 Institutional Data Sources & Free API Keys synced successfully!',
        activeSources: InstitutionalDataEngine.getSources().length,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
