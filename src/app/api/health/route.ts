import { NextResponse } from 'next/server';
import { HealthMonitorService } from '@/lib/telemetry/health-monitor';

export async function GET() {
  try {
    const health = await HealthMonitorService.getSystemHealth();
    return NextResponse.json(health, {
      status: health.overallStatus === 'CRITICAL' ? 503 : 200,
    });
  } catch (err: any) {
    console.error('[HealthMonitor] Telemetry generation error:', err);
    return NextResponse.json(
      {
        overallStatus: 'CRITICAL',
        error: err?.message || 'Health monitor telemetry failure',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
