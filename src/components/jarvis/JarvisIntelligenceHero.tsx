'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  RefreshCw,
  Coins,
  Percent,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { JarvisIntelligenceBrain, JarvisIntelligenceState } from '@/lib/ai/jarvis-brain';
import { ConfluenceRadialGauge } from '../visualizations/ConfluenceRadialGauge';
import { RiskRewardLadder } from '../visualizations/RiskRewardLadder';

interface JarvisIntelligenceHeroProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenJarvisModal?: () => void;
}

export const JarvisIntelligenceHero: React.FC<JarvisIntelligenceHeroProps> = ({
  activeSymbol = 'EURUSD',
  onSelectSymbol,
  onOpenJarvisModal,
}) => {
  const [intel, setIntel] = useState<JarvisIntelligenceState>(
    JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeepRisk, setShowDeepRisk] = useState<boolean>(false);

  const availableSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'AUDUSD', 'USDCAD'];

  useEffect(() => {
    setIsLoading(true);
    const updated = JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol);
    setIntel(updated);
    setIsLoading(false);
  }, [activeSymbol]);

  const isBuy = intel.masterDirection.includes('BUY');
  const isSell = intel.masterDirection.includes('SELL');

  return (
    <div className="bb-card p-4 rounded-xl border border-white/[0.08] relative overflow-hidden font-sans space-y-3.5">
      {/* Background Subtle Gradient Glow */}
      <div 
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-3xl transition-colors duration-700"
        style={{
          backgroundColor: isBuy ? '#10b981' : isSell ? '#f43f5e' : '#f59e0b'
        }}
      />

      {/* TOP STRIP: Master Signal & Confluence Dial */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Instant Identity & Direction */}
        <div className="flex items-center gap-4">
          {/* Circular Visual Confluence Dial */}
          <div className="shrink-0">
            <ConfluenceRadialGauge 
              score={intel.masterConfluencePercent} 
              size="md" 
              label="SYNTHESIS" 
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>NEXUS CENTRAL AI BRAIN</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                intel.riskProfile.safeguardStatus === 'CLEARED'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {intel.riskProfile.safeguardStatus === 'CLEARED' ? '30M NEWS CLEARED' : 'NEWS BLACKOUT LOCK'}
              </span>
            </div>

            {/* Big Bold Direction Tag */}
            <div className="flex items-center gap-2.5 mt-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{intel.symbol}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-sm sm:text-base font-black tracking-wide border ${
                  isBuy 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : isSell 
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                }`}>
                  {intel.masterDirection.replace('_', ' ')}
                </span>
              </h1>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {intel.regimeTitle}
            </p>
          </div>
        </div>

        {/* Center/Right: Quick Action Strip & Pair Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Symbol Selector Pills */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/[0.08] overflow-x-auto max-w-full">
            {availableSymbols.map(sym => (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  activeSymbol === sym
                    ? 'bg-amber-400 text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Ask NEXUS Copilot Button */}
          {onOpenJarvisModal && (
            <button
              onClick={onOpenJarvisModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs font-mono transition-all shadow-sm hover:scale-105 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>ASK NEXUS AI</span>
            </button>
          )}
        </div>
      </div>

      {/* MIDDLE: 3 Instant Core Pillars & Risk Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
        {/* Pillar 1: CFTC Smart Money */}
        <div className="bb-panel p-2.5 rounded-lg border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              1. CFTC Smart Money
            </span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {(intel.corePillars.cftcSmartMoney.netContracts / 1000).toFixed(1)}k Net Contracts
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {intel.corePillars.cftcSmartMoney.bias}
          </span>
        </div>

        {/* Pillar 2: Central Bank Policy Differential */}
        <div className="bb-panel p-2.5 rounded-lg border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              2. Policy Rate Gap
            </span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {intel.corePillars.rateSpread.spreadPercent}% Differential
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            {intel.corePillars.rateSpread.carryStance}
          </span>
        </div>

        {/* Pillar 3: Quant Technical / SMC */}
        <div className="bb-panel p-2.5 rounded-lg border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              3. SMC & TA-Lib Math
            </span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block truncate">
              {intel.corePillars.technicalSMC.structure} • RSI {intel.corePillars.technicalSMC.rsi.toFixed(0)}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {intel.corePillars.technicalSMC.score}/100
          </span>
        </div>

        {/* Risk Profile & RR Ratio Quick Pill */}
        <div 
          onClick={() => setShowDeepRisk(!showDeepRisk)}
          className="bb-panel p-2.5 rounded-lg border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-amber-400/40 transition-colors"
        >
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Execution Risk Guard
            </span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {intel.riskProfile.recommendedLot} Lot • 1:{intel.riskProfile.riskRewardRatio} RR
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ${intel.riskProfile.maxRiskUsd} SL / ${intel.riskProfile.targetProfitUsd} TP
          </span>
        </div>
      </div>

      {/* Expandable Risk-to-Reward Ladder Drawer */}
      {showDeepRisk && (
        <div className="pt-1">
          <RiskRewardLadder 
            stopLossPips={intel.riskProfile.stopLossPips}
            takeProfitPips={intel.riskProfile.takeProfitPips}
            maxRiskUsd={intel.riskProfile.maxRiskUsd}
            targetProfitUsd={intel.riskProfile.targetProfitUsd}
            lotSize={intel.riskProfile.recommendedLot}
          />
        </div>
      )}

      {/* BOTTOM: Synthesized Roman Urdu Executive Intelligence Verdict */}
      <div className="p-3 rounded-lg bg-[#0a0e17] border border-white/[0.08] flex items-start gap-2.5 text-xs text-slate-200">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong className="text-cyan-400 uppercase font-mono mr-1.5 tracking-wide">
            NEXUS Autonomous Intelligence Synthesis:
          </strong>
          <span className="text-slate-300 leading-relaxed">
            {intel.romanUrduSynthesis}
          </span>
        </div>
      </div>
    </div>
  );
};
