'use client';

import React, { useState, useEffect } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { Mt5ConnectionModal } from '@/components/trading/Mt5ConnectionModal';
import { JarvisModal } from '@/components/jarvis/JarvisModal';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { PaperPosition } from '@/lib/types/trading';
import { useMarketData } from '@/lib/hooks/useMarketData';

// Dashboard Components (Matching Dribbble Reference)
import { MarketWatchPanel } from '@/components/terminal/MarketWatchPanel';
import { UnifiedMarketDock } from '@/components/terminal/UnifiedMarketDock';
import { LatestNewsPanel } from '@/components/terminal/LatestNewsPanel';
import { LiveNewsPlayer } from '@/components/terminal/LiveNewsPlayer';
import { LiveTradesAndAnalyticsHub } from '@/components/terminal/LiveTradesAndAnalyticsHub';
import dynamic from 'next/dynamic';
import { TradingViewWidget } from '@/components/charts/TradingViewWidget';
import { TradingChart } from '@/components/charts/TradingChart';
import { WidgetErrorBoundary } from '@/components/terminal/WidgetErrorBoundary';
import { INITIAL_CANDLES_MAP } from '@/lib/data/sample-data';

const VortexWorkspaceWidget = dynamic(
  () => import('@/components/vortex/VortexWorkspaceWidget').then((mod) => mod.VortexWorkspaceWidget),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[480px] bg-[#070a12] flex items-center justify-center font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>INITIALIZING VORTEX QUANT ENGINE...</span>
        </div>
      </div>
    ),
  }
);

import {
  BarChart2,
  Sparkles,
  Zap,
  Layers,
  Activity,
  Save,
  Check,
  Maximize2,
  Grid3X3,
  Crosshair,
  Type,
  Ruler,
  TrendingUp,
  Clock,
  FlipVertical2,
  X,
  Plus,
  Trash2,
  Tag,
  Compass,
} from 'lucide-react';

import { AiDebateModal } from '@/components/jarvis/AiDebateModal';
import { TradingViewWebhookModal } from '@/components/trading/TradingViewWebhookModal';

import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';

const CandleCountdown = React.memo(function CandleCountdown({
  symbol,
  activeTimeframe,
}: {
  symbol: string;
  activeTimeframe: string;
}) {
  const [countdown, setCountdown] = useState('--:--');
  const [marketOpen, setMarketOpen] = useState(() => SessionFilterEngine.isMarketOpen(symbol));

  useEffect(() => {
    const updateCd = () => {
      const openStatus = SessionFilterEngine.isMarketOpen(symbol);
      setMarketOpen(openStatus);
      if (!openStatus.isOpen) return;

      const t = (activeTimeframe || '15m').toLowerCase();
      let tfSec = 900;
      if (t === '1m') tfSec = 60;
      else if (t === '5m') tfSec = 300;
      else if (t === '15m') tfSec = 900;
      else if (t === '30m') tfSec = 1800;
      else if (t === '1h' || t === '60m') tfSec = 3600;
      else if (t === '4h' || t === '240m') tfSec = 14400;
      else if (t === '1d' || t === 'd') tfSec = 86400;

      const nowSec = Math.floor(Date.now() / 1000);
      const elapsed = nowSec % tfSec;
      const rem = tfSec - elapsed;
      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    updateCd();
    const interval = setInterval(updateCd, 1000);
    return () => clearInterval(interval);
  }, [symbol, activeTimeframe]);

  if (!marketOpen.isOpen) {
    return (
      <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 shadow-sm text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span>⛔ {marketOpen.label} {marketOpen.opensAt ? `(OPENS ${marketOpen.opensAt.toUpperCase()})` : ''}</span>
      </span>
    );
  }

  return (
    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 shadow-sm">
      <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
      <span>{activeTimeframe} CLOSES IN: {countdown}</span>
    </span>
  );
});

export default function CommandCenterPage() {
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    ticks: liveTicks,
    account,
    candles,
    candlesStatus,
    feedQuality,
    feedSource,
    isMarketOpen,
    marketStatusText,
  } = useMarketData();
  const [isMt5ModalOpen, setIsMt5ModalOpen] = useState(false);
  const [isJarvisModalOpen, setIsJarvisModalOpen] = useState(false);
  const [isDebateModalOpen, setIsDebateModalOpen] = useState(false);
  const [isTvWebhookOpen, setIsTvWebhookOpen] = useState(false);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [chartEngine, setChartEngine] = useState<'VORTEX' | 'TRADINGVIEW' | 'SMC_ALGO'>('VORTEX');
  const [isChartFlipped, setIsChartFlipped] = useState(false);

  // Active Chart Toolbar State (Crosshair, Ruler, Type, Grid, Volume, Save)
  const [isCrosshairActive, setIsCrosshairActive] = useState(false);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [isAnnotationActive, setIsAnnotationActive] = useState(false);
  const [isGridActive, setIsGridActive] = useState(false);
  const [isVolumeOverlayActive, setIsVolumeOverlayActive] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  // Ruler state
  const [rulerStartPrice, setRulerStartPrice] = useState<number>(0);
  const [rulerEndPrice, setRulerEndPrice] = useState<number>(0);

  // Annotations state
  const [chartAnnotations, setChartAnnotations] = useState<string[]>([
    '⚡ London Killzone Liquidity Sweep',
    '📦 15M Bullish Fair Value Gap (FVG)',
  ]);
  const [customAnnotationInput, setCustomAnnotationInput] = useState('');

  // Load saved workspace on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clever_trader_chart_workspace');
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.isCrosshairActive === 'boolean') setIsCrosshairActive(data.isCrosshairActive);
        if (typeof data.isRulerActive === 'boolean') setIsRulerActive(data.isRulerActive);
        if (typeof data.isAnnotationActive === 'boolean') setIsAnnotationActive(data.isAnnotationActive);
        if (typeof data.isGridActive === 'boolean') setIsGridActive(data.isGridActive);
        if (typeof data.isVolumeOverlayActive === 'boolean') setIsVolumeOverlayActive(data.isVolumeOverlayActive);
        if (Array.isArray(data.annotations) && data.annotations.length > 0) setChartAnnotations(data.annotations);
      }
    } catch (e) {}
  }, []);

  const handleSaveWorkspace = () => {
    try {
      localStorage.setItem(
        'clever_trader_chart_workspace',
        JSON.stringify({
          isCrosshairActive,
          isRulerActive,
          isAnnotationActive,
          isGridActive,
          isVolumeOverlayActive,
          isChartFlipped,
          annotations: chartAnnotations,
          savedAt: new Date().toISOString(),
        })
      );
      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 2500);
    } catch (e) {}
  };

  const centralIntel = JarvisIntelligenceBrain.getCentralIntelligence(selectedSymbol);

  const supportedSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'US30', 'NAS100', 'SPX500', 'DXY'];
  const symbolKey = supportedSymbols.includes(selectedSymbol) ? selectedSymbol : 'XAUUSD';
  const spec = INSTITUTIONAL_SYMBOLS[symbolKey] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const currentTick = liveTicks[selectedSymbol];
  const displayPrice = currentTick?.price ?? spec.currentPrice;
  const displayHigh = currentTick?.high ?? spec.high24h;
  const displayLow = currentTick?.low ?? spec.low24h;
  const displayChange = currentTick?.change ?? spec.change24h;
  const isUp = (displayChange ?? 0) >= 0;

  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'];

  useEffect(() => {
    const syncPositions = async () => {
      try {
        const pos = await globalPaperBroker.getPositions();
        setPositions(pos);
      } catch (e) {}
    };
    syncPositions();
    const interval = setInterval(syncPositions, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update ruler start & target prices when symbol or price updates
  useEffect(() => {
    if (displayPrice > 0) {
      const pip = spec.priceDigits === 2 ? 0.1 : spec.priceDigits === 5 ? 0.0001 : 1;
      setRulerStartPrice(prev => (prev === 0 ? Number((displayPrice - 15 * pip).toFixed(spec.priceDigits || 4)) : prev));
      setRulerEndPrice(prev => (prev === 0 ? Number((displayPrice + 45 * pip).toFixed(spec.priceDigits || 4)) : prev));
    }
  }, [displayPrice, spec.priceDigits]);

  return (
    <div className="space-y-2.5 font-sans text-slate-100 w-full pb-8 select-none">

      {/* ================================================================ */}
      {/* 2. MAIN WORKSPACE: Chart (8 cols) + Right Sidebar (4 cols)       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5">

        {/* ============================================================== */}
        {/* LEFT: Chart Area (8 cols)                                       */}
        {/* ============================================================== */}
        <div className="xl:col-span-8 flex flex-col gap-2.5">

          {/* Chart Toolbar */}
          <div className="ronas-card p-0 overflow-hidden bg-[#040405] border border-white/[0.08] shrink-0">
            {/* Toolbar Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] bg-black/80">
              {/* Left: Symbol */}
              <div className="flex items-center gap-2">
                {/* Active Symbol */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                  !isMarketOpen
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-cyan-500/15 border-cyan-500/30 text-white'
                }`}>
                  <span className="text-xs font-black font-mono">{selectedSymbol}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${!isMarketOpen ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                  {!isMarketOpen && (
                    <span className="text-[8.5px] font-bold text-rose-400 uppercase tracking-wider">CLOSED</span>
                  )}
                </div>
              </div>

              {/* Right: Engine Switcher + MT5 Connect */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 3-Engine Selector */}
                <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setChartEngine('VORTEX')}
                    className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1 ${
                      chartEngine === 'VORTEX'
                        ? 'bg-blue-600 text-white shadow-sm border border-blue-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Institutional 3D Multi-Agent Vortex Terminal"
                  >
                    <span>🌀 VORTEX QUANT</span>
                  </button>
                  <button
                    onClick={() => setChartEngine('TRADINGVIEW')}
                    className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                      chartEngine === 'TRADINGVIEW'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="TradingView Real-time Chart"
                  >
                    TRADINGVIEW
                  </button>
                  <button
                    onClick={() => setChartEngine('SMC_ALGO')}
                    className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                      chartEngine === 'SMC_ALGO'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Institutional SMC / ICT Algorithm"
                  >
                    SMC ALGO
                  </button>
                </div>

                <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

                <button
                  onClick={() => setIsMt5ModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-[10px] font-mono font-black transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:scale-105"
                  title="Connect MetaTrader 5 Account"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>⚡ MT5 CONNECT</span>
                </button>

                <button
                  onClick={() => setIsDebateModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-[10px] font-mono font-black transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:scale-105"
                  title="Wall Street AI Council & Debate Arena (Burry, Cathie, Buffett, Sonnet, NEXUS AI)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>🏛️ AI COUNCIL</span>
                </button>

                <button
                  onClick={() => setIsTvWebhookOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-[10px] font-mono font-black transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:scale-105"
                  title="TradingView Essential Plan Webhook Alerts & Auto-Execution Bridge"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>📡 TV WEBHOOK</span>
                </button>

                <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

                {/* 1. CROSSHAIR INSPECTOR */}
                <button
                  onClick={() => setIsCrosshairActive(prev => !prev)}
                  className={`relative p-1.5 rounded-md transition-all border ${
                    isCrosshairActive
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                      : 'hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent'
                  }`}
                  title={isCrosshairActive ? 'Crosshair Inspector: ACTIVE (Click to Turn Off)' : 'Crosshair Inspector (Click to Activate)'}
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isCrosshairActive ? 'text-cyan-400' : ''}`} />
                  {isCrosshairActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>

                {/* 2. RULER MEASUREMENT TOOL */}
                <button
                  onClick={() => setIsRulerActive(prev => !prev)}
                  className={`relative p-1.5 rounded-md transition-all border ${
                    isRulerActive
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                      : 'hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent'
                  }`}
                  title={isRulerActive ? 'Ruler & Pip Calculator: ACTIVE (Click to Hide)' : 'Ruler (Pip & Risk/Reward Measurement Tool)'}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  {isRulerActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                {/* 3. TYPE & SMC ANNOTATION TOOL */}
                <button
                  onClick={() => setIsAnnotationActive(prev => !prev)}
                  className={`relative p-1.5 rounded-md transition-all border ${
                    isAnnotationActive
                      ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                      : 'hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent'
                  }`}
                  title={isAnnotationActive ? 'Chart Notes & SMC Annotations: ACTIVE (Click to Close)' : 'Text & SMC Trade Annotations (BOS, MSS, FVG, OTE)'}
                >
                  <Type className="w-3.5 h-3.5" />
                  {isAnnotationActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </button>

                {/* 4. SMC FIBONACCI & SESSION GRID */}
                <button
                  onClick={() => setIsGridActive(prev => !prev)}
                  className={`relative p-1.5 rounded-md transition-all border ${
                    isGridActive
                      ? 'bg-blue-500/25 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.35)]'
                      : 'hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent'
                  }`}
                  title={isGridActive ? 'SMC Fibonacci & Session Grid: ACTIVE (Click to Hide)' : 'SMC Fibonacci 50% Equilibrium & Session Grid Overlay'}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  {isGridActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>

                {/* 5. VOLUME PROFILE & ORDER FLOW DELTA */}
                <button
                  onClick={() => setIsVolumeOverlayActive(prev => !prev)}
                  className={`relative p-1.5 rounded-md transition-all border ${
                    isVolumeOverlayActive
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                      : 'hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent'
                  }`}
                  title={isVolumeOverlayActive ? 'Volume Profile & Delta Footprint: ACTIVE (Click to Hide)' : 'Volume Profile, POC & Order Flow Delta Overlay'}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  {isVolumeOverlayActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <div className="w-px h-4 bg-white/[0.08] mx-1" />

                {/* ⇅ FLIP CHART VERTICALLY (IC Invert Toggle) */}
                <button
                  onClick={() => setIsChartFlipped(prev => !prev)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all border ${
                    isChartFlipped
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                  title={isChartFlipped ? 'Chart FLIPPED ⇅ — Click to Reset' : 'Flip Chart Vertically ⇅ (IC Invert)'}
                >
                  <FlipVertical2 className={`w-3.5 h-3.5 transition-transform duration-300 ${isChartFlipped ? 'rotate-180 text-amber-400' : ''}`} />
                  <span>{isChartFlipped ? '⊖ FLIPPED' : '⊕ FLIP'}</span>
                </button>

                <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
                <button
                  onClick={handleSaveWorkspace}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all border ${
                    isSaveSuccess
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                  title="Save Chart Layout, Tools & Indicator Overlays to Local Storage"
                >
                  {isSaveSuccess ? <Check className="w-3 h-3 text-emerald-400 animate-bounce" /> : <Save className="w-3 h-3" />}
                  <span>{isSaveSuccess ? 'SAVED!' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Chart Info Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] bg-[#080d16]/40 text-[10px] font-mono">
              <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                <span className="text-white font-bold">{selectedSymbol} — {spec.name || 'Forex'} — {selectedTimeframe}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${
                  !isMarketOpen
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : feedQuality === 'LIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${!isMarketOpen ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{!isMarketOpen ? '● MARKET CLOSED' : feedQuality === 'LIVE' ? '● LIVE' : `○ ${feedQuality}`}</span>
                </span>
                <span className="text-slate-400 text-[9px] font-semibold">{feedSource}</span>
                <span>BID <strong className="text-emerald-400 font-bold">{displayPrice.toFixed(spec.priceDigits || 4)}</strong></span>
                <span>HIGH <strong className="text-white">{displayHigh.toFixed(spec.priceDigits || 4)}</strong></span>
                <span>LOW <strong className="text-white">{displayLow.toFixed(spec.priceDigits || 4)}</strong></span>
                <span className={`font-bold flex items-center gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{displayChange.toFixed(2)}%
                  {isMarketOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block ml-1" />}
                </span>
                <CandleCountdown symbol={selectedSymbol} activeTimeframe={selectedTimeframe} />
              </div>
            </div>

            {/* ============================================================== */}
            {/* INTERACTIVE CHART TOOL OVERLAYS (When Activated from Toolbar)   */}
            {/* ============================================================== */}

            {/* 1. CROSSHAIR INSPECTOR HUD */}
            {isCrosshairActive && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-500/30 text-[10px] font-mono animate-fadeIn">
                <div className="flex items-center gap-3 text-cyan-200 flex-wrap">
                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Crosshair className="w-3 h-3 animate-spin-slow" />
                    <span>CROSSHAIR INSPECTOR ACTIVE</span>
                  </span>
                  <span>CURRENT: <strong className="text-white">${displayPrice.toFixed(spec.priceDigits || 4)}</strong></span>
                  <span>SPREAD: <strong className="text-emerald-400">{(spec.spreadPips || 0.18).toFixed(1)} Pips</strong></span>
                  <span>PRECISION: <strong className="text-cyan-300">{(spec.priceDigits || 4)} Decimals</strong></span>
                  <span>NATIVE ENGINE: <strong className="text-cyan-300">240 FPS Hardware-Sync</strong></span>
                </div>
                <button
                  onClick={() => setIsCrosshairActive(false)}
                  className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/[0.05]"
                  title="Close Crosshair HUD"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 2. RULER & PIP MEASUREMENT HUD */}
            {isRulerActive && (() => {
              const pipUnit = spec.priceDigits === 2 ? 0.1 : spec.priceDigits === 5 ? 0.0001 : 1;
              const dist = Math.abs(rulerEndPrice - rulerStartPrice);
              const pips = pipUnit > 0 ? (dist / pipUnit) : 0;
              const pipVal = spec.pipValue || 10;
              const val001 = (pips * pipVal * 0.01).toFixed(2);
              const val010 = (pips * pipVal * 0.10).toFixed(2);
              const val100 = (pips * pipVal * 1.00).toFixed(2);
              const isProfit = rulerEndPrice >= rulerStartPrice;
              const rrRatio = displayPrice > rulerStartPrice && rulerEndPrice > displayPrice
                ? (Math.abs(rulerEndPrice - displayPrice) / Math.max(0.0001, Math.abs(displayPrice - rulerStartPrice))).toFixed(2)
                : '1:3.00';

              return (
                <div className="p-2.5 bg-[#0a0f1d] border-b border-amber-500/30 text-[10px] font-mono space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Ruler className="w-3.5 h-3.5 text-amber-400" />
                      <span>INSTITUTIONAL PIP & RISK/REWARD RULER</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const pip = spec.priceDigits === 2 ? 0.1 : spec.priceDigits === 5 ? 0.0001 : 1;
                          setRulerStartPrice(Number((displayPrice - 10 * pip).toFixed(spec.priceDigits || 4)));
                          setRulerEndPrice(Number((displayPrice + 30 * pip).toFixed(spec.priceDigits || 4)));
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                      >
                        ⚡ 1:3 Scalp Target ($3 / $9)
                      </button>
                      <button
                        onClick={() => {
                          const pip = spec.priceDigits === 2 ? 0.1 : spec.priceDigits === 5 ? 0.0001 : 1;
                          setRulerStartPrice(Number(displayPrice.toFixed(spec.priceDigits || 4)));
                          setRulerEndPrice(Number((displayPrice + 20 * pip).toFixed(spec.priceDigits || 4)));
                        }}
                        className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-slate-300"
                      >
                        +20 Pips TP
                      </button>
                      <button
                        onClick={() => setIsRulerActive(false)}
                        className="p-1 rounded bg-white/[0.05] text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">START PRICE</span>
                      <input
                        type="number"
                        step={pipUnit}
                        value={rulerStartPrice}
                        onChange={e => setRulerStartPrice(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">TARGET PRICE</span>
                      <input
                        type="number"
                        step={pipUnit}
                        value={rulerEndPrice}
                        onChange={e => setRulerEndPrice(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">DISTANCE</span>
                      <span className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : '-'}{pips.toFixed(1)} PIPS
                      </span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">R:R RATIO</span>
                      <span className="text-xs font-bold text-amber-300">{rrRatio}</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">0.01 LOT VALUE</span>
                      <span className="text-xs font-bold text-emerald-400">${val001} USD</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">0.10 LOT VALUE</span>
                      <span className="text-xs font-bold text-cyan-300">${val010} USD</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. TYPE & SMC ANNOTATION HUD */}
            {isAnnotationActive && (
              <div className="p-2.5 bg-[#140c1e] border-b border-purple-500/30 text-[10px] font-mono space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Type className="w-3.5 h-3.5 text-purple-400" />
                    <span>INSTITUTIONAL CHART ANNOTATIONS & TRADE NOTES</span>
                  </div>
                  <button
                    onClick={() => setIsAnnotationActive(false)}
                    className="p-1 rounded bg-white/[0.05] text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-slate-400 text-[9px]">QUICK TAGS:</span>
                  {[
                    '🎯 BOS (Break of Structure)',
                    '🔄 CHoCH (Change of Character)',
                    '⚡ MSS (Market Structure Shift)',
                    '💧 BSL Swept (Liquidity Raid)',
                    '🩸 SSL Swept (Liquidity Raid)',
                    '📦 FVG Tap (Fair Value Gap)',
                    '🛡️ Order Block 50% Mitigated',
                    '🎯 0.705 OTE Entry',
                  ].map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!chartAnnotations.includes(tag)) {
                          setChartAnnotations(prev => [...prev, tag]);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[9px] font-bold"
                    >
                      + {tag.split(' ')[1]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customAnnotationInput}
                    onChange={e => setCustomAnnotationInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customAnnotationInput.trim()) {
                        setChartAnnotations(prev => [...prev, `📝 ${customAnnotationInput.trim()}`]);
                        setCustomAnnotationInput('');
                      }
                    }}
                    placeholder="Type custom trade note (e.g. Wait for NY 13:00 session sweep)..."
                    className="flex-1 px-2.5 py-1 rounded bg-black/50 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={() => {
                      if (customAnnotationInput.trim()) {
                        setChartAnnotations(prev => [...prev, `📝 ${customAnnotationInput.trim()}`]);
                        setCustomAnnotationInput('');
                      }
                    }}
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Note</span>
                  </button>
                  {chartAnnotations.length > 0 && (
                    <button
                      onClick={() => setChartAnnotations([])}
                      className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs"
                      title="Clear All Annotations"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 4. SMC FIBONACCI EQUILIBRIUM & SESSION GRID OVERLAY */}
            {isGridActive && (() => {
              const rHigh = displayHigh > displayLow ? displayHigh : displayPrice * 1.005;
              const rLow = displayLow < rHigh ? displayLow : displayPrice * 0.995;
              const diff = rHigh - rLow;
              const eq = rLow + diff * 0.5;
              const golden = rLow + diff * 0.382;
              const ote = rLow + diff * 0.295;
              const digits = spec.priceDigits || 4;

              return (
                <div className="px-3 py-2 bg-[#09101d] border-b border-blue-500/30 text-[10px] font-mono animate-fadeIn">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                      <Grid3X3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>SMC 50% FIBONACCI EQUILIBRIUM & INSTITUTIONAL SESSION GRID</span>
                    </div>
                    <button
                      onClick={() => setIsGridActive(false)}
                      className="p-1 rounded bg-white/[0.05] text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                    <div className="bg-rose-500/10 border border-rose-500/30 p-1 rounded">
                      <span className="text-[9px] text-rose-300 block">0.0% SWING HIGH</span>
                      <strong className="text-white text-xs">${rHigh.toFixed(digits)}</strong>
                      <span className="text-[8px] text-rose-400 block uppercase">Premium Zone</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-1 rounded">
                      <span className="text-[9px] text-amber-300 block">50.0% EQUILIBRIUM</span>
                      <strong className="text-amber-200 text-xs">${eq.toFixed(digits)}</strong>
                      <span className="text-[8px] text-amber-400 block uppercase">Fair Value Line</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-1 rounded">
                      <span className="text-[9px] text-emerald-300 block">61.8% GOLDEN POCKET</span>
                      <strong className="text-emerald-300 text-xs">${golden.toFixed(digits)}</strong>
                      <span className="text-[8px] text-emerald-400 block uppercase">Smart Money Entry</span>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 p-1 rounded">
                      <span className="text-[9px] text-cyan-300 block">70.5% ICT OTE</span>
                      <strong className="text-cyan-300 text-xs">${ote.toFixed(digits)}</strong>
                      <span className="text-[8px] text-cyan-400 block uppercase">Optimal Entry</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-1 rounded">
                      <span className="text-[9px] text-emerald-300 block">100.0% SWING LOW</span>
                      <strong className="text-white text-xs">${rLow.toFixed(digits)}</strong>
                      <span className="text-[8px] text-emerald-400 block uppercase">Discount Zone</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 5. VOLUME PROFILE & DELTA FOOTPRINT OVERLAY */}
            {isVolumeOverlayActive && (() => {
              const digits = spec.priceDigits || 4;
              const poc = displayPrice * (isUp ? 0.9985 : 1.0015);
              const vah = displayHigh * 0.999;
              const val = displayLow * 1.001;

              return (
                <div className="px-3 py-2 bg-[#061412] border-b border-emerald-500/30 text-[10px] font-mono animate-fadeIn">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>VOLUME PROFILE (POC / VAH / VAL) & ORDER FLOW DELTA FOOTPRINT</span>
                    </div>
                    <button
                      onClick={() => setIsVolumeOverlayActive(false)}
                      className="p-1 rounded bg-white/[0.05] text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-black/40 p-1.5 rounded border border-emerald-500/20">
                      <span className="text-slate-400 text-[9px] block">POC (POINT OF CONTROL)</span>
                      <span className="text-emerald-400 text-xs font-bold">${poc.toFixed(digits)}</span>
                      <span className="text-[8px] text-slate-500 block">Peak Volume Node</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">VAH (VALUE AREA HIGH 70%)</span>
                      <span className="text-white text-xs font-bold">${vah.toFixed(digits)}</span>
                      <span className="text-[8px] text-slate-500 block">Upper Auction Boundary</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">VAL (VALUE AREA LOW 70%)</span>
                      <span className="text-white text-xs font-bold">${val.toFixed(digits)}</span>
                      <span className="text-[8px] text-slate-500 block">Lower Auction Boundary</span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded border border-white/[0.06]">
                      <span className="text-slate-400 text-[9px] block">ORDER FLOW DELTA</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-emerald-400 font-bold">BUY 58%</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-400 h-full w-[58%]" />
                          <div className="bg-rose-400 h-full w-[42%]" />
                        </div>
                        <span className="text-rose-400 font-bold">42% SELL</span>
                      </div>
                      <span className="text-[8px] text-emerald-400 font-bold block mt-0.5">Bullish Absorption Active</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* PINNED ANNOTATIONS BADGES (Rendered right over chart) */}
            {chartAnnotations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-1 bg-black/60 border-b border-white/[0.04] text-[9px] font-mono">
                <span className="text-slate-500 flex items-center gap-1 font-bold">
                  <Tag className="w-2.5 h-2.5 text-purple-400" />
                  <span>PINNED NOTES:</span>
                </span>
                {chartAnnotations.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => setChartAnnotations(prev => prev.filter((_, i) => i !== idx))}
                      className="hover:text-rose-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Chart Canvas */}
            <div className={`w-full bg-[#070a12] transition-transform duration-500 ease-in-out ${isChartFlipped ? 'scale-y-[-1]' : ''}`}>
              <WidgetErrorBoundary moduleName="Trading Chart" fallbackHeight="min-h-[480px]">
                {chartEngine === 'VORTEX' ? (
                  <VortexWorkspaceWidget
                    symbol={symbolKey}
                    timeframe={selectedTimeframe}
                    onTimeframeChange={setSelectedTimeframe}
                  />
                ) : chartEngine === 'TRADINGVIEW' ? (
                  <TradingViewWidget
                    symbol={symbolKey}
                    timeframe={selectedTimeframe}
                    height={480}
                  />
                ) : (
                  <TradingChart
                    symbol={symbolKey}
                    timeframe={selectedTimeframe}
                    onTimeframeChange={setSelectedTimeframe}
                    candles={candles}
                    currentTick={currentTick}
                    isMarketOpen={isMarketOpen}
                  />
                )}
              </WidgetErrorBoundary>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTTOM ROW: Unified Market Dock (Movers + Calendar + Account)  */}
          {/* ============================================================ */}
          <UnifiedMarketDock
            onSelectSymbol={setSelectedSymbol}
            balance={account.balance}
            todayPnl={account.equity - account.balance}
            todayPnlPercent={((account.equity - account.balance) / account.balance) * 100}
            openTrades={positions.length}
            marginLevel={account.freeMargin > 0 ? (account.equity / (account.equity - account.freeMargin || 1)) * 100 : 0}
            accountLogin={account.login}
            accountServer={account.server}
          />
        </div>

        {/* ============================================================== */}
        {/* RIGHT SIDEBAR (4 cols): Market Watch + Sentiment + News         */}
        {/* ============================================================== */}
        <div className="xl:col-span-4 space-y-2.5">
          {/* Market Watch */}
          <MarketWatchPanel
            activeSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />

          {/* Official 24/7 Live Global News Terminal */}
          <LiveNewsPlayer />

          {/* Latest News */}
          <LatestNewsPanel />

        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. LIVE RUNNING TRADES & HISTORICAL AUDITED PERFORMANCE HUB      */}
      {/* ================================================================ */}
      <WidgetErrorBoundary moduleName="Live Trades Hub">
        <LiveTradesAndAnalyticsHub />
      </WidgetErrorBoundary>

      {/* ================================================================ */}
      {/* MODALS                                                            */}
      {/* ================================================================ */}
      <Mt5ConnectionModal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
      />

      <JarvisModal
        isOpen={isJarvisModalOpen}
        onClose={() => setIsJarvisModalOpen(false)}
        currentContext={{
          symbol: selectedSymbol,
          intelligence: centralIntel,
        }}
      />

      <AiDebateModal
        isOpen={isDebateModalOpen}
        onClose={() => setIsDebateModalOpen(false)}
        symbol={symbolKey}
        currentPrice={displayPrice}
      />

      <TradingViewWebhookModal
        isOpen={isTvWebhookOpen}
        onClose={() => setIsTvWebhookOpen(false)}
        activeSymbol={selectedSymbol}
      />
    </div>
  );
}
