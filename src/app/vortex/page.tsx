'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef } from 'react';
import { vortexEngine } from '@/lib/vortex/vortex-engine';
import { useMarketData } from '@/lib/hooks/useMarketData';

const VortexTerminal = dynamic(
  () => import('@/components/vortex/VortexTerminal'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[70vh] w-full bg-paper text-ink flex flex-col items-center justify-center font-mono text-xs text-ink-soft gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
          <span className="text-sm font-semibold tracking-wider text-ink">LOADING VORTEX QUANT TERMINAL...</span>
        </div>
        <p className="text-[10px] text-ink-faint tracking-widest uppercase">Initializing swarm feed & high-frequency ledger</p>
      </div>
    ),
  }
);

/**
 * LiveVortexTerminal — Feeds real-time market data into the Vortex engine.
 * Polls /api/market-data for live candles + /api/mt5 for live ticks,
 * then pushes real prices into vortexEngine.setMarketData().
 */
// In-memory cache for instantaneous (0ms) asset and timeframe switching
const assetSwitchCache = new Map<string, { candles: any[]; price: number; timestamp: number }>();

function LiveVortexTerminal() {
  const { selectedSymbol, setSelectedSymbol, selectedTimeframe, setSelectedTimeframe } = useMarketData();
  const activeSymbol = selectedSymbol || 'XAUUSD';
  const setActiveSymbol = setSelectedSymbol;
  const activeTimeframe = selectedTimeframe || '15m';
  const setActiveTimeframe = setSelectedTimeframe;
  const [candles, setCandles] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState<number | undefined>(undefined);
  const isMountedRef = useRef(true);

  // Parse timeframe to minutes (30s = 0.5 minutes)
  const getTfMinutes = (tf: string): number => {
    const t = tf.toLowerCase();
    if (t === '30s') return 0.5;
    if (t === '1m') return 1;
    if (t === '5m') return 5;
    if (t === '15m') return 15;
    if (t === '30m') return 30;
    if (t === '1h' || t === '60m') return 60;
    if (t === '4h' || t === '240m') return 240;
    if (t === '1d' || t === 'd') return 1440;
    return 15;
  };

  // 1. Fetch real-time live candles and push to engine (with Instant 0ms Cache Fallback)
  useEffect(() => {
    isMountedRef.current = true;
    const cacheKey = `${activeSymbol}_${activeTimeframe}`;

    // Instant Zero-Latency Render: If asset was previously opened, show it immediately!
    const cachedAsset = assetSwitchCache.get(cacheKey);
    if (cachedAsset && cachedAsset.candles.length > 0) {
      setCandles(cachedAsset.candles);
      setLivePrice(cachedAsset.price);
      vortexEngine.setMarketData(activeSymbol, cachedAsset.price, cachedAsset.candles, activeTimeframe);
    }

    const tfMinutes = getTfMinutes(activeTimeframe);

    const fetchLiveData = async () => {
      try {
        const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(activeSymbol)}&timeframe=${tfMinutes}`);
        if (!res.ok || !isMountedRef.current) return;
        const data = await res.json();

        if (data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
          const liveP = data.spec?.currentPrice ?? data.tick?.price ?? data.candles[data.candles.length - 1].close;
          setCandles(data.candles);
          setLivePrice(liveP);
          vortexEngine.setMarketData(activeSymbol, liveP, data.candles, activeTimeframe);
          assetSwitchCache.set(cacheKey, { candles: data.candles, price: liveP, timestamp: Date.now() });
        } else if (data.tick?.price && data.tick.price > 0) {
          setLivePrice(data.tick.price);
          vortexEngine.setMarketData(activeSymbol, data.tick.price, undefined, activeTimeframe);
        }
      } catch (err) {
        console.warn('[Vortex Fullscreen] Live data fetch error:', err);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [activeSymbol, activeTimeframe]);

  // 2. Poll full live telemetry (MT5 Account, Strategy Swarm, Positions, Real Order Book)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/vortex/telemetry?symbol=${encodeURIComponent(activeSymbol)}`);
        if (!res.ok || !isMountedRef.current) return;
        const data = await res.json();
        if (data && data.status === 'OK') {
          vortexEngine.syncLiveTelemetry(data);
        }
      } catch (err) {
        // Non-blocking telemetry sync
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // 3. Also poll MT5 ticks for ultra-fast sub-second price updates
  useEffect(() => {
    const fetchMt5Ticks = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch('/api/mt5');
        if (!res.ok || !isMountedRef.current) return;
        const data = await res.json();

        if (data.ticks && data.ticks[activeSymbol]) {
          const tick = data.ticks[activeSymbol];
          if (tick.price && tick.price > 0) {
            setLivePrice(tick.price);
            vortexEngine.setMarketData(activeSymbol, tick.price, undefined, activeTimeframe);
          }
        }
      } catch {
        // Non-blocking
      }
    };

    const interval = setInterval(fetchMt5Ticks, 5000);
    return () => clearInterval(interval);
  }, [activeSymbol, activeTimeframe]);

  return (
    <VortexTerminal
      isEmbedded={false}
      activeSymbol={activeSymbol}
      activeTimeframe={activeTimeframe}
      onTimeframeChange={setActiveTimeframe}
      onSymbolChange={setActiveSymbol}
      candles={candles}
      livePrice={livePrice}
    />
  );
}

export default function VortexPage() {
  return (
    <main className="min-h-screen bg-paper text-ink transition-colors duration-200">
      <LiveVortexTerminal />
    </main>
  );
}
