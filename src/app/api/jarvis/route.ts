import { NextResponse } from 'next/server';
import { JarvisCore } from '@/lib/ai/jarvis-core';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'EURUSD';
    const intelligence = JarvisIntelligenceBrain.getCentralIntelligence(symbol);
    return NextResponse.json({ intelligence });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error generating JARVIS intelligence' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, context, apiKey, provider } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Auto-inject real-time multi-module brain context if not already present
    const sym = context?.symbol || 'EURUSD';
    const liveIntelligence = JarvisIntelligenceBrain.getCentralIntelligence(sym);
    const enrichedContext = {
      ...context,
      intelligence: liveIntelligence,
      confluenceScore: liveIntelligence.masterConfluencePercent,
      masterDirection: liveIntelligence.masterDirection,
      cftcNet: liveIntelligence.corePillars.cftcSmartMoney.netContracts,
      rateGap: liveIntelligence.corePillars.rateSpread.spreadPercent,
    };

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    const activeProvider = provider || (activeApiKey ? 'gemini' : (process.env.DEFAULT_AI_PROVIDER || 'offline'));

    const reply = await JarvisCore.askJarvis(message, enrichedContext, activeApiKey, activeProvider as any);

    return NextResponse.json({
      reply,
      intelligence: liveIntelligence,
      provider: activeProvider,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error executing JARVIS query' },
      { status: 500 }
    );
  }
}

