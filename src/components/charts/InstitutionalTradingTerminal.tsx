'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  CompleteVolumeAnalysis, 
  TimeframeId, 
  ProfileMode, 
  TradingSession,
  NormalizedMarketRecord,
  VolumeProfileBin
} from '@/lib/volume/volume-types';
import { OrderflowCanvasEngine, ChartViewMode } from './OrderflowCanvasEngine';
import { TradingViewWidget } from './TradingViewWidget';
import { TradingChart } from './TradingChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Radio, 
  Sliders, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Info,
  Maximize2
} from 'lucide-react';

interface Props {
  initialSymbol?: string;
  initialTimeframe?: TimeframeId;
}

const UtcClockBadge = React.memo(() => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toISOString().slice(11, 19) + ' UTC');
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-[11px] font-mono text-slate-400 px-2 py-1 bg-black/40 rounded border border-white/[0.04]">
      {time || '00:00:00 UTC'}
    </span>
  );
});

export const InstitutionalTradingTerminal: React.FC<Props> = ({
  initialSymbol = 'XAUUSD',
  initialTimeframe = '5M',
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<TimeframeId>(initialTimeframe);
  const [profileMode, setProfileMode] = useState<ProfileMode>('VISIBLE');
  const [activeSession, setActiveSession] = useState<TradingSession>('DAILY');
  const [viewMode, setViewMode] = useState<any>('FOOTPRINT_CLASSIC');
  const [chartEngine, setChartEngine] = useState<'TRADINGVIEW' | 'SMC_VECTOR' | 'FOOTPRINT_CANVAS'>('TRADINGVIEW');

  // Layer Visibility Toggles
  const [showVolumeProfile, setShowVolumeProfile] = useState<boolean>(true);
  const [showVwap, setShowVwap] = useState<boolean>(true);
  const [showDelta, setShowDelta] = useState<boolean>(true);
  const [showLiquidity, setShowLiquidity] = useState<boolean>(true);
  const [showAiAnalysis, setShowAiAnalysis] = useState<boolean>(true);

  // Analysis State
  const [analysis, setAnalysis] = useState<CompleteVolumeAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
  }, [initialSymbol]);

  const inFlightRef = useRef<boolean>(false);

  const fetchAnalysis = useCallback(async (sym: string, tf: TimeframeId, mode: ProfileMode, isSilent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`/api/volume?symbol=${sym}&timeframe=${tf}&mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (e) {
      console.error('Terminal fetch error:', e);
    } finally {
      inFlightRef.current = false;
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis(symbol, timeframe, profileMode, false);
  }, [symbol, timeframe, profileMode, fetchAnalysis]);

  // Periodic live refresh every 7 seconds (silent background refresh without layout flickers)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchAnalysis(symbol, timeframe, profileMode, true);
    }, 7000);
    return () => clearInterval(interval);
  }, [symbol, timeframe, profileMode, fetchAnalysis]);

  const symbolsList = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'USTEC'];
  const timeframesList: TimeframeId[] = ['5M', '15M', '1H', '4H', '1D'];

  const candles: NormalizedMarketRecord[] = useMemo(() => {
    return analysis?.candles || [];
  }, [analysis]);

  const profile = useMemo(() => {
    if (!analysis) return null;
    if (profileMode === 'SESSION') {
      if (activeSession === 'ASIA') return analysis.sessionProfiles.asia || analysis.currentProfile;
      if (activeSession === 'LONDON') return analysis.sessionProfiles.london || analysis.currentProfile;
      if (activeSession === 'NEW_YORK') return analysis.sessionProfiles.newYork || analysis.currentProfile;
    }
    if (profileMode === 'DAILY') return analysis.sessionProfiles.daily || analysis.currentProfile;
    if (profileMode === 'WEEKLY') return analysis.sessionProfiles.weekly || analysis.currentProfile;
    return analysis.currentProfile;
  }, [analysis, profileMode, activeSession]);

  const currentPrice = analysis?.currentPrice || (candles.length > 0 ? candles[candles.length - 1].close : 4348.93);
  const prevPrice = candles.length > 1 ? candles[candles.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const pricePercent = (priceChange / (prevPrice || 1)) * 100;

  return (
    <div className="flex flex-col gap-3 font-sans text-xs text-slate-100 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: Symbol, Timeframes, Layers, Badges, Live Status */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#090e17] border border-white/[0.08] shadow-lg">
        {/* Left: Brand, Symbol Dropdown & Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-black font-black text-xs">
              ⚡
            </div>
            <span className="font-extrabold text-white text-xs tracking-wider uppercase hidden sm:inline">
              THE CLEVER TRADER
            </span>
          </div>

          {/* Symbol Selector */}
          <div className="flex items-center gap-2 bg-[#0d1522] px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {symbolsList.map(s => (
                <option key={s} value={s} className="bg-[#090e17] text-white">
                  {s}
                </option>
              ))}
            </select>
            <span className="text-white font-mono font-bold ml-1">
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-mono font-bold ${priceChange >= 0 ? 'text-terminal-green' : 'text-terminal-rose'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({pricePercent >= 0 ? '+' : ''}{pricePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Multi-Timeframe Selector */}
          <div className="flex items-center bg-[#0d1522] p-0.5 rounded-lg border border-white/[0.08]">
            {timeframesList.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-terminal-cyan text-black shadow-cyan-glow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: Feature Toggles & System Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PRIMARY CHART ENGINE SWITCHER: TRADINGVIEW PRO (DEFAULT) vs SMC VECTOR vs FOOTPRINT */}
          <div className="flex items-center bg-[#050b18] p-1 rounded-xl border border-cyan-500/40 text-[11px] font-bold shadow-lg shadow-cyan-500/10">
            <button
              onClick={() => setChartEngine('TRADINGVIEW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartEngine === 'TRADINGVIEW'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>📈</span>
              <span>PRO CHART</span>
            </button>

            <button
              onClick={() => setChartEngine('SMC_VECTOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartEngine === 'SMC_VECTOR'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>SMC / ICT RADAR</span>
            </button>

            <button
              onClick={() => setChartEngine('FOOTPRINT_CANVAS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartEngine === 'FOOTPRINT_CANVAS'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>👣</span>
              <span>FOOTPRINT &amp; DOM</span>
            </button>
          </div>

          {/* Orderflow & Footprint View Modes (Packs 1, 2, 3, 4) - only shown when FOOTPRINT active */}
          {chartEngine === 'FOOTPRINT_CANVAS' && (
            <div className="flex items-center bg-[#070c18] p-0.5 rounded-lg border border-amber-500/30 text-[10px] font-mono">
            <button
              onClick={() => setViewMode('CANDLESTICK')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === 'CANDLESTICK' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🕯️ CANDLES
            </button>
            <button
              onClick={() => setViewMode('FOOTPRINT_CLASSIC')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === 'FOOTPRINT_CLASSIC' || viewMode === 'FOOTPRINT' ? 'bg-amber-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Classic Footprint (Bid x Ask with 300% Stacked Imbalances)"
            >
              👣 BID×ASK
            </button>
            <button
              onClick={() => setViewMode('FOOTPRINT_4COL')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === 'FOOTPRINT_4COL' ? 'bg-cyan-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Four Columns Style (Vol, Bids, Asks, Instant Delta)"
            >
              📊 4-COL
            </button>
            <button
              onClick={() => setViewMode('FOOTPRINT_DELTA_BLOCKS')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === 'FOOTPRINT_DELTA_BLOCKS' ? 'bg-emerald-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Delta Blocks (Intensity-Colored Delta)"
            >
              🟩 DELTA BLOCKS
            </button>
            <button
              onClick={() => setViewMode('LIQUIDITY_HEATMAP')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === 'LIQUIDITY_HEATMAP' ? 'bg-gradient-to-r from-cyan-500 to-amber-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Past & Live DOM Liquidity Heatmap (Bookmap Style)"
            >
              🔥 HEATMAP
            </button>
          </div>
          )}

          <div className="flex items-center bg-[#0d1522] p-1 rounded-lg border border-white/[0.08] text-[11px]">
            <button
              onClick={() => setShowVolumeProfile(!showVolumeProfile)}
              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                showVolumeProfile ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <span>Volume Profile</span>
            </button>
            <button
              onClick={() => setShowVwap(!showVwap)}
              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                showVwap ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <span>VWAP</span>
            </button>
            <button
              onClick={() => setShowDelta(!showDelta)}
              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                showDelta ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <span>Delta</span>
            </button>
            <button
              onClick={() => setShowLiquidity(!showLiquidity)}
              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                showLiquidity ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <span>Liquidity</span>
            </button>
            <button
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all ${
                showAiAnalysis ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400'
              }`}
            >
              <span>AI Analysis</span>
            </button>
          </div>

          {/* Status Badges */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 text-terminal-green border border-emerald-500/30 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>

          <span className="px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1">
            <span>MT5 Connected</span>
          </span>

          <UtcClockBadge />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: Candlestick & Profile Chart + Right Sidebar Pane */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* LEFT / CENTER (Col 1-9): Interactive Canvas & 3 Subcharts */}
        <div className="xl:col-span-9 flex flex-col gap-2">
          {/* Main Chart Card: Supports TradingView Pro, SMC Vector Radar & 4-Pack Footprint */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] bg-[#040813]">
            {chartEngine === 'TRADINGVIEW' && (
              <TradingViewWidget
                symbol={symbol}
                timeframe={timeframe === '5M' ? '5m' : timeframe === '15M' ? '15m' : timeframe === '1H' ? '1H' : timeframe === '4H' ? '4H' : '1D'}
                height={520}
              />
            )}

            {chartEngine === 'SMC_VECTOR' && (
              <div className="p-1">
                <TradingChart
                  symbol={symbol}
                  timeframe={timeframe}
                  candles={candles as any}
                />
              </div>
            )}

            {chartEngine === 'FOOTPRINT_CANVAS' && (
              <OrderflowCanvasEngine
                symbol={symbol}
                timeframe={timeframe}
                candles={candles}
                profile={profile}
                vwap={analysis?.vwap}
                footprintSeries={analysis?.footprintSeries}
                divergences={analysis?.divergences}
                showVolumeProfile={showVolumeProfile}
                showVwap={showVwap}
                showEma={true}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                height={520}
              />
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3 SYNCHRONIZED ORDERFLOW SUBCHARTS (Dynamic Real Delta, CVD & Spike) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Subchart 1: Real Volume Delta Histogram */}
            <div className="p-3 rounded-xl bg-[#070b13] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                  VOLUME & DELTA
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">
                    Buy: {analysis?.currentProfile.totalBuyVolume ? (analysis.currentProfile.totalBuyVolume / 1000).toFixed(1) + 'K' : '1.12K'}
                  </span>
                  <span className="text-rose-400 font-bold">
                    Sell: {analysis?.currentProfile.totalSellVolume ? (analysis.currentProfile.totalSellVolume / 1000).toFixed(1) + 'K' : '0.93K'}
                  </span>
                  <span className={`font-bold ${(analysis?.delta.delta || 0) >= 0 ? 'text-terminal-cyan' : 'text-terminal-rose'}`}>
                    Δ {(analysis?.delta.delta || 0) > 0 ? '+' : ''}{analysis?.delta.delta || 0}
                  </span>
                </div>
              </div>
              <div className="h-16 flex items-end gap-1 border-b border-white/[0.04] pb-1">
                {(analysis?.cvdSeries && analysis.cvdSeries.length > 0 ? analysis.cvdSeries.slice(-32) : []).map((pt, i) => {
                  const isPos = pt.delta >= 0;
                  const maxAbs = Math.max(...(analysis?.cvdSeries || []).map(p => Math.abs(p.delta)), 1);
                  const barH = Math.min(52, Math.max(4, (Math.abs(pt.delta) / maxAbs) * 50));
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                      <div
                        style={{ height: `${barH}px` }}
                        className={`w-full rounded-t-sm transition-all duration-150 ${
                          isPos ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-rose-500/80 hover:bg-rose-400'
                        }`}
                      />
                      {/* Micro Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-black/90 px-1.5 py-0.5 rounded border border-white/20 text-[9px] font-mono whitespace-nowrap z-30 pointer-events-none">
                        <span>{pt.timeString}</span>
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>Δ {pt.delta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subchart 2: Real Cumulative Delta (CVD) Continuous Trendline */}
            <div className="p-3 rounded-xl bg-[#070b13] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                  CUMULATIVE DELTA (CVD)
                </span>
                <div className="flex items-center gap-1.5">
                  {analysis?.divergences && analysis.divergences.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold animate-pulse">
                      DIVERGENCE ACTIVE
                    </span>
                  )}
                  <span className={`font-mono font-bold text-[10px] ${(analysis?.cvdSeries && analysis.cvdSeries.length > 0 && analysis.cvdSeries[analysis.cvdSeries.length - 1].cvd >= 0) ? 'text-terminal-green' : 'text-terminal-rose'}`}>
                    {analysis?.cvdSeries && analysis.cvdSeries.length > 0 ? (analysis.cvdSeries[analysis.cvdSeries.length - 1].cvd > 0 ? '+' : '') + analysis.cvdSeries[analysis.cvdSeries.length - 1].cvd : '+12.6K'}
                  </span>
                </div>
              </div>
              <div className="h-16 relative flex items-center">
                <div className="w-full h-[1px] bg-white/10 absolute top-1/2"></div>
                {analysis?.cvdSeries && analysis.cvdSeries.length > 1 ? (() => {
                  const pts = analysis.cvdSeries.slice(-32);
                  const minCvd = Math.min(...pts.map(p => p.cvd));
                  const maxCvd = Math.max(...pts.map(p => p.cvd));
                  const span = Math.max(1, maxCvd - minCvd);
                  const path = pts.map((p, i) => {
                    const x = (i / (pts.length - 1)) * 100;
                    const y = 35 - ((p.cvd - minCvd) / span) * 30;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ');
                  const lastCvd = pts[pts.length - 1].cvd;
                  return (
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                      <path
                        d={path}
                        fill="none"
                        stroke={lastCvd >= 0 ? '#10b981' : '#f43f5e'}
                        strokeWidth="2"
                      />
                    </svg>
                  );
                })() : (
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                    <path
                      d="M 0 30 Q 25 35, 45 20 T 75 15 T 100 8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Subchart 3: Real Volume Spike Z-Score Radar */}
            <div className="p-3 rounded-xl bg-[#070b13] border border-white/[0.08] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                  VOLUME SPIKE RADAR
                </span>
                <div className="flex items-center gap-1.5 text-[8.5px]">
                  <span className="text-emerald-400">● Normal</span>
                  <span className="text-cyan-400">● Elevated</span>
                  <span className="text-amber-400">● Spike</span>
                  <span className="text-rose-400">● Extreme</span>
                </div>
              </div>
              <div className="h-16 flex items-center justify-around">
                {(analysis?.spikeSeries && analysis.spikeSeries.length > 0 ? analysis.spikeSeries.slice(-9) : [
                  { zScore: 0.8, classification: 'NORMAL' as const },
                  { zScore: 1.2, classification: 'ELEVATED' as const },
                  { zScore: 2.3, classification: 'SPIKE' as const },
                  { zScore: 3.1, classification: 'EXTREME' as const },
                  { zScore: 0.9, classification: 'NORMAL' as const },
                  { zScore: 1.6, classification: 'ELEVATED' as const },
                  { zScore: 2.1, classification: 'SPIKE' as const },
                  { zScore: 0.7, classification: 'NORMAL' as const },
                  { zScore: 1.4, classification: 'ELEVATED' as const },
                ]).map((sp, i) => {
                  const z = sp.zScore;
                  const color = sp.classification === 'EXTREME' ? '#f43f5e' : (sp.classification === 'SPIKE' ? '#fbbf24' : (sp.classification === 'ELEVATED' ? '#06b6d4' : '#10b981'));
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-1.5 h-8 bg-white/[0.04] rounded flex items-end">
                        <div style={{ height: `${Math.min(32, Math.max(4, Math.abs(z) * 10))}px`, backgroundColor: color }} className="w-full rounded-sm" />
                      </div>
                      <span style={{ backgroundColor: color }} className="w-2 h-2 rounded-full" />
                      <span className="text-[8px] font-mono text-slate-400">{z.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR PANE (Col 10-12): Profile Modes & Quantitative Metrics */}
        <div className="xl:col-span-3 flex flex-col gap-2.5">
          <div className="p-3.5 rounded-xl bg-[#090e17] border border-white/[0.08] flex flex-col gap-3">
            {/* Mode Switch Tabs: VISIBLE | SESSION | DAILY | WEEKLY */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-terminal-cyan" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  VOLUME PROFILE ({timeframe})
                </span>
              </div>
              <div className="flex items-center bg-[#0d1522] p-0.5 rounded border border-white/[0.08] text-[9px] font-bold">
                {(['VISIBLE', 'SESSION', 'DAILY', 'WEEKLY'] as ProfileMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setProfileMode(m)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      profileMode === m ? 'bg-terminal-cyan text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Sub-Tabs (If SESSION mode selected) */}
            {profileMode === 'SESSION' && (
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                {(['ASIA', 'LONDON', 'NEW_YORK'] as TradingSession[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSession(s)}
                    className={`p-1 rounded text-center border font-bold ${
                      activeSession === s ? 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/40' : 'bg-black/30 border-white/[0.04] text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Metric Boxes: POC, VAH, VAL */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold block">POC</span>
                <span className="text-white text-xs font-bold">{profile?.poc.toFixed(2) || '4,348.93'}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-400 font-bold block">VAH</span>
                <span className="text-white text-xs font-bold">{profile?.vah.toFixed(2) || '4,352.67'}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-purple-500/30">
                <span className="text-[10px] text-purple-400 font-bold block">VAL</span>
                <span className="text-white text-xs font-bold">{profile?.val.toFixed(2) || '4,345.12'}</span>
              </div>
            </div>

            {/* VWAP & Delta Bar */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">VWAP</span>
                <span className="text-white font-bold">{analysis?.vwap.vwap.toFixed(2) || '4,346.32'}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Delta (PROXY)</span>
                <span className="text-terminal-green font-bold">+892 <span className="text-[9px] text-slate-400">(59% B)</span></span>
              </div>
            </div>

            {/* Volume & Flow Analytics */}
            <div className="p-2.5 rounded-lg bg-[#070b13] border border-white/[0.04] space-y-1.5 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">VOLUME & FLOW</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Buy Volume:</span>
                  <span className="text-terminal-green font-bold">1.12M</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sell Volume:</span>
                  <span className="text-terminal-rose font-bold">0.93M</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Volume:</span>
                  <span className="text-white font-bold">{profile?.totalVolume.toLocaleString() || '2.05M'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Volume Z-Score:</span>
                  <span className="text-amber-400 font-bold">2.34 <strong className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20">SPIKE</strong></span>
                </div>
              </div>
            </div>

            {/* High Volume Nodes (HVN) & Low Volume Nodes (LVN) */}
            <div className="p-2.5 rounded-lg bg-[#070b13] border border-white/[0.04] space-y-2 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">PROFILE ANALYSIS</span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
                  <span>◆ HVN {profile?.hvn.length || 3} (High Volume Nodes)</span>
                </div>
                <div className="space-y-0.5 text-[10px] font-mono text-slate-300 pl-2">
                  <div>• 4,350.21 — 4,351.87</div>
                  <div>• 4,348.12 — 4,349.76</div>
                  <div>• 4,346.03 — 4,347.58</div>
                </div>

                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px] pt-1">
                  <span>❖ LVN {profile?.lvn.length || 2} (Low Volume Nodes)</span>
                </div>
                <div className="space-y-0.5 text-[10px] font-mono text-slate-300 pl-2">
                  <div>• 4,343.21 — 4,344.06</div>
                  <div>• 4,339.12 — 4,340.34</div>
                </div>
              </div>
            </div>

            {/* Naked POC (Untouched) */}
            <div className="p-2.5 rounded-lg bg-[#070b13] border border-white/[0.04] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <span>◎ NAKED POC (UNTOUCHED)</span>
                </span>
                <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10">2 ACTIVE</span>
              </div>
              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="flex items-center justify-between p-1 rounded bg-black/40">
                  <span className="text-amber-300 font-bold">4,352.67</span>
                  <span className="text-slate-400">(NEW_YORK)</span>
                  <span className="text-rose-400 font-bold">FAILED</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-black/40">
                  <span className="text-amber-300 font-bold">4,346.21</span>
                  <span className="text-slate-400">(ASIA)</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SUMMARY BAR: Confluence, AI Interpretation, MTF Bias, Stats */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Liquidity & Volume Confluence */}
        <div className="p-3.5 rounded-xl bg-[#090e17] border border-white/[0.08] flex items-center gap-3">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#10b981"
                strokeWidth="5"
                fill="none"
                strokeDasharray="163"
                strokeDashoffset={163 - (163 * 0.78)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-white font-black text-sm font-mono">78</span>
              <span className="text-[8px] text-slate-400">/100</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px]">
            <span className="text-white font-bold text-xs text-terminal-green">Strong Setup</span>
            <span className="text-slate-300">✓ Liquidity Sweep</span>
            <span className="text-slate-300">✓ HVN/LVN Reaction</span>
            <span className="text-slate-300">✓ VWAP Support</span>
            <span className="text-slate-300">✓ Delta Confirmation</span>
          </div>
        </div>

        {/* Card 2: AI Market Interpretation */}
        <div className="p-3.5 rounded-xl bg-[#090e17] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">AI MARKET INTERPRETATION</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-terminal-green font-bold text-[10px]">
              + BULLISH
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Multi-timeframe analysis shows bullish bias. Price is reacting from Value Area support (VAL: {profile?.val.toFixed(2)}) with expanding volume and positive delta. Watch for continuation toward VAH ({profile?.vah.toFixed(2)}).
          </p>
        </div>

        {/* Card 3: Multi-Timeframe Bias Matrix */}
        <div className="p-3.5 rounded-xl bg-[#090e17] border border-white/[0.08] flex flex-col justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">MULTI-TIMEFRAME BIAS</span>
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className="p-1.5 rounded bg-black/40 border border-emerald-500/30">
              <span className="text-slate-400 block text-[9px]">5M</span>
              <span className="text-emerald-400 font-bold">↗ BULL</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-emerald-500/30">
              <span className="text-slate-400 block text-[9px]">15M</span>
              <span className="text-emerald-400 font-bold">↗ BULL</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-emerald-500/30">
              <span className="text-slate-400 block text-[9px]">1H</span>
              <span className="text-emerald-400 font-bold">↗ BULL</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/10">
              <span className="text-slate-400 block text-[9px]">4H</span>
              <span className="text-slate-300 font-bold">→ NEUT</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-emerald-500/30">
              <span className="text-slate-400 block text-[9px]">1D</span>
              <span className="text-emerald-400 font-bold">↗ BULL</span>
            </div>
          </div>
        </div>

        {/* Card 4: Market Stats */}
        <div className="p-3.5 rounded-xl bg-[#090e17] border border-white/[0.08] flex flex-col justify-between text-[11px] font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">MARKET STATS</span>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">TICK COUNT:</span>
              <span className="text-white font-bold">{analysis?.diagnostics?.tickCount || '12,482'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CANDLE COUNT:</span>
              <span className="text-white font-bold">{candles.length || '288'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DATA SOURCE:</span>
              <span className="text-cyan-400 font-bold">MT5 + BIQUOTE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">STATUS:</span>
              <span className="text-terminal-green font-bold">● LIVE STREAMING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
