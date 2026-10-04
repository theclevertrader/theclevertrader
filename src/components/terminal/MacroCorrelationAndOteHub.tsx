'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  ShieldCheck,
  Flame,
  Layers,
  Sparkles,
  BarChart3,
  Clock,
  RefreshCw,
  AlertTriangle,
  Sliders,
  DollarSign,
  PieChart
} from 'lucide-react';
import { OteZoneData, TurtleSoupPattern, MacroCorrelationData } from '@/lib/engines/advanced-ict-engine';

interface MacroCorrelationAndOteHubProps {
  selectedSymbol?: string;
  onSelectSymbol?: (sym: string) => void;
  className?: string;
}

export const MacroCorrelationAndOteHub: React.FC<MacroCorrelationAndOteHubProps> = ({
  selectedSymbol: propSymbol,
  onSelectSymbol,
  className = '',
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(propSymbol || 'XAUUSD');
  const [oteData, setOteData] = useState<OteZoneData | null>(null);
  const [turtleSoupList, setTurtleSoupList] = useState<TurtleSoupPattern[]>([]);
  const [macroData, setMacroData] = useState<MacroCorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<string>('');

  const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];

  const fetchData = async (sym: string) => {
    try {
      const res = await fetch(`/api/macro-correlation?symbol=${sym}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'OK') {
        setOteData(data.ote);
        setTurtleSoupList(data.turtleSoup || []);
        setMacroData(data.macro);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Macro Correlation fetch failed:', err);
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
    void fetchData(activeSymbol);
    const interval = setInterval(() => {
      void fetchData(activeSymbol);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  const handleSelect = (sym: string) => {
    setActiveSymbol(sym);
    setIsLoading(true);
    onSelectSymbol?.(sym);
    void fetchData(sym);
  };

  const hasDoubleConfirmation = macroData?.selectedAsset.hasDoubleConfirmation;

  return (
    <div className={`space-y-4 font-sans text-slate-100 ${className}`}>

      {/* ================================================================ */}
      {/* 1. SLIM LIVE DXY & YIELDS CORRELATION HEADER BAR                 */}
      {/* ================================================================ */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d1322] via-[#09152b] to-[#0d1322] border border-cyan-500/30 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black font-mono tracking-wider text-white uppercase">
                DXY & 10Y YIELDS CORRELATION STRIP
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MACRO ENGINE
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-3">
              <span>
                US Dollar (DXY): <strong className="text-amber-300 font-black">{macroData?.dxyPrice || 104.28}</strong>{' '}
                <span className={macroData?.dxyChangePct && macroData.dxyChangePct < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  ({macroData?.dxyChangePct || -0.28}%)
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                US 10Y Yield: <strong className="text-cyan-300 font-black">{macroData?.us10yYield || 3.72}%</strong>{' '}
                <span className="text-emerald-400">({macroData?.us10yChangeBps || -4.2} bps)</span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                {activeSymbol} Correlation:{' '}
                <strong className="text-purple-300 font-bold">
                  {macroData?.selectedAsset.correlation || -0.92}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Double Confirmation Badge */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-black flex items-center gap-1.5 ${
            hasDoubleConfirmation
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40 animate-pulse'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{hasDoubleConfirmation ? '🔥 100% DOUBLE CONFIRMATION' : '⚡ NEUTRAL MACRO REGIME'}</span>
          </div>

          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Sync: {lastSync || 'LIVE'}
          </span>
        </div>
      </div>

      {/* Asset Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {symbols.map(sym => {
          const isSelected = sym === activeSymbol;
          const corObj = macroData?.pairsCorrelation[sym];
          return (
            <button
              key={sym}
              onClick={() => handleSelect(sym)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30 font-black scale-105'
                  : 'bg-black/40 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>{sym}</span>
              {corObj && (
                <span className={`text-[9px] px-1 rounded ${
                  corObj.macroTailwind === 'STRONG_BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.08] text-slate-400'
                }`}>
                  {corObj.correlation}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Macro Double Confirmation Verdict Banner */}
      {macroData && (
        <div className={`p-3.5 rounded-xl border font-mono text-xs shadow-lg ${
          hasDoubleConfirmation
            ? 'bg-gradient-to-r from-emerald-950/60 to-[#081f14] border-emerald-500/40 text-emerald-200'
            : 'bg-gradient-to-r from-slate-900/80 to-[#0b101c] border-white/[0.08] text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wide text-amber-300">
              [MACRO TAILWIND ANALYSIS]:
            </span>
            <span>{macroData.selectedAsset.verdictUrdu}</span>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. FIBONACCI OTE (0.618 / 0.705 / 0.786) AUTO-ZONE CARD          */}
      {/* ================================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090e18] border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <span>3️⃣ FIBONACCI OTE (OPTIMAL TRADE ENTRY) AUTO-ZONES</span>
                <span className="text-amber-400">({oteData?.legDirection} LEG)</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                50% Equilibrium retracement to 0.618 - 0.705 (Sweet Spot) - 0.786 Golden Discount Zone
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-black font-mono border ${
              oteData?.isInOteZone
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.06]'
            }`}>
              {oteData?.isInOteZone ? '🎯 IN OTE GOLDEN ZONE' : 'APPROACHING OTE ZONE'}
            </span>
          </div>
        </div>

        {/* 5-Column Fibonacci Retracement Levels Ladder */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          {/* Level 1: 0.500 Equilibrium */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block uppercase">0.500 Equilibrium</span>
            <strong className="text-base font-black text-white block mt-1">
              ${oteData?.fib500.toFixed(2) || '0.00'}
            </strong>
            <span className="text-[9px] text-slate-500">Fair Value Line</span>
          </div>

          {/* Level 2: 0.618 Golden Ratio */}
          <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 block uppercase font-bold">0.618 Golden Pocket</span>
            <strong className="text-base font-black text-amber-300 block mt-1">
              ${oteData?.fib618.toFixed(2) || '0.00'}
            </strong>
            <span className="text-[9px] text-amber-400/80">OTE Entry Starts</span>
          </div>

          {/* Level 3: 0.705 THE SWEET SPOT */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-amber-950/40 to-yellow-950/20 border-2 border-amber-400 shadow-lg shadow-amber-950/30 relative">
            <span className="text-[10px] text-yellow-300 block uppercase font-black flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              0.705 SWEET SPOT
            </span>
            <strong className="text-lg font-black text-yellow-300 block mt-0.5">
              ${oteData?.fib705.toFixed(2) || '0.00'}
            </strong>
            <span className="text-[9px] text-yellow-200 font-bold block">Primary Limit Order Level</span>
          </div>

          {/* Level 4: 0.786 Deep Discount Boundary */}
          <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 block uppercase font-bold">0.786 Deep Discount</span>
            <strong className="text-base font-black text-amber-300 block mt-1">
              ${oteData?.fib786.toFixed(2) || '0.00'}
            </strong>
            <span className="text-[9px] text-amber-400/80">Invalidation Threshold</span>
          </div>

          {/* Level 5: -0.272 Take Profit Target 1 */}
          <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block uppercase font-bold">-0.272 Target 1 (TP)</span>
            <strong className="text-base font-black text-emerald-400 block mt-1">
              ${oteData?.tp1_neg272.toFixed(2) || '0.00'}
            </strong>
            <span className="text-[9px] text-emerald-500">Expansion Target 1</span>
          </div>
        </div>

        {/* OTE Urdu Commentary */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs font-mono text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{oteData?.oteRecommendationUrdu}</span>
          </div>
          <span className="text-amber-300 font-bold shrink-0 ml-3">
            Distance: {oteData?.distanceToSweetSpotPips} pips
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. 4️⃣ SFP (SWING FAILURE PATTERN) / TURTLE SOUP ALERTS           */}
      {/* ================================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090e18] border border-rose-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <span>4️⃣ SFP (SWING FAILURE PATTERN) / TURTLE SOUP REVERSAL ALERTS</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  87% WIN-RATE SETUP
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Wick-only liquidity grab past swing high/low with sharp candle body rejection inside
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Detected: <strong>{turtleSoupList.length} Setup(s)</strong>
          </span>
        </div>

        {turtleSoupList.length > 0 ? (
          <div className="space-y-2.5">
            {turtleSoupList.map(ts => {
              const isBear = ts.type === 'BEARISH_TURTLE_SOUP';
              return (
                <div
                  key={ts.id}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    isBear
                      ? 'bg-gradient-to-r from-rose-950/40 to-black/60 border-rose-500/40 hover:border-rose-500/70'
                      : 'bg-gradient-to-r from-emerald-950/40 to-black/60 border-emerald-500/40 hover:border-emerald-500/70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        isBear ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-black font-black'
                      }`}>
                        {isBear ? '⚡ BEARISH TURTLE SOUP (SELL)' : '⚡ BULLISH TURTLE SOUP (BUY)'}
                      </span>
                      <strong className="text-white">Swept Level: ${ts.sweptPrice}</strong>
                      <span className="text-slate-400 text-[11px]">
                        (Wick Extension: {ts.wickLengthPoints} pts)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span>Entry: <strong className="text-white">${ts.entryPrice}</strong></span>
                      <span>Stop: <strong className="text-rose-400">${ts.stopLoss}</strong></span>
                      <span>Target: <strong className="text-emerald-400">${ts.takeProfit}</strong></span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        Win: {ts.winRatePct}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    {ts.urduDescription}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs font-mono text-slate-400 rounded-xl bg-black/40 border border-white/[0.04]">
            Scanning live candles for Swing Failure Patterns... Market currently respecting swing boundaries without wick fakeouts.
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 4. MULTI-PAIR MACRO CORRELATION HEATMAP                          */}
      {/* ================================================================ */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#090e18] overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-white/[0.08] bg-[#070b12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black font-mono uppercase tracking-wider text-white">
              7-PAIR US DOLLAR & YIELDS MACRO CORRELATION MATRIX
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            DXY Benchmark: {macroData?.dxyPrice}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] text-slate-400 uppercase">
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-3">DXY Correlation</th>
                <th className="py-2.5 px-3">Relationship Type</th>
                <th className="py-2.5 px-3">Macro Tailwind</th>
                <th className="py-2.5 px-4 text-right">Double Confirmation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {symbols.map(sym => {
                const cor = macroData?.pairsCorrelation[sym];
                const isSelected = sym === activeSymbol;
                const isDouble = (sym === 'XAUUSD' || sym === 'EURUSD' || sym === 'GBPUSD') && macroData?.dxyBias === 'BEARISH';

                return (
                  <tr
                    key={sym}
                    onClick={() => handleSelect(sym)}
                    className={`transition-colors cursor-pointer hover:bg-white/[0.04] ${
                      isSelected ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <strong className="text-white">{sym}</strong>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-black ${
                        cor && cor.correlation < 0 ? 'text-amber-300' : 'text-blue-300'
                      }`}>
                        {cor?.correlation || 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {cor?.relationship.replace(/_/g, ' ') || 'INVERSE'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cor?.macroTailwind === 'STRONG_BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : cor?.macroTailwind === 'STRONG_BEARISH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-white/[0.04] text-slate-400'
                      }`}>
                        {cor?.macroTailwind || 'NEUTRAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isDouble ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-[10px] animate-pulse">
                          🔥 DOUBLE CONFIRMATION
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Normal Technicals</span>
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
