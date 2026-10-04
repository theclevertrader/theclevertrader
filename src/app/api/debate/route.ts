import { NextResponse } from 'next/server';
import { MultiAgentDebateEngine } from '@/lib/ai/debate-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
    const priceParam = searchParams.get('price');
    const price = priceParam ? parseFloat(priceParam) : undefined;

    const debate = MultiAgentDebateEngine.runDebate(symbol, price);

    return NextResponse.json({
      success: true,
      debate,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to run Multi-Agent Debate' },
      { status: 500 }
    );
  }
}
