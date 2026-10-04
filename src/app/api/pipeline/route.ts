import { NextRequest, NextResponse } from 'next/server';
import { InstitutionalPipelineEngine } from '@/lib/engines/institutional-pipeline-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'XAUUSD';

  const pipeline = InstitutionalPipelineEngine.evaluatePipeline(symbol);

  return NextResponse.json({
    status: 'OK',
    pipeline,
  });
}
