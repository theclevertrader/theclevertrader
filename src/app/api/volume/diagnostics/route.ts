import { NextRequest, NextResponse } from 'next/server';
import { VolumeService } from '@/lib/volume/volume-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || 'XAUUSD').toUpperCase();
  const timeframe = (searchParams.get('timeframe') || '15M').toUpperCase() as any;

  try {
    const analysis = await VolumeService.analyzeSymbol(symbol, false, timeframe, 'VISIBLE');
    const diag = analysis.diagnostics;
    const profile = analysis.currentProfile;
    const candles = analysis.candles || [];

    const minPrice = profile.bins.length > 0 ? profile.bins[0].price : 0;
    const maxPrice = profile.bins.length > 0 ? profile.bins[profile.bins.length - 1].price : 0;

    return NextResponse.json({
      symbol,
      timeframe,
      source: diag?.dataSource || analysis.dataQuality.primarySource,
      status: diag?.dataQualityStatus || analysis.dataQuality.status,
      tickCount: diag?.tickCount || 0,
      candleCount: candles.length,
      minPrice,
      maxPrice,
      binSize: profile.tickSize,
      binCount: profile.bins.length,
      totalVolume: profile.totalVolume,
      poc: profile.poc,
      vah: profile.vah,
      val: profile.val,
      vwap: analysis.vwap.vwap,
      hvnCount: profile.hvn.length,
      lvnCount: profile.lvn.length,
      buyVolume: profile.totalBuyVolume,
      sellVolume: profile.totalSellVolume,
      delta: analysis.delta.delta,
      deltaMethod: analysis.delta.methodology,
      lastUpdate: diag?.lastTickTimestamp || analysis.timestamp,
      minHistoryMet: analysis.minHistoryMet ?? true,
      coverageDays: analysis.historyCoverageDays ?? 0,
      diagnostics: {
        tickCount: diag?.tickCount || 0,
        uniquePriceLevels: diag?.uniquePriceLevels || 0,
        totalVolume: diag?.totalVolume || 0,
        numberPriceBins: diag?.numberPriceBins || 0,
        poc: diag?.poc || 0,
        vah: diag?.vah || 0,
        val: diag?.val || 0,
        hvnCount: diag?.hvnCount || 0,
        lvnCount: diag?.lvnCount || 0,
        vwap: diag?.vwap || 0,
        buyVolume: diag?.buyVolume || 0,
        sellVolume: diag?.sellVolume || 0,
        deltaMethodology: diag?.deltaMethodology || 'ESTIMATED_QUOTE_RULE_PROXY',
        lastTickTimestamp: diag?.lastTickTimestamp || Date.now(),
        dataSource: diag?.dataSource || 'BIQUOTE',
        volumeType: diag?.volumeType || 'BROKER_TICK_VOLUME',
        dataQualityStatus: diag?.dataQualityStatus || analysis.dataQuality.status,
        adaptiveTickSize: diag?.adaptiveTickSize || 0.01,
      },
      auditChecks: {
        isMockedOrSynthetic: false,
        isAggressorSideTapeAvailable: false,
        deltaClassification: 'PROXY / ESTIMATED (TICK/QUOTE RULE)',
        volumeTypeClassification: 'BROKER_TICK_VOLUME (MT5/Biquote Non-Centralized)',
        centralizedCmeFuturesAvailable: false,
      },
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('API /api/volume/diagnostics error:', err);
    return NextResponse.json(
      { status: 'ERROR', message: err?.message || 'Volume diagnostics failed' },
      { status: 500 }
    );
  }
}
