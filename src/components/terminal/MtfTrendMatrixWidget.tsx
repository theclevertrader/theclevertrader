'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  Target,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Flame,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';
import { MtfPairAlignment } from '@/lib/engines/mtf-matrix-engine';

interface MtfTrendMatrixWidgetProps {
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
}

export const MtfTrendMatrixWidget: React.FC<MtfTrendMatrixWidgetProps> = ({
  selectedSymbol: propSymbol,
  onSelectSymbol,
  className = '',
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(propSymbol || 'XAUUSD');
  const [matrixData, setMatrixData] = useState<MtfPairAlignment | null>(null);
  const [allPairs, setAllPairs] = useState<MtfPairAlignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastTickTime, setLastTickTime] = useState<string>('');

  const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30'];

  const fetchMatrix = async (symbolToFetch: string) => {
    try {
      const res = await fetch(`/api/mtf-matrix?symbol=${symbolToFetch}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'OK') {
        setMatrixData(data.matrix);
        setAllPairs(data.allPairs || []);
        setLastTickTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Failed to load MTF Matrix:', err);
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
    void fetchMatrix(activeSymbol);
    const interval = setInterval(() => {
      void fetchMatrix(activeSymbol);
    }, 4000); // 4s auto refresh
    return () => clearInterval(interval);
  }, [activeSymbol]);

  const handlePairSelect = (sym: string) => {
    setActiveSymbol(sym);
    if (onSelectSymbol) {
      onSelectSymbol(sym);
    }
  };

  const isQuad = matrixData?.isQuadScreenConfluence;
  const isTriple = matrixData?.isTripleScreenConfluence;
  const isBull = matrixData?.overallBias.includes('BULLISH');
  const isBear = matrixData?.overallBias.includes('BEARISH');

  return (
    <div className={`w-full rounded-2xl bg-gradient-to-br from-[#090d16] via-[#0b1220] to-[#070a12] border border-cyan-500/25 p-4 sm:p-5 shadow-2xl relative overflow-hidden font-mono ${className}`}>
      
      {/* Ambient background glow */}
      <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
        isBull ? 'bg-emerald-500' : isBear ? 'bg-rose-500' : 'bg-cyan-500'
      }`} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wider uppercase">
                Multi-Timeframe Trend Matrix (MTF)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-sm">
                TRIPLE-SCREEN ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              4H Macro Bias • 1H Market Structure • 15M SMC Discount/Premium Zone • 5M Entry Trigger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Updated: {lastTickTime || 'Live'}</span>
          </div>
          <button
            onClick={() => fetchMatrix(activeSymbol)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all active:scale-95"
            title="Refresh Matrix Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Symbol Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-white/[0.04]">
        {symbols.map(sym => {
          const isSelected = sym === activeSymbol;
          const pairObj = allPairs.find(p => p.symbol === sym);
          const score = pairObj?.confluenceScore || 0;
          const pairTriple = pairObj?.isTripleScreenConfluence;
          const pairBull = pairObj?.overallBias.includes('BULLISH');

          return (
            <button
              key={sym}
              onClick={() => handlePairSelect(sym)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105 border border-cyan-400/40'
                  : 'bg-black/40 hover:bg-white/[0.06] text-slate-300 border border-white/[0.06]'
              }`}
            >
              <span>{sym}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                isSelected
                  ? 'bg-black/40 text-white'
                  : pairTriple
                    ? pairBull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    : 'bg-white/[0.06] text-slate-400'
              }`}>
                {score}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Master Confluence Banner */}
      {matrixData && (
        <div className="mt-3 relative z-10">
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl ${
            isQuad
              ? 'bg-gradient-to-r from-cyan-950/80 via-blue-950/90 to-cyan-950/80 border-cyan-400 shadow-cyan-900/40 animate-pulse'
              : isTriple
                ? isBull
                  ? 'bg-gradient-to-r from-emerald-950/70 via-teal-950/80 to-emerald-950/70 border-emerald-500/60 shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-rose-950/70 via-red-950/80 to-rose-950/70 border-rose-500/60 shadow-rose-900/30'
                : 'bg-black/50 border-amber-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isQuad
                  ? 'bg-cyan-500 text-black animate-bounce'
                  : isTriple
                    ? isBull ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isQuad ? <Flame className="w-5 h-5 text-cyan-950 fill-cyan-950" /> : isTriple ? <Sparkles className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white uppercase tracking-wide">
                    {matrixData.symbol} — {matrixData.overallBias.replace('_', ' ')}
                  </span>
                  {isQuad && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-400 text-black uppercase animate-pulse">
                      🔥 100% QUAD-SCREEN CONFLUENCE
                    </span>
                  )}
                  {isTriple && !isQuad && (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      isBull ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                    }`}>
                      ✅ 100% TRIPLE-SCREEN ALIGNED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-200 mt-0.5 font-sans leading-relaxed">
                  {matrixData.recommendationUrdu}
                </p>
              </div>
            </div>

            {/* Confluence Rating Gauge */}
            <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-white/[0.08] pt-2 sm:pt-0 shrink-0">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black font-mono ${
                  matrixData.confluenceScore >= 85 ? 'text-emerald-400' : matrixData.confluenceScore >= 70 ? 'text-cyan-300' : 'text-amber-400'
                }`}>
                  {matrixData.confluenceScore}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Confluence</span>
              </div>
              <div className="w-24 bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    matrixData.confluenceScore >= 85 ? 'bg-emerald-400 shadow-emerald-500/50 shadow-sm' : matrixData.confluenceScore >= 70 ? 'bg-cyan-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${matrixData.confluenceScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4-CARD MULTI-TIMEFRAME HUD */}
      {matrixData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5 relative z-10">
          
          {/* Card 1: 4H Macro Trend */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-black/60 to-black/30 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-300">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  1. 4H Macro Trend
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  matrixData.timeframes['4H'].bias === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {matrixData.timeframes['4H'].bias === 'BULLISH' ? '🟢 BULLISH' : '🔴 BEARISH'}
                </span>
              </div>
              <div className="text-xs font-bold text-white leading-snug">
                {matrixData.timeframes['4H'].structure}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
              <span>EMA 200: <strong className="text-slate-200">{matrixData.timeframes['4H'].detail.ema200}</strong></span>
              <span>Weight: <strong className="text-cyan-300">{matrixData.timeframes['4H'].confluencePoints}/25</strong></span>
            </div>
          </div>

          {/* Card 2: 1H Market Structure */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-black/60 to-black/30 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-300">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  2. 1H Structure
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  matrixData.timeframes['1H'].bias === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {matrixData.timeframes['1H'].bias === 'BULLISH' ? '🟢 BOS HIGH' : '🔴 CHOCH BREAK'}
                </span>
              </div>
              <div className="text-xs font-bold text-white leading-snug">
                {matrixData.timeframes['1H'].structure}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
              <span>Framework: <strong className="text-slate-200">SMC Swings</strong></span>
              <span>Weight: <strong className="text-blue-300">{matrixData.timeframes['1H'].confluencePoints}/25</strong></span>
            </div>
          </div>

          {/* Card 3: 15M SMC / FVG Zone */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-black/60 to-black/30 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-300">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  3. 15M SMC Zone
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  matrixData.timeframes['15M'].detail.zone === 'DISCOUNT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {matrixData.timeframes['15M'].detail.zone === 'DISCOUNT' ? '🛒 DISCOUNT' : '💎 PREMIUM'}
                </span>
              </div>
              <div className="text-xs font-bold text-white leading-snug">
                {matrixData.timeframes['15M'].structure}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
              <span>FVG: <strong className="text-slate-200">{matrixData.timeframes['15M'].detail.fvgStatus}</strong></span>
              <span>Weight: <strong className="text-purple-300">{matrixData.timeframes['15M'].confluencePoints}/25</strong></span>
            </div>
          </div>

          {/* Card 4: 5M Execution Trigger */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-black/60 to-black/30 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  4. 5M Entry Trigger
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  matrixData.timeframes['5M'].bias === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {matrixData.timeframes['5M'].bias === 'BULLISH' ? '⚡ MSS LONG' : '⚡ MSS SHORT'}
                </span>
              </div>
              <div className="text-xs font-bold text-white leading-snug">
                {matrixData.timeframes['5M'].structure}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
              <span>Timing: <strong className="text-emerald-400">Armed ✅</strong></span>
              <span>Weight: <strong className="text-amber-300">{matrixData.timeframes['5M'].confluencePoints}/25</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* MULTI-PAIR HEATMAP TABLE */}
      {allPairs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Institutional Pair MTF Heatmap Table
            </span>
            <span className="text-[10px] text-cyan-300">Click row to inspect details</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#070b14] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Live Price</th>
                  <th className="py-2 px-3 text-center">4H Macro</th>
                  <th className="py-2 px-3 text-center">1H Structure</th>
                  <th className="py-2 px-3 text-center">15M SMC Zone</th>
                  <th className="py-2 px-3 text-center">5M Trigger</th>
                  <th className="py-2 px-3 text-right">Triple-Screen Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {allPairs.map(p => {
                  const isCurrent = p.symbol === activeSymbol;
                  const isPQuad = p.isQuadScreenConfluence;
                  const isPTriple = p.isTripleScreenConfluence;
                  const isPBull = p.overallBias.includes('BULLISH');

                  return (
                    <tr
                      key={p.symbol}
                      onClick={() => handlePairSelect(p.symbol)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPQuad ? 'bg-cyan-400 animate-ping' : isPTriple ? (isPBull ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-slate-600'
                        }`} />
                        <span>{p.symbol}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 font-mono">
                        {p.currentPrice.toLocaleString('en-US')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          p.timeframes['4H'].bias === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {p.timeframes['4H'].bias}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          p.timeframes['1H'].bias === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {p.timeframes['1H'].bias}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          p.timeframes['15M'].detail.zone === 'DISCOUNT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {p.timeframes['15M'].detail.zone}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          p.timeframes['5M'].bias === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {p.timeframes['5M'].bias}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          <span className={
                            p.confluenceScore >= 85 ? 'text-emerald-400' : p.confluenceScore >= 70 ? 'text-cyan-300' : 'text-amber-400'
                          }>
                            {p.confluenceScore}%
                          </span>
                          {isPQuad && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-400 text-black font-black">
                              QUAD 🔥
                            </span>
                          )}
                          {isPTriple && !isPQuad && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              isPBull ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                            }`}>
                              TRIPLE ✅
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
