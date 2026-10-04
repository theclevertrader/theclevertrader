'use client';

import React, { useState, useMemo } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { useMarketData, useMarketTicks } from '@/lib/hooks/useMarketData';
import { SmcEngine } from '@/lib/engines/smc-engine';
import { IctEngine } from '@/lib/engines/ict-engine';
import { 
  Layers, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Crosshair,
  Box
} from 'lucide-react';

export default function SmcIctPage() {
  const { selectedSymbol, setSelectedSymbol, candles: liveCandles } = useMarketData();
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol || 'XAUUSD');
  const liveTicks = useMarketTicks();

  const handleSelectSymbol = (sym: string) => {
    setActiveSymbol(sym);
    setSelectedSymbol(sym);
  };

  const candles = useMemo(() => {
    if (liveCandles && liveCandles.length > 10) {
      return liveCandles;
    }
    // Fallback algorithmic candle generator based on live price
    const spec = INSTITUTIONAL_SYMBOLS[activeSymbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const p = liveTicks[activeSymbol]?.price ?? spec.currentPrice;
    const step = spec.pipSize * 5;
    const now = Math.floor(Date.now() / 1000);
    const arr = [];
    for (let i = 40; i >= 0; i--) {
      const close = p - (i * step * 0.4) + (Math.sin(i) * step * 2);
      const open = close - (step * 0.5);
      const high = Math.max(open, close) + step;
      const low = Math.min(open, close) - step;
      arr.push({
        time: now - (i * 900),
        open,
        high,
        low,
        close,
        volume: 1200 + Math.floor(Math.random() * 500),
      });
    }
    return arr;
  }, [liveCandles, activeSymbol, liveTicks]);

  const swings = useMemo(() => SmcEngine.detectSwingPoints(candles, 2), [candles]);
  const events = useMemo(() => SmcEngine.detectStructureEvents(candles, swings), [candles, swings]);
  const obs = useMemo(() => SmcEngine.detectOrderBlocks(candles), [candles]);
  const fvgs = useMemo(() => SmcEngine.detectFairValueGaps(candles), [candles]);
  const sweeps = useMemo(() => SmcEngine.detectLiquiditySweeps(candles, swings), [candles, swings]);
  const premDisc = useMemo(() => SmcEngine.calculatePremiumDiscount(candles), [candles]);
  const killZones = useMemo(() => IctEngine.getKillZones(Date.now()), []);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#09090d] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">SMC & ICT LIQUIDITY ENGINE</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                LIVE ALGO ENGINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Smart Money Concepts • Market Structure Shifts • Order Blocks • Fair Value Gaps • Kill Zones
            </p>
          </div>
        </div>

        {/* Symbol Selector */}
        <div className="flex items-center gap-1.5 bg-[#050508] p-1 rounded-xl border border-white/[0.08]">
          {Object.keys(INSTITUTIONAL_SYMBOLS).map(sym => (
            <button
              key={sym}
              onClick={() => handleSelectSymbol(sym)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSymbol === sym
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* ICT Kill Zones Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {killZones.map(kz => (
          <div
            key={kz.name}
            className={`p-4 rounded-2xl border font-mono space-y-2.5 ${
              kz.isActive
                ? 'bg-[#14141a] border-white/30 text-white shadow-xl ring-1 ring-white/10'
                : 'bg-[#09090d] border-white/[0.08] text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-black tracking-wider">{kz.name} KILL ZONE</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  kz.isActive ? 'bg-emerald-500 text-black' : 'bg-white/[0.04] text-zinc-500'
                }`}
              >
                {kz.isActive ? 'ACTIVE NOW' : 'INACTIVE'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{kz.startHourUtc}:00 UTC - {kz.endHourUtc}:00 UTC</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {kz.name === 'LONDON' && 'High volatility hunt of Asian range liquidity.'}
              {kz.name === 'NEW_YORK' && 'Displacement continuation or Judas reversal off key HTF level.'}
              {kz.name === 'ASIAN' && 'Range accumulation setting the day’s high/low liquidity.'}
            </p>
          </div>
        ))}
      </div>

      {/* Premium vs Discount Equilibrium Box */}
      <div className="p-5 rounded-2xl bg-[#09090d] border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-white" />
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              Fibonacci 50% Equilibrium Matrix ({activeSymbol})
            </h2>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded ${
              premDisc.isDiscount ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            CURRENT STATUS: {premDisc.isDiscount ? 'DISCOUNT ZONE (FAVORS LONGS)' : 'PREMIUM ZONE (FAVORS SHORTS)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#050508] border border-white/[0.06]">
            <span className="text-[10px] text-rose-400 block mb-1">Range High</span>
            <span className="text-base font-bold text-white">{premDisc.highest.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#050508] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 block mb-1">50% Equilibrium</span>
            <span className="text-base font-bold text-white">{premDisc.equilibrium.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#050508] border border-white/[0.06]">
            <span className="text-[10px] text-emerald-400 block mb-1">Range Low</span>
            <span className="text-base font-bold text-white">{premDisc.lowest.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#050508] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 block mb-1">Live Price</span>
            <span className="text-base font-bold text-emerald-400">{premDisc.currentPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Dual Column: Active Order Blocks & Fair Value Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Blocks List */}
        <div className="p-5 rounded-2xl bg-[#09090d] border border-white/[0.08] shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-white" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Institutional Order Blocks (OB)
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold">{obs.length} DETECTED</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
            {obs.slice(-6).map((ob, idx) => {
              const isBull = ob.type === 'BULLISH';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#050508] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBull ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="font-bold text-white">
                      {isBull ? '+OB Demand Zone' : '-OB Supply Zone'}
                    </span>
                  </div>
                  <div className="text-zinc-300 font-mono">
                    {ob.low.toFixed(2)} - {ob.high.toFixed(2)}
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      ob.isMitigated ? 'bg-zinc-800 text-zinc-500' : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {ob.isMitigated ? 'MITIGATED' : 'ACTIVE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fair Value Gaps List */}
        <div className="p-5 rounded-2xl bg-[#09090d] border border-white/[0.08] shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Fair Value Gaps (FVG Imbalance)
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold">{fvgs.length} DETECTED</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
            {fvgs.slice(-6).map((fvg, idx) => {
              const isBull = fvg.type === 'BULLISH';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#050508] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBull ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="font-bold text-white">
                      {isBull ? 'Bullish FVG' : 'Bearish FVG'}
                    </span>
                  </div>
                  <div className="text-zinc-300 font-mono">
                    {fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      fvg.isFilled ? 'bg-zinc-800 text-zinc-500' : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {fvg.isFilled ? 'FILLED' : 'OPEN IMBALANCE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
