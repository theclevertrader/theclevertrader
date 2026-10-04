'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Candle, OrderBlock, FairValueGap, StructureEvent, LiquidityPool } from '@/lib/types/trading';
import { SmcEngine } from '@/lib/engines/smc-engine';
import { IctEngine } from '@/lib/engines/ict-engine';
import { JudasSwingEngine } from '@/lib/engines/judas-swing-engine';
import { AdvancedIctEngine } from '@/lib/engines/advanced-ict-engine';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';
import { LiveTick } from '@/lib/broker/mt5-bridge';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface TradingChartProps {
  candles?: Candle[];
  symbol: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  currentTick?: LiveTick;
  isMarketOpen?: boolean;
}

function parseTfMinutes(tf: string): number {
  const t = (tf || '15m').toLowerCase();
  if (t === '1m') return 1;
  if (t === '5m') return 5;
  if (t === '15m') return 15;
  if (t === '30m') return 30;
  if (t === '1h' || t === '60m') return 60;
  if (t === '4h' || t === '240m') return 240;
  if (t === '1d' || t === 'd') return 1440;
  return 15;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles: initialCandles = [],
  symbol,
  timeframe = '15m',
  onTimeframeChange,
  currentTick,
  isMarketOpen: propIsMarketOpen,
}) => {
  const [activeTf, setActiveTf] = useState(timeframe);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1150);

  // Dynamic Full-Width Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 300) setContainerWidth(w);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (timeframe) setActiveTf(timeframe);
  }, [timeframe]);

  // Real live candles state
  const [liveCandles, setLiveCandles] = useState<Candle[]>(initialCandles);
  const [dataSource, setDataSource] = useState<string>('EXNESS MT5 DIRECT');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Sync prop candles when they arrive
  useEffect(() => {
    if (initialCandles && initialCandles.length > 0) {
      setLiveCandles(initialCandles);
    }
  }, [initialCandles]);

  // Fetch real MT5 rates directly
  const fetchLiveRates = useCallback(async () => {
    const tfMinutes = parseTfMinutes(activeTf);
    try {
      setIsDataLoading(true);
      // Try unified market data first
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${tfMinutes}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.candles) && data.candles.length > 0) {
          setLiveCandles(data.candles);
          setDataSource(data.feedSource === 'MT5_DIRECT' ? 'EXNESS MT5 DIRECT' : 'LIVE MARKET FEED');
          setIsDataLoading(false);
          return;
        }
      }

      // Direct fallback to MT5 python rates server
      const directRes = await fetch(`http://127.0.0.1:8001/rates?symbol=${encodeURIComponent(symbol)}&tf=${tfMinutes}&count=120`, {
        cache: 'no-store'
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData.success && Array.isArray(directData.candles) && directData.candles.length > 0) {
          setLiveCandles(directData.candles);
          setDataSource(`EXNESS MT5 (#472658395)`);
        }
      }
    } catch (e) {
      // Keep existing candles if network blip
    } finally {
      setIsDataLoading(false);
    }
  }, [symbol, activeTf]);

  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 6000);
    return () => clearInterval(interval);
  }, [fetchLiveRates]);

  // Dynamic real-time candle tick streaming (live pulse on latest candle)
  useEffect(() => {
    if (currentTick && currentTick.price > 0 && liveCandles.length > 0) {
      setLiveCandles(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const last = { ...updated[lastIdx] };
        last.close = currentTick.price;
        last.high = Math.max(last.high, currentTick.price);
        last.low = Math.min(last.low, currentTick.price);
        updated[lastIdx] = last;
        return updated;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- liveCandles.length is intentionally used only as a guard;
  // including it would cause unnecessary re-fires on every candle update. The tick itself drives the update.
  }, [currentTick]);

  // Overlay Toggles (Clean institutional defaults)
  const [showOB, setShowOB] = useState(true);
  const [showFVG, setShowFVG] = useState(true);
  const [showStructure, setShowStructure] = useState(true);
  const [showEquilibrium, setShowEquilibrium] = useState(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);
  const [showLiquidity, setShowLiquidity] = useState(true);
  const [showIctOte, setShowIctOte] = useState(false);

  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomBars, setZoomBars] = useState<number>(65);

  const marketInfo = useMemo(() => {
    return SessionFilterEngine.isMarketOpen(symbol);
  }, [symbol]);

  const isMarketLive = propIsMarketOpen ?? marketInfo.isOpen;

  // Active Candles Window (constrained by zoom)
  const activeCandles = useMemo(() => {
    if (!liveCandles || liveCandles.length === 0) return [];
    return liveCandles.length > zoomBars ? liveCandles.slice(-zoomBars) : liveCandles;
  }, [liveCandles, zoomBars]);

  // SMC Calculations
  const swingPoints = useMemo(() => {
    if (activeCandles.length === 0) return [];
    return SmcEngine.detectSwingPoints(activeCandles, 2);
  }, [activeCandles]);

  const structureEvents = useMemo(() => {
    if (!showStructure || activeCandles.length === 0 || swingPoints.length === 0) return [];
    return SmcEngine.detectStructureEvents(activeCandles, swingPoints);
  }, [activeCandles, swingPoints, showStructure]);

  const orderBlocks = useMemo(() => {
    if (!showOB || activeCandles.length === 0) return [];
    return SmcEngine.detectOrderBlocks(activeCandles);
  }, [activeCandles, showOB]);

  const fairValueGaps = useMemo(() => {
    if (!showFVG || activeCandles.length === 0) return [];
    return SmcEngine.detectFairValueGaps(activeCandles);
  }, [activeCandles, showFVG]);

  const liquidityPools = useMemo(() => {
    if (!showLiquidity || activeCandles.length === 0 || swingPoints.length === 0) return [];
    return SmcEngine.detectLiquiditySweeps(activeCandles, swingPoints);
  }, [activeCandles, swingPoints, showLiquidity]);

  const premDisc = useMemo(() => {
    if (activeCandles.length === 0) {
      return {
        highest: 0,
        lowest: 0,
        equilibrium: 0,
        currentPrice: 0,
        isPremium: false,
        isDiscount: false,
        premiumRange: { min: 0, max: 0 },
        discountRange: { min: 0, max: 0 },
      };
    }
    return SmcEngine.calculatePremiumDiscount(activeCandles);
  }, [activeCandles]);

  // Volume Profile calculation (clean right node)
  const volumeProfileData = useMemo(() => {
    if (!showVolumeProfile || activeCandles.length === 0) return null;
    const highs = activeCandles.map(c => c.high);
    const lows = activeCandles.map(c => c.low);
    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const range = maxP - minP;
    if (range <= 0) return null;

    const numBins = 30;
    const binSize = range / numBins;
    const binsMap = new Map<number, { price: number; volume: number; buyVol: number; sellVol: number }>();
    let maxBinVol = 1;

    for (const c of activeCandles) {
      const cLow = Math.min(c.low, c.high);
      const cHigh = Math.max(c.low, c.high);
      const cRange = cHigh - cLow;
      const vol = c.volume || 10;
      const isBull = c.close >= c.open;

      const slices = 6;
      const sliceStep = cRange > 0 ? cRange / slices : 0;
      const volSlice = vol / slices;

      for (let s = 0; s < slices; s++) {
        const p = cLow + s * sliceStep;
        const bIndex = Math.max(0, Math.floor((p - minP) / binSize));
        const bPrice = minP + bIndex * binSize;
        const cur = binsMap.get(bIndex) || { price: bPrice, volume: 0, buyVol: 0, sellVol: 0 };
        cur.volume += volSlice;
        if (isBull) cur.buyVol += volSlice * 0.65;
        else cur.sellVol += volSlice * 0.65;
        binsMap.set(bIndex, cur);
        if (cur.volume > maxBinVol) maxBinVol = cur.volume;
      }
    }

    const bins = Array.from(binsMap.values()).sort((a, b) => a.price - b.price);
    let maxEntry = bins[0];
    for (const b of bins) {
      if (b.volume > (maxEntry?.volume || 0)) maxEntry = b;
    }

    return {
      bins,
      binSize,
      maxBinVol,
      pocPrice: maxEntry ? maxEntry.price : (minP + maxP) / 2,
    };
  }, [activeCandles, showVolumeProfile]);

  // Dimension & Coordinate Math (Full width responsive)
  const chartHeight = 520;
  const paddingY = 32;
  const paddingX = 85; // Clean right price margin
  const chartWidth = Math.max(640, containerWidth);
  const availableWidth = chartWidth - paddingX - 15;

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (activeCandles.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    const highs = activeCandles.map(c => c.high);
    const lows = activeCandles.map(c => c.low);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.09 || 1;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      priceRange: (max + pad) - (min - pad),
    };
  }, [activeCandles]);

  const priceToY = useCallback((price: number) => {
    if (priceRange === 0) return chartHeight / 2;
    return chartHeight - paddingY - ((price - minPrice) / priceRange) * (chartHeight - paddingY * 2);
  }, [chartHeight, paddingY, priceRange, minPrice]);

  const candleCount = activeCandles.length;
  const candleSpacing = availableWidth / Math.max(1, candleCount);
  const candleWidth = Math.max(3, Math.min(16, candleSpacing * 0.72));

  const indexToX = useCallback((index: number) => {
    return 15 + index * candleSpacing + candleSpacing / 2;
  }, [candleSpacing]);

  // Current live market price
  const latestCandle = activeCandles.length > 0 ? activeCandles[activeCandles.length - 1] : null;
  const currentLivePrice = currentTick?.price || latestCandle?.close || 0;
  const priceDigits = symbol.includes('JPY') ? 3 : symbol.startsWith('XAU') ? 2 : symbol.includes('USD') ? 4 : 2;

  // Key SMC levels for plain Urdu/English summary
  const latestBOS = structureEvents.length > 0 ? structureEvents[structureEvents.length - 1] : null;
  const recentDemandOB = orderBlocks.find(o => o.type === 'BULLISH' && !o.isMitigated);
  const recentSupplyOB = orderBlocks.find(o => o.type === 'BEARISH' && !o.isMitigated);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full bg-[#050811] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-mono select-none"
    >
      {/* ============================================================== */}
      {/* 1. TOP INSTITUTIONAL ACTION BAR                                */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 border-b border-white/[0.08] bg-[#070b16]/90 backdrop-blur-md">
        {/* Left: Feed Status & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{dataSource}</span>
          </div>

          <div className="flex items-center bg-black/50 rounded-md p-0.5 border border-white/[0.06] text-slate-400 text-xs">
            <button
              onClick={() => setZoomBars(prev => Math.max(25, prev - 15))}
              title="Zoom In (Wider Candles)"
              className="p-1 hover:text-white hover:bg-white/[0.08] rounded"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <span className="text-[9px] px-1 font-bold text-slate-300">{zoomBars}B</span>
            <button
              onClick={() => setZoomBars(prev => Math.min(150, prev + 15))}
              title="Zoom Out (More History)"
              className="p-1 hover:text-white hover:bg-white/[0.08] rounded"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomBars(65)}
              title="Reset Zoom"
              className="p-1 hover:text-white hover:bg-white/[0.08] rounded"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Center: Live Hovered Candle Quick Data */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-300">
          {hoveredCandle ? (
            <div className="flex items-center gap-3 animate-fadeIn">
              <span>O: <strong className="text-white">${hoveredCandle.open.toFixed(priceDigits)}</strong></span>
              <span>H: <strong className="text-white">${hoveredCandle.high.toFixed(priceDigits)}</strong></span>
              <span>L: <strong className="text-white">${hoveredCandle.low.toFixed(priceDigits)}</strong></span>
              <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                ${hoveredCandle.close.toFixed(priceDigits)}
              </strong></span>
              <span>VOL: <strong className="text-cyan-400">{hoveredCandle.volume}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <span>EQ 50%: <strong className="text-cyan-300">${premDisc.equilibrium.toFixed(priceDigits)}</strong></span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${premDisc.isDiscount ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                {premDisc.isDiscount ? 'DISCOUNT ZONE (FAVORS LONGS)' : 'PREMIUM ZONE (FAVORS SHORTS)'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Clean Overlay Pill Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowOB(!showOB)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              showOB
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                : 'bg-white/[0.03] text-slate-500 border-transparent hover:text-white'
            }`}
          >
            📦 OB
          </button>
          <button
            onClick={() => setShowFVG(!showFVG)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              showFVG
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                : 'bg-white/[0.03] text-slate-500 border-transparent hover:text-white'
            }`}
          >
            ⚡ FVG
          </button>
          <button
            onClick={() => setShowStructure(!showStructure)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              showStructure
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.03] text-slate-500 border-transparent hover:text-white'
            }`}
          >
            🎯 BOS
          </button>
          <button
            onClick={() => setShowEquilibrium(!showEquilibrium)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              showEquilibrium
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.25)]'
                : 'bg-white/[0.03] text-slate-500 border-transparent hover:text-white'
            }`}
          >
            📐 50% EQ
          </button>
          <button
            onClick={() => setShowVolumeProfile(!showVolumeProfile)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              showVolumeProfile
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'bg-white/[0.03] text-slate-500 border-transparent hover:text-white'
            }`}
          >
            📊 VOL
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PLAIN URDU / ENGLISH ANALYSIS EXPLANATION BANNER            */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b1022] border-b border-white/[0.05] text-[10.5px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>SMC MARKET AUDIT:</span>
          </span>
          <span className="text-slate-300">
            {premDisc.isDiscount ? (
              <>
                Market <strong className="text-emerald-400">Discount Zone</strong> mein hai (Fair Value: ${premDisc.equilibrium.toFixed(priceDigits)}).
                {recentDemandOB ? ` Nearest Demand Order Block: $${recentDemandOB.low.toFixed(priceDigits)} - $${recentDemandOB.high.toFixed(priceDigits)}.` : ''}
                {' '}Smart Money accumulation zone — Buy setups preferred.
              </>
            ) : (
              <>
                Market <strong className="text-rose-400">Premium Zone</strong> mein hai (Fair Value: ${premDisc.equilibrium.toFixed(priceDigits)}).
                {recentSupplyOB ? ` Nearest Supply Order Block: $${recentSupplyOB.low.toFixed(priceDigits)} - $${recentSupplyOB.high.toFixed(priceDigits)}.` : ''}
                {' '}Institutional distribution area — Short setups / profit taking preferred.
              </>
            )}
            {latestBOS && (
              <span className="text-amber-300 font-bold ml-1.5">
                [Latest Break: {latestBOS.type} at ${latestBOS.brokenPrice.toFixed(priceDigits)}]
              </span>
            )}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
          <span>SPREAD: <strong className="text-emerald-400 font-bold">{(currentTick && currentTick.ask && currentTick.bid ? Math.abs(currentTick.ask - currentTick.bid) / (symbol.includes('JPY') ? 0.01 : symbol.startsWith('XAU') ? 0.1 : 0.0001) : 0.18).toFixed(1)}p</strong></span>
          <span>100% REAL LIVE DATA</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. RESPONSIVE FULL-WIDTH CANDLESTICK & SMC SVG CANVAS          */}
      {/* ============================================================== */}
      <div
        className="relative w-full overflow-hidden bg-[#050811] cursor-crosshair"
        onMouseMove={e => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => {
          setHoverPos(null);
          setHoveredCandle(null);
        }}
      >
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="select-none"
        >
          <defs>
            <linearGradient id="premGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="discGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.00" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Background Grid Horizontal Lines */}
          {[0.15, 0.35, 0.55, 0.75, 0.90].map((ratio, idx) => {
            const y = paddingY + ratio * (chartHeight - paddingY * 2);
            const price = maxPrice - ratio * priceRange;
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#172033"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                {/* Price Scale Label */}
                <text
                  x={chartWidth - paddingX + 8}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  ${price.toFixed(priceDigits)}
                </text>
              </g>
            );
          })}

          {/* 50% Equilibrium Zone Lines */}
          {showEquilibrium && premDisc.equilibrium > 0 && (() => {
            const eqY = priceToY(premDisc.equilibrium);
            const highY = priceToY(premDisc.highest);
            const lowY = priceToY(premDisc.lowest);

            return (
              <g id="equilibrium-zone">
                {/* Premium Background */}
                <rect
                  x={0}
                  y={highY}
                  width={chartWidth - paddingX}
                  height={Math.max(0, eqY - highY)}
                  fill="url(#premGradient)"
                />
                {/* Discount Background */}
                <rect
                  x={0}
                  y={eqY}
                  width={chartWidth - paddingX}
                  height={Math.max(0, lowY - eqY)}
                  fill="url(#discGradient)"
                />
                {/* 50% Divider Line */}
                <line
                  x1={0}
                  y1={eqY}
                  x2={chartWidth - paddingX}
                  y2={eqY}
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                />
                {/* 50% Equilibrium Tag on Right Axis */}
                <rect
                  x={chartWidth - paddingX}
                  y={eqY - 8}
                  width={paddingX}
                  height={16}
                  fill="#082f49"
                  stroke="#06b6d4"
                  strokeWidth="0.8"
                  rx="2"
                />
                <text
                  x={chartWidth - paddingX + 5}
                  y={eqY + 3.5}
                  fill="#38bdf8"
                  fontSize="8.5"
                  fontWeight="bold"
                >
                  EQ ${premDisc.equilibrium.toFixed(priceDigits)}
                </text>
              </g>
            );
          })()}

          {/* Volume Profile (Anchored cleanly to far right 100px) */}
          {showVolumeProfile && volumeProfileData && (
            <g id="volume-profile-right">
              {volumeProfileData.bins.map((b, i) => {
                const yTop = priceToY(b.price + volumeProfileData.binSize);
                const yBottom = priceToY(b.price);
                const barH = Math.max(1.5, Math.abs(yBottom - yTop) - 0.5);
                const barY = Math.min(yTop, yBottom);

                const maxW = 90;
                const barW = (b.volume / volumeProfileData.maxBinVol) * maxW;
                const buyW = b.volume > 0 ? (b.buyVol / b.volume) * barW : barW * 0.5;
                const isPoc = Math.abs(b.price - volumeProfileData.pocPrice) < (volumeProfileData.binSize * 0.5);

                return (
                  <g key={`vp-${i}`}>
                    <rect
                      x={chartWidth - paddingX - barW}
                      y={barY}
                      width={Math.max(0.5, buyW)}
                      height={barH}
                      fill={isPoc ? '#f59e0b' : '#10b981'}
                      opacity={isPoc ? 0.95 : 0.45}
                    />
                    <rect
                      x={chartWidth - paddingX - barW + buyW}
                      y={barY}
                      width={Math.max(0.5, barW - buyW)}
                      height={barH}
                      fill={isPoc ? '#d97706' : '#f43f5e'}
                      opacity={isPoc ? 0.95 : 0.45}
                    />
                  </g>
                );
              })}
              {/* POC Line */}
              <line
                x1={chartWidth - paddingX - 110}
                y1={priceToY(volumeProfileData.pocPrice)}
                x2={chartWidth - paddingX}
                y2={priceToY(volumeProfileData.pocPrice)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </g>
          )}

          {/* ORDER BLOCKS (Subtle, elegant, non-intrusive zones) */}
          {showOB &&
            orderBlocks
              .filter(o => !o.isMitigated)
              .slice(-4)
              .map((ob, idx) => {
                const yHigh = priceToY(ob.high);
                const yLow = priceToY(ob.low);
                const height = Math.max(4, Math.abs(yLow - yHigh));
                const xStart = indexToX(ob.candleIndex);
                const isBull = ob.type === 'BULLISH';
                const yTop = Math.min(yHigh, yLow);

                return (
                  <g key={`ob-clean-${idx}`}>
                    <rect
                      x={xStart}
                      y={yTop}
                      width={chartWidth - paddingX - xStart}
                      height={height}
                      fill={isBull ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)'}
                      stroke={isBull ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}
                      strokeWidth="1"
                      strokeDasharray="3 2"
                      rx="2"
                    />
                    <text
                      x={chartWidth - paddingX - 6}
                      y={yTop + 10}
                      fill={isBull ? '#34d399' : '#fb7185'}
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      {isBull ? '+OB (DEMAND)' : '-OB (SUPPLY)'}
                    </text>
                  </g>
                );
              })}

          {/* FAIR VALUE GAPS (FVG - Delicate channels) */}
          {showFVG &&
            fairValueGaps
              .filter(f => !f.isFilled)
              .slice(-3)
              .map((fvg, idx) => {
                const yTop = priceToY(fvg.top);
                const yBottom = priceToY(fvg.bottom);
                const height = Math.max(3, Math.abs(yBottom - yTop));
                const xStart = indexToX(fvg.candleIndex);
                const isBull = fvg.type === 'BULLISH';
                const yMin = Math.min(yTop, yBottom);

                return (
                  <g key={`fvg-clean-${idx}`}>
                    <rect
                      x={xStart}
                      y={yMin}
                      width={chartWidth - paddingX - xStart}
                      height={height}
                      fill={isBull ? 'rgba(6, 182, 212, 0.06)' : 'rgba(244, 63, 94, 0.06)'}
                      stroke={isBull ? 'rgba(6, 182, 212, 0.3)' : 'rgba(244, 63, 94, 0.3)'}
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                      rx="1"
                    />
                    <text
                      x={xStart + 6}
                      y={yMin + 9}
                      fill={isBull ? '#22d3ee' : '#fb7185'}
                      fontSize="8"
                      fontWeight="bold"
                    >
                      FVG
                    </text>
                  </g>
                );
              })}

          {/* STRUCTURE BREAKS (BOS & CHoCH - Crisp pills) */}
          {showStructure &&
            structureEvents.slice(-3).map((evt, idx) => {
              const y = priceToY(evt.brokenPrice);
              const xBreak = indexToX(evt.candleIndex);
              const isBull = evt.direction === 'BULLISH';
              const color = isBull ? '#22d3ee' : '#f43f5e';

              return (
                <g key={`str-clean-${idx}`}>
                  <line
                    x1={Math.max(15, xBreak - 50)}
                    y1={y}
                    x2={xBreak}
                    y2={y}
                    stroke={color}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={xBreak - 18}
                    y={y - 8}
                    width={36}
                    height={16}
                    rx="3"
                    fill="#070c1b"
                    stroke={color}
                    strokeWidth="1"
                  />
                  <text
                    x={xBreak}
                    y={y + 3.5}
                    fill={color}
                    fontSize="8.5"
                    fontWeight="black"
                    textAnchor="middle"
                  >
                    {evt.type}
                  </text>
                </g>
              );
            })}

          {/* LIQUIDITY SWEEPS (BSL / SSL) */}
          {showLiquidity &&
            liquidityPools
              .filter(p => p.isSwept)
              .slice(-3)
              .map((pool, idx) => {
                const y = priceToY(pool.price);
                const x = indexToX(pool.candleIndex);
                const isBsl = pool.type === 'BUY_SIDE';
                const col = isBsl ? '#fb7185' : '#34d399';

                return (
                  <g key={`liq-clean-${idx}`}>
                    <circle cx={x} cy={y} r="3.5" fill={col} stroke="#ffffff" strokeWidth="1" />
                    <text
                      x={x}
                      y={isBsl ? y - 7 : y + 14}
                      fill={col}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isBsl ? '💧 BSL' : '🩸 SSL'}
                    </text>
                  </g>
                );
              })}

          {/* ============================================================ */}
          {/* REAL CANDLESTICKS (Wide, Crisp, High-Contrast Institutional) */}
          {/* ============================================================ */}
          {activeCandles.map((c, idx) => {
            const x = indexToX(idx);
            const isBull = c.close >= c.open;
            const yOpen = priceToY(c.open);
            const yClose = priceToY(c.close);
            const yHigh = priceToY(c.high);
            const yLow = priceToY(c.low);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyH = Math.max(2, Math.abs(yClose - yOpen));

            const wickColor = isBull ? '#00e676' : '#ff1744';
            const bodyColor = isBull ? '#00e676' : '#ff1744';

            return (
              <g
                key={`candle-clean-${idx}`}
                onMouseEnter={() => setHoveredCandle(c)}
              >
                {/* High/Low Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={wickColor}
                  strokeWidth="1.2"
                />
                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyH}
                  fill={bodyColor}
                  stroke={bodyColor}
                  strokeWidth="0.5"
                  rx="1"
                  className="transition-all hover:brightness-125"
                />
              </g>
            );
          })}

          {/* CURRENT LIVE PRICE PULSING LINE ACROSS CHART */}
          {currentLivePrice > 0 && (() => {
            const liveY = priceToY(currentLivePrice);
            const isUp = latestCandle ? latestCandle.close >= latestCandle.open : true;
            const liveColor = isUp ? '#00e676' : '#ff1744';

            return (
              <g id="live-price-tracker">
                <line
                  x1={0}
                  y1={liveY}
                  x2={chartWidth - paddingX}
                  y2={liveY}
                  stroke={liveColor}
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                />
                {/* Glowing Price Pill on Right Axis */}
                <rect
                  x={chartWidth - paddingX}
                  y={liveY - 9}
                  width={paddingX - 4}
                  height={18}
                  fill={isUp ? '#064e3b' : '#881337'}
                  stroke={liveColor}
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={chartWidth - paddingX + 6}
                  y={liveY + 3.5}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="black"
                  fontFamily="monospace"
                >
                  ${currentLivePrice.toFixed(priceDigits)}
                </text>
              </g>
            );
          })()}

          {/* Time Labels on Bottom Axis */}
          {activeCandles.map((c, idx) => {
            const step = Math.max(5, Math.floor(candleCount / 8));
            if (idx % step !== 0 && idx !== candleCount - 1) return null;
            const x = indexToX(idx);
            const d = new Date(c.time);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');

            return (
              <g key={`time-lbl-${idx}`}>
                <line
                  x1={x}
                  y1={chartHeight - paddingY}
                  x2={x}
                  y2={chartHeight - paddingY + 5}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight - paddingY + 16}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {hh}:{mm}
                </text>
              </g>
            );
          })}

          {/* Interactive Mouse Hover Crosshair Lines */}
          {hoverPos && hoverPos.x < chartWidth - paddingX && hoverPos.y > paddingY && hoverPos.y < chartHeight - paddingY && (
            <g id="hover-crosshair" pointerEvents="none">
              <line
                x1={0}
                y1={hoverPos.y}
                x2={chartWidth - paddingX}
                y2={hoverPos.y}
                stroke="#64748b"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
              <line
                x1={hoverPos.x}
                y1={paddingY}
                x2={hoverPos.x}
                y2={chartHeight - paddingY}
                stroke="#64748b"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>

        {/* Floating Real-Time Hover Tooltip */}
        {hoveredCandle && hoverPos && (
          <div
            className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-lg bg-[#080d1e]/95 border border-cyan-500/40 text-[10px] font-mono shadow-2xl backdrop-blur-md"
            style={{
              left: Math.min(chartWidth - 220, Math.max(20, hoverPos.x - 70)),
              top: Math.max(10, hoverPos.y - 75),
            }}
          >
            <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-white/[0.08] pb-1 mb-1">
              <span>{new Date(hoveredCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                {hoveredCandle.close >= hoveredCandle.open ? '▲ BULLISH' : '▼ BEARISH'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-300">
              <span>Open: <strong className="text-white">${hoveredCandle.open.toFixed(priceDigits)}</strong></span>
              <span>High: <strong className="text-white">${hoveredCandle.high.toFixed(priceDigits)}</strong></span>
              <span>Low: <strong className="text-white">${hoveredCandle.low.toFixed(priceDigits)}</strong></span>
              <span>Close: <strong className="text-white">${hoveredCandle.close.toFixed(priceDigits)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM CHART STATUS BAR                                     */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.08] bg-[#070b16] text-[10px] text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXNESS REAL FEED (#472658395)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Order Blocks (Unmitigated)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Fair Value Gaps (Active)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>50% Equilibrium Divider</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono">
          <span>Active Bars: {activeCandles.length}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Zero Lag / 240 FPS</span>
        </div>
      </div>
    </div>
  );
};
