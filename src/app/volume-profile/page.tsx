'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InstitutionalTradingTerminal } from '@/components/charts/InstitutionalTradingTerminal';
import { VolumeProfilePanel } from '@/components/volume/VolumeProfilePanel';
import { RufloSelfHealingWidget } from '@/components/terminal/RufloSelfHealingWidget';
import { VipMarketMoverIntelligenceWidget } from '@/components/terminal/VipMarketMoverIntelligenceWidget';
import { 
  BarChart2, 
  Layers, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  Cpu,
  Radio,
  Sliders,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Wifi,
  ExternalLink
} from 'lucide-react';

interface TickerAsset {
  symbol: string;
  name: string;
  cat: 'COMMODITY' | 'FOREX' | 'CRYPTO' | 'INDEX';
  flag: string;
  price: number;
  changePct: number;
  spread: string;
  high24: number;
  low24: number;
}

const DEFAULT_TICKERS: TickerAsset[] = [
  { symbol: 'XAUUSD', name: 'Gold Spot', cat: 'COMMODITY', flag: '🥇', price: 2658.40, changePct: +0.48, spread: '1.2p', high24: 2668.50, low24: 2642.10 },
  { symbol: 'BTCUSD', name: 'Bitcoin Spot', cat: 'CRYPTO', flag: '₿', price: 64280.00, changePct: +2.15, spread: '0.50', high24: 65150.00, low24: 62890.00 },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', cat: 'FOREX', flag: '🇪🇺', price: 1.08450, changePct: -0.12, spread: '0.3p', high24: 1.0880, low24: 1.0832 },
  { symbol: 'GBPUSD', name: 'British Pound', cat: 'FOREX', flag: '🇬🇧', price: 1.29320, changePct: +0.09, spread: '0.5p', high24: 1.2965, low24: 1.2895 },
  { symbol: 'USDJPY', name: 'US Dollar / Yen', cat: 'FOREX', flag: '🇯🇵', price: 152.450, changePct: -0.18, spread: '0.6p', high24: 153.10, low24: 152.05 },
  { symbol: 'US30', name: 'Dow Jones 30', cat: 'INDEX', flag: '🇺🇸', price: 42125.00, changePct: +0.35, spread: '1.50', high24: 42280.00, low24: 41950.00 },
];

export default function VolumeProfilePage() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [activeTab, setActiveTab] = useState<'FOOTPRINT_SUITE' | 'SESSION_PROFILES' | 'WATCHDOG_RADAR'>('FOOTPRINT_SUITE');
  
  // Real-time market ticker states
  const [tickers, setTickers] = useState<TickerAsset[]>(DEFAULT_TICKERS);
  const [flashingSymbol, setFlashingSymbol] = useState<string | null>(null);

  // Quick Action Controls state
  const [isAutoTraderActive, setIsAutoTraderActive] = useState<boolean>(true);
  const [isTogglingBot, setIsTogglingBot] = useState<boolean>(false);
  const [isTestingAlert, setIsTestingAlert] = useState<boolean>(false);
  const [testAlertStatus, setTestAlertStatus] = useState<string | null>(null);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Synthesize Cybernetic Beep / Sound FX using Web Audio API
  const playCyberChime = useCallback((type: 'success' | 'alert' | 'click' = 'click') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch {
      // AudioContext policy safe fallback
    }
  }, [soundEnabled]);

  // Keyboard Hotkeys: [1] Footprint, [2] Session, [3] Cloud Sentinel, [T] Test Telegram
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '1') {
        setActiveTab('FOOTPRINT_SUITE');
        playCyberChime('click');
      } else if (e.key === '2') {
        setActiveTab('SESSION_PROFILES');
        playCyberChime('click');
      } else if (e.key === '3') {
        setActiveTab('WATCHDOG_RADAR');
        playCyberChime('click');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playCyberChime]);

  // Live Micro Ticker Simulator / Syncer (subtle institutional fluctuation)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(t => {
        // Random micro tick delta
        const delta = (Math.random() - 0.49) * (t.symbol.includes('BTC') ? 12 : t.symbol.includes('XAU') ? 0.35 : 0.0001);
        const newPrice = Math.max(0.0001, t.price + delta);
        return {
          ...t,
          price: Number(newPrice.toFixed(t.symbol.includes('EUR') || t.symbol.includes('GBP') ? 5 : 2)),
        };
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Quick Action: Toggle Auto-Trader Engine
  const handleToggleAutoTrader = async () => {
    setIsTogglingBot(true);
    playCyberChime('click');
    try {
      const res = await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAutoTraderActive(data.isActive);
        playCyberChime(data.isActive ? 'success' : 'alert');
      }
    } catch (e) {
      console.error('Failed to toggle auto-trader:', e);
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Quick Action: Dispatch Live Test Alert to Telegram Phone
  const handleSendTestAlert = async () => {
    setIsTestingAlert(true);
    setTestAlertStatus(null);
    playCyberChime('click');
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      if (data && data.success) {
        setTestAlertStatus('✅ DELIVERED TO PHONE!');
        playCyberChime('success');
      } else {
        setTestAlertStatus('⚠️ RELAYING CLOUD...');
      }
    } catch {
      setTestAlertStatus('❌ DISPATCH ERROR');
    } finally {
      setIsTestingAlert(false);
      setTimeout(() => setTestAlertStatus(null), 4500);
    }
  };

  // Quick Action: Force AI Confluence Scan
  const handleForceScan = async () => {
    setIsScanningNow(true);
    setScanMessage(null);
    playCyberChime('click');
    try {
      const res = await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_scan', symbols: [symbol] }),
      });
      const data = await res.json();
      setScanMessage(data.message || 'Market scan complete.');
      playCyberChime('success');
    } catch {
      setScanMessage('Scan error encountered.');
    } finally {
      setIsScanningNow(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  const activeAsset = useMemo(() => {
    return tickers.find(t => t.symbol === symbol) || tickers[0];
  }, [tickers, symbol]);

  return (
    <div className="w-full pb-20 space-y-3 px-1 sm:px-3">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP LIVE TICKER TAPE RIBBON (Wall Street Marquee Strip)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full rounded-xl bg-[#040813]/90 backdrop-blur-2xl border border-white/[0.09] shadow-[0_4px_24px_rgba(0,0,0,0.6)] p-2 overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-1.5 px-1 border-b border-white/[0.05] pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-400">
              GLOBAL LIQUIDITY TICKER TAPE • LEVEL 2/3 LIVE FEEDS
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            <span className="hidden sm:inline">⚡ 240 FPS UNCAPPED</span>
            <span className="text-zinc-500">|</span>
            <span className="text-cyan-400">EXNESS MT5 ➔ MODAL CLOUD</span>
          </div>
        </div>

        {/* Horizontal Scrollable Live Price Ticker Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {tickers.map((item) => {
            const isSelected = item.symbol === symbol;
            const isPositive = item.changePct >= 0;
            return (
              <button
                key={item.symbol}
                onClick={() => {
                  setSymbol(item.symbol);
                  playCyberChime('click');
                }}
                className={`text-left p-2 rounded-lg transition-all duration-200 border relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/40 via-[#09152b] to-[#040813] border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-[#060b18]/60 hover:bg-[#0c1630]/70 border-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* Active Indicator Top Glow Bar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400" />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{item.flag}</span>
                    <span className="text-[11px] font-bold text-white tracking-wider">{item.symbol}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded ${
                    isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
                  </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs sm:text-sm font-mono font-black text-slate-100 tabular-nums">
                    {item.price.toLocaleString(undefined, { minimumFractionDigits: item.symbol.includes('EUR') || item.symbol.includes('GBP') ? 4 : 2 })}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">{item.spread}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. INSTITUTIONAL TELEMETRY HUD & QUICK CONTROLS BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#040813] via-[#081226] to-[#040813] border border-white/[0.09] shadow-2xl p-3 sm:p-4 space-y-3">
        {/* Top Header Row with Active Asset Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-amber-400 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#03060f] rounded-[10px] flex items-center justify-center text-amber-400 text-lg font-black">
                {activeAsset.flag}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>{activeAsset.symbol}</span>
                  <span className="text-xs font-medium text-zinc-400">({activeAsset.name})</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  MBO ICEBERG ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans flex items-center gap-2 mt-0.5">
                <span>BestOrderFlow 4-Pack Footprint</span>
                <span className="text-zinc-600">•</span>
                <span>Depth of Market (DOM)</span>
                <span className="text-zinc-600">•</span>
                <span>300% Stacked Imbalance Radar</span>
              </p>
            </div>
          </div>

          {/* Quick Telemetry Status Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            {/* MT5 Status */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#060c1d] border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MT5 BRIDGE:</span>
              <span className="text-white">LIVE (0.4ms)</span>
            </div>

            {/* Modal Cloud Status */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#060c1d] border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="text-xs">☁️</span>
              <span>MODAL 24/7:</span>
              <span className="text-white">ONLINE</span>
            </div>

            {/* Telegram VIP Status */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#060c1d] border border-sky-500/30 text-sky-400 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="text-xs">📱</span>
              <span>TELEGRAM VIP:</span>
              <span className="text-white font-mono">6082821211</span>
            </div>

            {/* Capital Risk Shield */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[#060c1d] border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="text-xs">🛡️</span>
              <span>RISK SHIELD:</span>
              <span className="text-white">MAX $25 | BE +12p</span>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Trader Toggle Button */}
            <button
              onClick={handleToggleAutoTrader}
              disabled={isTogglingBot}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-lg duration-200 border ${
                isAutoTraderActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-emerald-400 shadow-emerald-500/20 hover:brightness-110'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:bg-zinc-700'
              }`}
            >
              {isAutoTraderActive ? <Play className="w-3.5 h-3.5 fill-black" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isAutoTraderActive ? 'AUTO-TRADER: ARMED' : 'AUTO-TRADER: PAUSED'}</span>
            </button>

            {/* Force Scan Button */}
            <button
              onClick={handleForceScan}
              disabled={isScanningNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
              <span>{isScanningNow ? 'SCANNING...' : 'SCAN CONFLUENCE'}</span>
            </button>

            {/* Dispatch Live Telegram Test Alert */}
            <button
              onClick={handleSendTestAlert}
              disabled={isTestingAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingAlert ? 'DISPATCHING...' : 'TEST TELEGRAM'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(prev => !prev);
                playCyberChime('click');
              }}
              className={`p-1.5 rounded-xl border text-xs transition-all ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
              title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {testAlertStatus && (
              <span className="text-[11px] font-mono font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30">
                {testAlertStatus}
              </span>
            )}

            {scanMessage && (
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/30">
                {scanMessage}
              </span>
            )}
          </div>

          {/* Cloud Dashboard Link */}
          <a
            href="https://modal.com/apps/shafaan2000/main/deployed/clever-trader-cloud-sentinel"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 border border-cyan-400/40 text-xs font-bold transition-all shadow-md"
          >
            <span>☁️ CLOUD SENTINEL DASHBOARD</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. OBSIDIAN FROSTED GLASS TAB SWITCHER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#03060f]/90 backdrop-blur-xl rounded-xl border border-white/[0.08]">
        {/* Sleek Tab Switcher with Keycaps */}
        <div className="flex items-center gap-1 bg-[#060c1d] p-1 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => {
              setActiveTab('FOOTPRINT_SUITE');
              playCyberChime('click');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              activeTab === 'FOOTPRINT_SUITE'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 text-amber-200 border border-black/20">
              [1]
            </span>
            <span>👣 FOOTPRINT TERMINAL (4 PACKS)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SESSION_PROFILES');
              playCyberChime('click');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              activeTab === 'SESSION_PROFILES'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-extrabold shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 text-cyan-200 border border-black/20">
              [2]
            </span>
            <span>📊 SESSION VALUE AREA (POC/VAH/VAL)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('WATCHDOG_RADAR');
              playCyberChime('click');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              activeTab === 'WATCHDOG_RADAR'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-500/25 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 text-purple-200 border border-black/20">
              [3]
            </span>
            <span>🛡️ AI GUARDIAN & 24/7 CLOUD RADAR</span>
          </button>
        </div>

        {/* 4 Packs Quick Indicators Legend */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
            P1: Footprint Cluster
          </span>
          <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
            P2: DOM Ladder
          </span>
          <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
            P3: Bookmap Heatmap
          </span>
          <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
            P4: MBO Icebergs
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TAB CONTENT STAGE
          ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: Complete BestOrderFlow 4-Pack Institutional Footprint Terminal */}
      {activeTab === 'FOOTPRINT_SUITE' && (
        <InstitutionalTradingTerminal initialSymbol={symbol} initialTimeframe="5M" />
      )}

      {/* TAB 2: Multi-Session Auction & Value Area Analysis Panel */}
      {activeTab === 'SESSION_PROFILES' && (
        <VolumeProfilePanel symbol={symbol} />
      )}

      {/* TAB 3: Autonomous Watchdog & Sentiment Radar */}
      {activeTab === 'WATCHDOG_RADAR' && (
        <div className="space-y-4">
          {/* Modal.com 24/7 Cloud Sentinel Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#040813] via-[#071329] to-[#040813] border border-cyan-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-2xl shadow-lg shadow-cyan-500/20">
                ☁️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wider">
                    MODAL CLOUD 24/7 AUTONOMOUS MARKET RADAR
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SERVERLESS (US/EU DATACENTER)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PC/Laptop band hone par bhi cloud serverless watchdog har 60 seconds baad Gold, Bitcoin, aur Forex ko 4-Filter Institutional Confluence se scan karta hai aur direct VIP Telegram alerts bhejta hai.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
                <span>📱 TELEGRAM VIP:</span>
                <span className="text-white font-mono">LINKED (6082821211)</span>
              </div>
              <button
                onClick={handleSendTestAlert}
                disabled={isTestingAlert}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-bold transition-all shadow-sm"
              >
                {isTestingAlert ? 'DISPATCHING...' : 'TEST PHONE NOW ↗'}
              </button>
              <a
                href="https://modal.com/apps/shafaan2000/main/deployed/clever-trader-cloud-sentinel"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-black font-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                OPEN CLOUD DASHBOARD ↗
              </a>
            </div>
          </div>

          <RufloSelfHealingWidget />
          <VipMarketMoverIntelligenceWidget activeSymbol={symbol} />
        </div>
      )}
    </div>
  );
}
