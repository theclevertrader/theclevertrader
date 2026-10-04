'use client';

import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Clock,
  Zap,
  Target,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { JudasSwingData } from '@/lib/engines/judas-swing-engine';

interface AsianJudasDetectorWidgetProps {
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
}

export const AsianJudasDetectorWidget: React.FC<AsianJudasDetectorWidgetProps> = ({
  selectedSymbol: propSymbol,
  onSelectSymbol,
  className = '',
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(propSymbol || 'XAUUSD');
  const [judasData, setJudasData] = useState<JudasSwingData | null>(null);
  const [allPairs, setAllPairs] = useState<JudasSwingData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');

  const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];

  const fetchJudasData = async (symbolToFetch: string) => {
    try {
      const res = await fetch(`/api/judas-swing?symbol=${symbolToFetch}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'OK') {
        setJudasData(data.judas);
        setAllPairs(data.allPairs || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Failed to fetch Judas Swing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propSymbol && propSymbol !== activeSymbol) {
      setActiveSymbol(propSymbol);
    }
  }, [propSymbol]);

  useEffect(() => {
    void fetchJudasData(activeSymbol);
    const interval = setInterval(() => {
      void fetchJudasData(activeSymbol);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // Update UTC clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().substring(11, 19) + ' UTC'
      );
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSelect = (sym: string) => {
    setActiveSymbol(sym);
    setIsLoading(true);
    onSelectSymbol?.(sym);
    void fetchJudasData(sym);
  };

  const isBearishJudas = judasData?.judasStatus === 'BEARISH_JUDAS_SWING';
  const isBullishJudas = judasData?.judasStatus === 'BULLISH_JUDAS_SWING';
  const hasJudas = judasData?.hasJudasTrigger;

  return (
    <div className={`space-y-4 font-sans text-slate-100 ${className}`}>

      {/* ================================================================ */}
      {/* 1. HEADER: Session Timing & Symbol Selectors                     */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0a0f1e] via-[#0d152a] to-[#0a0f1e] border border-indigo-500/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Moon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-mono tracking-wide text-white uppercase">
                ASIAN RANGE BOX & MIDNIGHT OPEN (JUDAS SWING DETECTOR)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ICT LIQUIDITY RAID
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Tokyo Consolidation Range (00:00-06:00 UTC) • 00:00 Midnight True Day Open • London/NY Trap Scanner
            </p>
          </div>
        </div>

        {/* UTC Clock & Active Session Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black text-amber-300">{utcTime || '00:00:00 UTC'}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className={`px-2 py-0.5 rounded border ${
              judasData?.sessionState === 'ASIAN_SESSION'
                ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/50 font-bold'
                : 'bg-white/[0.04] text-slate-500 border-white/[0.04]'
            }`}>
              TOKYO
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              judasData?.sessionState === 'LONDON_KILLZONE'
                ? 'bg-amber-500/30 text-amber-200 border-amber-500/50 font-bold animate-pulse'
                : 'bg-white/[0.04] text-slate-500 border-white/[0.04]'
            }`}>
              LONDON
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              judasData?.sessionState === 'NY_KILLZONE'
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50 font-bold animate-pulse'
                : 'bg-white/[0.04] text-slate-500 border-white/[0.04]'
            }`}>
              NEW YORK
            </span>
          </div>
        </div>
      </div>

      {/* Symbol Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {symbols.map(sym => {
          const isSelected = sym === activeSymbol;
          const pairData = allPairs.find(p => p.symbol === sym);
          const hasPairJudas = pairData?.hasJudasTrigger;

          return (
            <button
              key={sym}
              onClick={() => handleSelect(sym)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-black/40 text-slate-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <span>{sym}</span>
              {hasPairJudas && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Active Judas Swing!" />
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* 2. MASTER GLOWING ALERT BANNER: Active Judas Swing Callout       */}
      {/* ================================================================ */}
      {judasData && (
        <div className={`p-4 rounded-2xl border-2 transition-all shadow-2xl relative overflow-hidden ${
          isBearishJudas
            ? 'bg-gradient-to-r from-[#2a0815] via-[#1a070f] to-[#2a0815] border-rose-500/80 shadow-rose-950/50'
            : isBullishJudas
            ? 'bg-gradient-to-r from-[#082a17] via-[#071a10] to-[#082a17] border-emerald-500/80 shadow-emerald-950/50'
            : 'bg-gradient-to-r from-[#0c1222] via-[#090e18] to-[#0c1222] border-indigo-500/40 shadow-indigo-950/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isBearishJudas
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : isBullishJudas
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
              }`}>
                {hasJudas ? <Zap className="w-6 h-6 animate-bounce" /> : <Moon className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm sm:text-base font-black font-mono tracking-wider ${
                    isBearishJudas ? 'text-rose-300' : isBullishJudas ? 'text-emerald-300' : 'text-indigo-200'
                  }`}>
                    {isBearishJudas
                      ? '⚡ BEARISH JUDAS SWING: BULL TRAP TRIGGERED!'
                      : isBullishJudas
                      ? '⚡ BULLISH JUDAS SWING: BEAR TRAP TRIGGERED!'
                      : '🛡️ CONSOLIDATING INSIDE ASIAN RANGE (AWAITING SWEEP)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                    hasJudas ? 'bg-amber-500 text-black animate-pulse' : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {hasJudas ? 'HIGH PROBABILITY ENTRY' : 'MONITORING'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-mono mt-1 leading-relaxed">
                  {judasData.commentaryUrdu}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {judasData.commentaryEn}
                </p>
              </div>
            </div>

            {/* Recommended Target HUD (if Judas triggered) */}
            {judasData.recommendedSetup && (
              <div className="w-full sm:w-auto p-3 rounded-xl bg-black/60 border border-white/[0.1] font-mono text-xs shrink-0">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between gap-2 border-b border-white/[0.08] pb-1 mb-1.5">
                  <span>Smart Money Order</span>
                  <span className={judasData.recommendedSetup.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                    {judasData.recommendedSetup.direction} (1:{judasData.recommendedSetup.rrRatio} R:R)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[9px] block">ENTRY</span>
                    <strong className="text-white">{judasData.recommendedSetup.entryPrice}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">STOP LOSS</span>
                    <strong className="text-rose-400">{judasData.recommendedSetup.stopLoss}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">TARGET (TP)</span>
                    <strong className="text-emerald-400">{judasData.recommendedSetup.takeProfit}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. 3-CARD HUD: [Asian Range Box] | [Midnight Open] | [Setup]      */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Asian Range Box Details */}
        <div className="p-4 rounded-xl bg-[#090e1a] border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-white/[0.06] pb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-indigo-300">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Tokyo / Asian Range
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
              judasData?.asianRange.isTightRange
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {judasData?.asianRange.isTightRange ? 'TIGHT CONSOLIDATION 🟢' : 'WIDE RANGE 🟡'}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block uppercase">Asian High (AH)</span>
              <strong className="text-base font-black text-indigo-300 block mt-0.5">
                {judasData?.asianRange.asianHigh.toFixed(2) || '0.00'}
              </strong>
              <span className="text-[9px] text-slate-500">Buy-Side Liquidity (BSL)</span>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block uppercase">Asian Low (AL)</span>
              <strong className="text-base font-black text-indigo-300 block mt-0.5">
                {judasData?.asianRange.asianLow.toFixed(2) || '0.00'}
              </strong>
              <span className="text-[9px] text-slate-500">Sell-Side Liquidity (SSL)</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-2">
            <span>Range Width: <strong className="text-white">{judasData?.asianRange.rangePips || 0} pips</strong></span>
            <span>Session: <strong>00:00 - 06:00 UTC</strong></span>
          </div>
        </div>

        {/* Card 2: 00:00 UTC Midnight Open (True Day Open) */}
        <div className="p-4 rounded-xl bg-[#090e1a] border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-white/[0.06] pb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-amber-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              00:00 Midnight Open
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
              judasData?.isAboveMidnightOpen
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {judasData?.isAboveMidnightOpen ? 'PREMIUM (LOOK FOR SHORTS) 🔴' : 'DISCOUNT (LOOK FOR LONGS) 🟢'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">True Day Open Price</span>
              <span className="text-2xl font-black text-amber-300">
                ${judasData?.midnightOpenPrice.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Distance from Open</span>
              <span className="text-sm font-black text-white">
                {judasData?.midnightOpenDistancePips || 0} pips
              </span>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] font-mono text-slate-300">
            {judasData?.isAboveMidnightOpen ? (
              <span className="text-amber-200">
                ★ Price is trading <strong>ABOVE Midnight Open</strong>. In ICT doctrine, look for Judas rallies to sell into at discount.
              </span>
            ) : (
              <span className="text-cyan-200">
                ★ Price is trading <strong>BELOW Midnight Open</strong>. In ICT doctrine, look for Judas drops to buy into at discount.
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Judas Sweep Liquidity Metrics */}
        <div className="p-4 rounded-xl bg-[#090e1a] border border-cyan-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-white/[0.06] pb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-cyan-300">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Judas Sweep Trigger
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              LONDON OPEN FAKEOUT
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Judas State:</span>
              <strong className={
                isBearishJudas ? 'text-rose-400 font-black' : isBullishJudas ? 'text-emerald-400 font-black' : 'text-slate-300'
              }>
                {judasData?.judasStatus.replace(/_/g, ' ') || 'CALCULATING'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Swept Boundary:</span>
              <span className="text-white font-bold">
                {judasData?.sweptBoundary || 'NONE (INSIDE)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sweep High/Low Price:</span>
              <span className="text-amber-300 font-bold">
                {judasData?.sweepPrice ? `$${judasData.sweepPrice.toFixed(2)}` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
              <span className="text-slate-400">Chart Overlay Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-Plotted on Chart
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. MULTI-PAIR JUDAS SCANNER TABLE (All 7 Instruments)            */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#090e18] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08] bg-[#070b12]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black font-mono uppercase tracking-wider text-white">
              INSTITUTIONAL MULTI-PAIR ASIAN & JUDAS SWEEP SCANNER
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Last Sync: {lastSyncTime || 'LIVE'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] text-slate-400 uppercase">
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-3">Live Price</th>
                <th className="py-2.5 px-3">Asian High (AH)</th>
                <th className="py-2.5 px-3">Asian Low (AL)</th>
                <th className="py-2.5 px-3">Range Width</th>
                <th className="py-2.5 px-3">00:00 Midnight Open</th>
                <th className="py-2.5 px-4 text-right">Judas Swing Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {allPairs.map(p => {
                const isSelected = p.symbol === activeSymbol;
                const isPBearish = p.judasStatus === 'BEARISH_JUDAS_SWING';
                const isPBullish = p.judasStatus === 'BULLISH_JUDAS_SWING';

                return (
                  <tr
                    key={p.symbol}
                    onClick={() => handleSelect(p.symbol)}
                    className={`transition-colors cursor-pointer hover:bg-white/[0.04] ${
                      isSelected ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white">{p.symbol}</span>
                        {p.hasJudasTrigger && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-white font-bold">
                      ${p.currentPrice.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-indigo-300">
                      ${p.asianRange.asianHigh.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-indigo-300">
                      ${p.asianRange.asianLow.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.asianRange.isTightRange
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.asianRange.rangePips} pips
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-amber-300">
                      ${p.midnightOpenPrice.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      {isPBearish ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-black text-[10px] animate-pulse">
                          ⚡ BEARISH JUDAS (SELL)
                        </span>
                      ) : isPBullish ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-[10px] animate-pulse">
                          ⚡ BULLISH JUDAS (BUY)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px]">
                          {p.judasStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
